const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 5000;
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

app.get("/", (req, res) => res.send("✅ AI Debate Analyzer backend is running!"));

// Save transcript + run NLP analysis
app.post("/api/save-transcript", (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return res.status(400).json({ error: "Transcript empty or invalid" });
    }

    for (let i = 0; i < transcript.length; i++) {
      const entry = transcript[i];
      if (!entry.speaker || !entry.text) {
        return res.status(400).json({ error: `Invalid entry at index ${i}` });
      }
    }

    const timestamp = Date.now();
    const transcriptFile = path.join(dataDir, `transcript_${timestamp}.json`);
    const analyzedFile = path.join(dataDir, `analyzed_transcript_${timestamp}.json`);

    fs.writeFileSync(transcriptFile, JSON.stringify(transcript, null, 2));
    console.log("✅ Transcript saved:", transcriptFile);

    res.status(200).json({
      message: "Transcript saved successfully",
      transcriptFile: path.basename(transcriptFile),
      analyzedFile: path.basename(analyzedFile)
    });

    console.log("🧠 Starting NLP analysis...");
    const scriptPath = path.join(__dirname, "ml-models", "nlp_analysis.py");

    // Run Python NLP script asynchronously
    const py = spawn("python", [scriptPath, transcriptFile, dataDir, timestamp.toString()]);


    py.stdout.on("data", (data) => console.log("🐍 PYTHON OUT:", data.toString()));
    py.stderr.on("data", (data) => console.error("❌ PYTHON ERROR:", data.toString()));

    py.on("close", (code) => {
  console.log(`✅ Python process exited with code ${code}`);

  // Wait a small delay to ensure file is fully written
  setTimeout(() => {
    const files = fs.readdirSync(dataDir)
      .filter(f => f.startsWith("analyzed_transcript_") && f.endsWith(".json"))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.error("⚠️ No analyzed transcript found. Check Python logs above.");
    } else {
      console.log("✅ Latest analyzed transcript saved at:", path.join(dataDir, files[0]));
    }
  }, 500); // half-second delay
});

  } catch (err) {
    console.error("❌ Failed to save transcript:", err.message);
    res.status(500).json({ error: "Failed to save transcript" });
  }
});

// Get latest analyzed transcript
app.get("/api/analyze-transcript", (req, res) => {
  const files = fs.readdirSync(dataDir)
    .filter(f => f.startsWith("analyzed_transcript_") && f.endsWith(".json"))
    .sort()
    .reverse();

  if (files.length === 0) {
    return res.status(404).json({ error: "No analyzed transcript yet" });
  }

  const latestFile = path.join(dataDir, files[0]);
  console.log("📂 Returning latest analyzed transcript:", latestFile);

  try {
    const analyzed = JSON.parse(fs.readFileSync(latestFile, "utf-8"));
    res.json(analyzed);
  } catch (err) {
    console.error("❌ Failed to read analyzed transcript:", err);
    res.status(500).json({ error: "Failed to read analyzed transcript" });
  }
});

app.listen(PORT, () => console.log(`✅ Backend running at http://localhost:${PORT}`));
