# ml-models/nlp_analysis.py
import json
import sys
import os
from datetime import datetime

def analyze_transcript(transcript):
    """Fake NLP analysis — replace with your actual logic later."""
    total_sentences = len(transcript)
    speakers = list({entry["speaker"] for entry in transcript})
    word_count = sum(len(entry["text"].split()) for entry in transcript)

    return {
        "summary": f"Debate involved {len(speakers)} speakers and {total_sentences} sentences.",
        "total_speakers": len(speakers),
        "total_sentences": total_sentences,
        "total_words": word_count,
        "speakers": speakers,
        "timestamp": datetime.now().isoformat(),
    }

def main():
    if len(sys.argv) < 3:
        print("Usage: python nlp_analysis.py <input_file> <output_dir>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_dir = sys.argv[2]

    # ✅ Check input file exists
    if not os.path.exists(input_file):
        print(f"❌ Input file not found: {input_file}")
        sys.exit(1)

    try:
        with open(input_file, "r", encoding="utf-8") as f:
            transcript = json.load(f)

        # Perform mock NLP analysis
        result = analyze_transcript(transcript)

        # ✅ Ensure output dir exists
        os.makedirs(output_dir, exist_ok=True)

        # ✅ Create output file with timestamp
        timestamp = int(datetime.now().timestamp())
        output_file = os.path.join(output_dir, f"analyzed_transcript_{timestamp}.json")

        # ✅ Save JSON
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)

        print(f"✅ Analysis saved to {output_file}")
    except Exception as e:
        print(f"❌ Error analyzing transcript: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
