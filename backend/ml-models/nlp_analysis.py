import json
import sys
import os
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
    """
    Simple grammar/spelling check using TextBlob.
    """
    blob = TextBlob(text)
    corrected_text = str(blob.correct())
    # Count corrections as "errors"
    error_count = sum(1 for a, b in zip(text.split(), corrected_text.split()) if a != b)
    suggestions = []  # TextBlob doesn't provide rich suggestions
    return {
        "errors": error_count,
        "suggestions": suggestions,
        "corrected_text": corrected_text,
    }


def generate_judgment(sentiment, emotion, relevance, grammar):
    """
    Combine all signals into human-like qualitative feedback.
    """
    sent_label = sentiment["label"]
    emo_label = emotion["label"]
    rel_score = relevance
    grammar_errors = grammar["errors"]

    feedback_parts = []

    # Grammar aspect
    if grammar_errors == 0:
        feedback_parts.append("✅ Grammatically sound.")
    elif grammar_errors < 3:
        feedback_parts.append("⚠️ Minor grammatical issues.")
    else:
        feedback_parts.append("❌ Several grammatical mistakes detected.")

    # Relevance aspect
    if rel_score > 0.8:
        feedback_parts.append("Highly relevant to the topic.")
    elif rel_score > 0.5:
        feedback_parts.append("Moderately relevant to the discussion.")
    else:
        feedback_parts.append("Seems off-topic or loosely related.")

    # Sentiment & emotion interpretation
    if sent_label == "positive":
        feedback_parts.append("Tone is positive and engaging.")
    elif sent_label == "negative":
        feedback_parts.append("Tone is negative — might appear critical or defensive.")
    else:
        feedback_parts.append("Neutral tone — balanced but could use more energy.")

    if emo_label in ["anger", "disgust"]:
        feedback_parts.append("Try to sound more composed or objective.")
    elif emo_label in ["joy", "surprise"]:
        feedback_parts.append("Emotionally expressive — keeps the debate lively.")
    elif emo_label == "sadness":
        feedback_parts.append("Comes across as empathetic but subdued.")

    return " ".join(feedback_parts)


# -----------------------------
# Main Analysis Function
# -----------------------------
def analyze_transcript(transcript):
    total_sentences = len(transcript)
    speakers = list({entry["speaker"] for entry in transcript})
    word_count = sum(len(entry["text"].split()) for entry in transcript)

    full_text = " ".join(entry["text"] for entry in transcript)
    topic_embedding = embedding_model.encode(full_text, convert_to_tensor=True)

    detailed_analysis = []
    for entry in transcript:
        text = entry["text"]

        sent = sentiment_model(text)[0]
        sentiment = {"label": sent["label"].lower(), "score": round(sent["score"], 3)}

        emo = emotion_model(text)[0]
        emotion = {"label": emo["label"].lower(), "score": round(emo["score"], 3)}

        relevance = compute_relevance(text, topic_embedding)
        grammar = check_grammar(text)
        judgment = generate_judgment(sentiment, emotion, relevance, grammar)

        detailed_analysis.append({
            "speaker": entry["speaker"],
            "text": text,
            "sentiment": sentiment,
            "emotion": emotion,
            "relevance": relevance,
            "grammar": grammar,
            "judgment": judgment
        })

    return {
        "summary": f"Debate involved {len(speakers)} speakers and {total_sentences} sentences.",
        "total_speakers": len(speakers),
        "total_sentences": total_sentences,
        "total_words": word_count,
        "speakers": speakers,
        "timestamp": datetime.now().isoformat(),
        "detailed_analysis": detailed_analysis
    }


# -----------------------------
# Main CLI Function
# -----------------------------
def main():
    if len(sys.argv) < 4:
        print("Usage: python nlp_analysis.py <input_file> <output_dir> <timestamp>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_dir = sys.argv[2]
    timestamp = sys.argv[3]

    if not os.path.exists(input_file):
        print(f"[ERROR] Input file not found: {input_file}")
        sys.exit(1)

    try:
        with open(input_file, "r", encoding="utf-8") as f:
            transcript = json.load(f)

        result = analyze_transcript(transcript)
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
