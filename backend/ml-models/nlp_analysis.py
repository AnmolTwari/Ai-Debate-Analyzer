import sys, os, json
from transformers import pipeline
from sentence_transformers import SentenceTransformer, util

if len(sys.argv) < 2:
    print("❌ No input file provided")
    sys.exit(1)

INPUT_FILE = sys.argv[1]
OUTPUT_FILE = os.path.join(os.path.dirname(INPUT_FILE), "analyzed_transcript.json")

DEBATE_TOPIC = "Is climate change real?"

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    transcript = json.load(f)

# Load models
sentiment_model = pipeline("sentiment-analysis")
emotion_model = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base")
semantic_model = SentenceTransformer("all-MiniLM-L6-v2")
topic_embedding = semantic_model.encode(DEBATE_TOPIC, convert_to_tensor=True)

# Analyze transcript
for entry in transcript:
    text = entry["text"]
    sentiment = sentiment_model(text)[0]
    emotion = emotion_model(text)[0]
    text_embedding = semantic_model.encode(text, convert_to_tensor=True)
    similarity = util.cos_sim(text_embedding, topic_embedding).item()

    entry["sentiment"] = {"label": sentiment["label"], "score": round(sentiment["score"], 2)}
    entry["emotion"] = {"label": emotion["label"], "score": round(emotion["score"], 2)}
    entry["relevance"] = round(similarity, 2)

# Save analyzed transcript
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(transcript, f, indent=2, ensure_ascii=False)

print(f"✅ Analyzed transcript saved to: {OUTPUT_FILE}")
