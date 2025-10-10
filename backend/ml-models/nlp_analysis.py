import json
from transformers import pipeline
from sentence_transformers import SentenceTransformer, util
import sys
import os

if len(sys.argv) < 2:
    print("Error: No input file provided")
    sys.exit(1)

INPUT_FILE = os.path.join(os.path.dirname(__file__), "..", "data", os.path.basename(sys.argv[1]))
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "analyzed_transcript.json")

DEBATE_TOPIC = "Is climate change real?"

with open(INPUT_FILE, "r") as f:
    transcript = json.load(f)

print(f"Loaded {len(transcript)} transcript entries.\n")

print("Loading models...")
sentiment_model = pipeline("sentiment-analysis")
emotion_model = pipeline(
    "text-classification", model="j-hartmann/emotion-english-distilroberta-base"
)
semantic_model = SentenceTransformer("all-MiniLM-L6-v2")
topic_embedding = semantic_model.encode(DEBATE_TOPIC, convert_to_tensor=True)
print("Models loaded successfully.\n")

for entry in transcript:
    text = entry["text"]
    sentiment = sentiment_model(text)[0]
    entry["sentiment"] = {
        "label": sentiment["label"],
        "score": round(sentiment["score"], 2)
    }
    emotion = emotion_model(text)[0]
    entry["emotion"] = {
        "label": emotion["label"],
        "score": round(emotion["score"], 2)
    }
    text_embedding = semantic_model.encode(text, convert_to_tensor=True)
    similarity = util.cos_sim(text_embedding, topic_embedding).item()
    entry["relevance"] = round(similarity, 2)
    print(f"{entry['speaker']}: {text}")
    print(f"  Sentiment: {entry['sentiment']}")
    print(f"  Emotion: {entry['emotion']}")
    print(f"  Relevance: {entry['relevance']}\n")

os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
with open(OUTPUT_FILE, "w") as f:
    json.dump(transcript, f, indent=2)

print(f"✅ Analyzed transcript saved to {OUTPUT_FILE}")