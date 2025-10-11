import sys, json, os
from transformers import pipeline
from sentence_transformers import SentenceTransformer, util

def analyze_transcript(input_file, output_file):
    # Load transcript
    with open(input_file, "r") as f:
        transcript = json.load(f)

    print(f"🔍 Loaded {len(transcript)} entries from {input_file}")

    # Load models
    sentiment_model = pipeline("sentiment-analysis")
    emotion_model = pipeline(
        "text-classification",
        model="j-hartmann/emotion-english-distilroberta-base",
        return_all_scores=True
    )
    semantic_model = SentenceTransformer("all-MiniLM-L6-v2")

    # Make a combined topic context
    all_text = " ".join([entry["text"] for entry in transcript])
    topic_embedding = semantic_model.encode(all_text, convert_to_tensor=True)

    analyzed = []
    for entry in transcript:
        text = entry["text"]

        # Sentiment
        sentiment = sentiment_model(text)[0]

        # Emotion
        emotions = emotion_model(text)[0]
        top_emotion = max(emotions, key=lambda x: x["score"])

        # Relevance
        text_embedding = semantic_model.encode(text, convert_to_tensor=True)
        relevance = util.cos_sim(text_embedding, topic_embedding).item()

        analyzed.append({
            "speaker": entry["speaker"],
            "text": text,
            "sentiment": {
                "label": sentiment["label"],
                "score": round(sentiment["score"], 2)
            },
            "emotion": {
                "label": top_emotion["label"].lower(),
                "score": round(top_emotion["score"], 2)
            },
            "relevance": round(relevance, 2)
        })

    # Save JSON file
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, "w") as f:
        json.dump(analyzed, f, indent=2)

    print(f"✅ Analysis saved to {output_file}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python nlp_analysis.py <input_file> <output_file>")
        sys.exit(1)

    analyze_transcript(sys.argv[1], sys.argv[2])
