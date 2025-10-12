import json
import sys
import os
import random
from datetime import datetime
from transformers import pipeline
from sentence_transformers import SentenceTransformer, util
from textblob import TextBlob

# -----------------------------
# Load models globally
# -----------------------------
print("[INFO] Loading NLP models... (first time only, may take a minute)")

sentiment_model = pipeline(
    "sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english"
)
emotion_model = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    return_all_scores=False,
)
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

print("[OK] Models loaded successfully.")


# -----------------------------
# Utility Functions
# -----------------------------
def compute_relevance(text, topic_embedding):
    text_emb = embedding_model.encode(text, convert_to_tensor=True)
    sim = util.pytorch_cos_sim(text_emb, topic_embedding).item()
    return round(float(sim), 3)


def check_grammar(text):
    blob = TextBlob(text)
    corrected_text = str(blob.correct())
    error_count = sum(1 for a, b in zip(text.split(), corrected_text.split()) if a != b)
    return {
        "errors": error_count,
        "corrected_text": corrected_text,
    }


def pick(options):
    """Randomly pick a phrase from a list."""
    return random.choice(options)


# -----------------------------
# Human-Like Feedback Generator
# -----------------------------
def generate_judgment(sentiment, emotion, relevance, grammar):
    sent_label = sentiment["label"]
    emo_label = emotion["label"]
    rel_score = relevance
    grammar_errors = grammar["errors"]

    feedback_parts = []

    # ---- Grammar feedback ----
    if grammar_errors == 0:
        feedback_parts.append(pick([
            "Your phrasing flows effortlessly — not a single grammatical hitch.",
            "Flawless grammar. Everything reads clean and natural.",
            "Impressive clarity — not a single typo or awkward phrasing in sight."
        ]))
    elif grammar_errors < 3:
        feedback_parts.append(pick([
            "A couple of minor grammar slips, but the message still shines through.",
            "Slight grammatical bumps — barely noticeable though.",
            "Tiny language hiccups here and there; nothing distracting."
        ]))
    else:
        feedback_parts.append(pick([
            "Quite a few grammar issues here — it makes the message a bit hard to follow.",
            "Grammar could use some love; parts of this feel rushed or unpolished.",
            "Multiple grammatical errors — a quick proofread would make a huge difference."
        ]))

    # ---- Relevance feedback ----
    if rel_score > 0.8:
        feedback_parts.append(pick([
            "You stayed right on point — every word ties beautifully into the topic.",
            "Highly relevant. You clearly kept the main theme in focus.",
            "Laser-focused on the subject; that clarity really strengthens your argument."
        ]))
    elif rel_score > 0.5:
        feedback_parts.append(pick([
            "Some parts are spot-on, others drift a little. Still, you manage to stay mostly aligned with the topic.",
            "Fairly relevant overall, though a few tangents sneak in.",
            "Your ideas connect to the topic, but could use a bit more precision in parts."
        ]))
    else:
        feedback_parts.append(pick([
            "Feels a bit detached from the main topic — maybe tie your points back more clearly.",
            "This section wanders off-topic; try anchoring it closer to the core discussion.",
            "Not entirely on theme — refocusing would make it more coherent."
        ]))

    # ---- Sentiment feedback ----
    if sent_label == "positive":
        feedback_parts.append(pick([
            "Your tone feels warm and confident — it’s pleasant to read.",
            "You come across as upbeat and engaging. It adds life to your response.",
            "Positive tone all around — it draws the reader in naturally."
        ]))
    elif sent_label == "negative":
        feedback_parts.append(pick([
            "The tone leans critical — might sound defensive if not balanced.",
            "Your phrasing feels a bit harsh. Maybe soften the edges a little?",
            "Comes off somewhat negative; try framing critiques in a more constructive tone."
        ]))
    else:
        feedback_parts.append(pick([
            "Neutral tone — calm and even, though a bit more energy could make it pop.",
            "Balanced delivery. You’re measured, but it could use a touch more personality.",
            "It’s neutral and steady — consider adding emotional color for more engagement."
        ]))

    # ---- Emotion feedback ----
    if emo_label in ["anger", "disgust"]:
        feedback_parts.append(pick([
            "The emotional undercurrent feels tense — try sounding a bit more composed.",
            "You sound frustrated; grounding your points in calm reasoning would help.",
            "Emotion runs high here — pulling back slightly could make it more persuasive."
        ]))
    elif emo_label in ["joy", "surprise"]:
        feedback_parts.append(pick([
            "Your energy and expressiveness stand out — it keeps the reader interested.",
            "Joyful and lively delivery — really adds character to your response.",
            "Emotionally vibrant — the passion comes through in a good way."
        ]))
    elif emo_label == "sadness":
        feedback_parts.append(pick([
            "Comes across as gentle and empathetic, though slightly subdued.",
            "There’s a quiet sadness to your tone — it’s heartfelt but could use a lift.",
            "Soft and emotional — shows depth, but might feel too reserved."
        ]))
    else:
        feedback_parts.append(pick([
            "Emotionally steady — well-balanced delivery overall.",
            "Even-tempered expression — clear without being flat.",
            "Controlled emotion — maintains a professional tone."
        ]))

    # ---- Contextual blend ----
    if rel_score > 0.8 and sent_label == "positive":
        feedback_parts.append(pick([
            "Strongly focused *and* full of positive energy — that’s a rare combo.",
            "You manage to stay relevant and optimistic at once — excellent tone.",
            "Engaged, on-topic, and uplifting — a genuinely strong contribution."
        ]))
    elif rel_score < 0.5 and sent_label == "negative":
        feedback_parts.append(pick([
            "Since it drifts off-topic and feels a bit harsh, it might come across as dismissive.",
            "Critical tone plus low relevance makes it sound disconnected — refocus your argument.",
            "You sound frustrated and a little off-track; reconnecting with the main idea would help."
        ]))

    # Combine everything with natural flow
    feedback = " ".join(feedback_parts)
    return feedback.strip()


