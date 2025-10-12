import json
import sys
import os
from datetime import datetime
from transformers import pipeline
from sentence_transformers import SentenceTransformer, util

# Load models once globally (slow at first load only)
sentiment_model = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
emotion_model = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base", return_all_scores=False)
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def compute_relevance(text, topic_embedding):
    """Measure semantic similarity (relevance) to the general debate topic."""
    text_emb = embedding_model.encode(text, convert_to_tensor=True)
    sim = util.pytorch_cos_sim(text_emb, topic_embedding).item()
    return round(float(sim), 3)

def analyze_transcript(transcript):
    """Real NLP analysis with transformers."""
    total_sentences = len(transcript)
    speakers = list({entry["speaker"] for entry in transcript})
    word_count = sum(len(entry["text"].split()) for entry in transcript)

    # Use the entire transcript as a "topic" for relevance comparison
    full_text = " ".join(entry["text"] for entry in transcript)
    topic_embedding = embedding_model.encode(full_text, convert_to_tensor=True)

    detailed_analysis = []
    for entry in transcript:
        text = entry["text"]

        # Sentiment
        sent = sentiment_model(text)[0]
        sentiment = {
            "label": sent["label"].lower(),
            "score": round(sent["score"], 3)
        }

        # Emotion
        emo = emotion_model(text)[0]
        emotion = {
            "label": emo["label"].lower(),
            "score": round(emo["score"], 3)
        }

        # Relevance
        relevance = compute_relevance(text, topic_embedding)

        detailed_analysis.append({
            "speaker": entry["speaker"],
            "text": text,
            "sentiment": sentiment,
            "emotion": emotion,
            "relevance": relevance
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

def main():
    if len(sys.argv) < 3:
        print("Usage: python nlp_analysis.py <input_file> <output_dir>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_dir = sys.argv[2]

    if not os.path.exists(input_file):
        print(f"❌ Input file not found: {input_file}")
        sys.exit(1)

    try:
        with open(input_file, "r", encoding="utf-8") as f:
            transcript = json.load(f)

        result = analyze_transcript(transcript)
        os.makedirs(output_dir, exist_ok=True)

        # ✅ Always overwrite the same analyzed file
        output_file = os.path.join(output_dir, "analyzed_transcript.json")

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)

        print(f"✅ Analysis saved to {output_file}")

    except Exception as e:
        import traceback
        print("❌ Error analyzing transcript:")
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
