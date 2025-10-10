import json
from transformers import pipeline
from sentence_transformers import SentenceTransformer, util
import os

# -----------------------------
# Ask user for number of speakers
# -----------------------------
while True:
    try:
        num_speakers = int(input("Enter number of speakers (2-6): "))
        if 2 <= num_speakers <= 6:
            break
        else:
            print("Please enter a number between 2 and 6.")
    except ValueError:
        print("Invalid input. Please enter a number.")

# -----------------------------
# Ask user for debate topic
# -----------------------------
DEBATE_TOPIC = input("Enter the debate topic: ").strip()
print(f"\nTopic set to: '{DEBATE_TOPIC}'\n")

# -----------------------------
# Collect speeches from each speaker
# -----------------------------
transcript = []
for i in range(1, num_speakers + 1):
    text = input(f"Enter speech for Speaker {i}: ").strip()
    transcript.append({"speaker": f"Speaker {i}", "text": text})

# -----------------------------
# Load NLP models
# -----------------------------
print("\nLoading models (this may take a few seconds)...")
sentiment_model = pipeline("sentiment-analysis")
emotion_model = pipeline(
    "text-classification", model="j-hartmann/emotion-english-distilroberta-base", return_all_scores=True
)
semantic_model = SentenceTransformer("all-MiniLM-L6-v2")
topic_embedding = semantic_model.encode(DEBATE_TOPIC, convert_to_tensor=True)
print("Models loaded successfully.\n")

# -----------------------------
# Analyze each transcript entry
# -----------------------------
for entry in transcript:
    text = entry["text"]

    # Sentiment
    sentiment = sentiment_model(text)[0]
    entry["sentiment"] = {
        "label": sentiment["label"],
        "score": round(sentiment["score"], 3)
    }

    # Emotion
    emotions = emotion_model(text)[0]
    top_emotion = max(emotions, key=lambda x: x["score"])
    entry["emotion"] = {
        "label": top_emotion["label"],
        "score": round(top_emotion["score"], 3)
    }

    # Relevance
    text_embedding = semantic_model.encode(text, convert_to_tensor=True)
    similarity = util.cos_sim(text_embedding, topic_embedding).item()
    entry["relevance"] = round(similarity, 3)

    # Print feedback
    print(f"{entry['speaker']}: {text}")
    print(f"  Sentiment: {entry['sentiment']}")
    print(f"  Emotion: {entry['emotion']}")
    print(f"  Relevance: {entry['relevance']}\n")

# -----------------------------
# Save analyzed transcript
# -----------------------------
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "analyzed_transcript.json")
os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
with open(OUTPUT_FILE, "w") as f:
    json.dump(transcript, f, indent=2)

print(f"✅ Analyzed transcript saved to {OUTPUT_FILE}")