# -----------------------------
# Main Analysis Function
# -----------------------------
def analyze_transcript(transcript, topic=None):
    total_sentences = len(transcript)
    speakers = list({entry["speaker"] for entry in transcript})
    word_count = sum(len(entry["text"].split()) for entry in transcript)

    if topic and isinstance(topic, str) and topic.strip():
        print(f"[INFO] Using provided topic for relevance: {topic}")
        topic_embedding = embedding_model.encode(topic, convert_to_tensor=True)
    else:
        full_text = " ".join(entry["text"] for entry in transcript)
        topic_embedding = embedding_model.encode(full_text, convert_to_tensor=True)

    detailed_analysis = []
    speaker_stats = {spk: {"grammar_errors": [], "relevance": []} for spk in speakers}

    for entry in transcript:
        text = entry["text"]
        speaker = entry["speaker"]

        sent = sentiment_model(text)[0]
        sentiment = {"label": sent["label"].lower(), "score": round(sent["score"], 3)}

        emo = emotion_model(text)[0]
        emotion = {"label": emo["label"].lower(), "score": round(emo["score"], 3)}

        relevance = compute_relevance(text, topic_embedding)
        grammar = check_grammar(text)
        judgment = generate_judgment(sentiment, emotion, relevance, grammar)

        speaker_stats[speaker]["grammar_errors"].append(grammar["errors"])
        speaker_stats[speaker]["relevance"].append(relevance)

        detailed_analysis.append({
            "speaker": speaker,
            "text": text,
            "sentiment": sentiment,
            "emotion": emotion,
            "relevance": relevance,
            "grammar": grammar,
            "judgment": judgment
        })

    # Speaker-wise summary
    speaker_summary = {}
    for spk, stats in speaker_stats.items():
        avg_grammar = sum(stats["grammar_errors"]) / len(stats["grammar_errors"])
        avg_relevance = sum(stats["relevance"]) / len(stats["relevance"])

        grammar_comment = pick([
            "Your writing reads effortlessly — very few grammar hiccups.",
            "Your grammar is mostly solid, with just tiny slips here and there.",
            "A few grammatical quirks show up, but your intent stays clear.",
            "Grammar needs a bit of fine-tuning, though your ideas come through strongly."
        ]) if avg_grammar else pick([
            "Grammar is spotless — beautifully written sentences.",
            "Fluent and clean. It’s a pleasure to read your phrasing.",
            "Not a single grammatical flaw; it’s all very natural."
        ])

        if avg_relevance > 0.8:
            relevance_comment = pick([
                "You stay laser-focused on the discussion — every point feels purposeful.",
                "Your arguments connect neatly to the topic — keeps things cohesive.",
                "You consistently bring the conversation back to the main idea. Nicely done."
            ])
        elif avg_relevance > 0.5:
            relevance_comment = pick([
                "You’re mostly on track, though some parts could stick closer to the theme.",
                "A few of your statements drift a little, but overall relevance is good.",
                "You hold the thread of the discussion well, with small detours here and there."
            ])
        else:
            relevance_comment = pick([
                "Some contributions feel detached from the core theme — try re-anchoring them.",
                "You sometimes lose sight of the topic; clearer linkage would help.",
                "Your ideas are interesting, but not always tied to the main discussion."
            ])

        speaker_summary[spk] = f"{grammar_comment} {relevance_comment}"

    return {
        "summary": f"Debate involved {len(speakers)} speakers and {total_sentences} sentences.",
        "total_speakers": len(speakers),
        "total_sentences": total_sentences,
        "total_words": word_count,
        "speakers": speakers,
        "timestamp": datetime.now().isoformat(),
        "detailed_analysis": detailed_analysis,
        "speaker_summary": speaker_summary
    }


# -----------------------------
# Main CLI Entry
# -----------------------------
def main():
    if len(sys.argv) < 4:
        print("Usage: python nlp_analyser.py <input_file> <output_dir> <timestamp> [topic_file]")
        sys.exit(1)

    input_file = sys.argv[1]
    output_dir = sys.argv[2]
    timestamp = sys.argv[3]
    topic = None

    if len(sys.argv) >= 5:
        topic_file = sys.argv[4]
        if os.path.exists(topic_file):
            with open(topic_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                topic = data.get("topic")

    try:
        with open(input_file, "r", encoding="utf-8") as f:
            transcript = json.load(f)

        result = analyze_transcript(transcript, topic)
        os.makedirs(output_dir, exist_ok=True)
        output_file = os.path.join(output_dir, f"analyzed_transcript_{timestamp}.json")

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)

        print(f"[OK] Analysis saved to {output_file}")
    except Exception:
        import traceback
        print("[ERROR] Error analyzing transcript:")
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
