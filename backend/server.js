// backend/server.js
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

// --------------------
// Data directory
// --------------------
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

// Health check
app.get("/", (req, res) => res.send("✅ AI Debate Analyzer backend is running!"));

// --------------------
// Save transcript + run NLP analysis
// --------------------
app.post("/api/save-transcript", (req, res) => {
  try {
    const { transcript } = req.body;

    // Validate payload
    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return res.status(400).json({ error: "Transcript empty or invalid" });
    }

    for (let i = 0; i < transcript.length; i++) {
      const entry = transcript[i];
      if (!entry.speaker || !entry.text) {
        return res.status(400).json({ error: `Invalid entry at index ${i}` });
      }
    }

    const transcriptFile = path.join(dataDir, "transcript.json");
    const analyzedFile = path.join(dataDir, "analyzed_transcript.json");

    // Save raw transcript
    fs.writeFileSync(transcriptFile, JSON.stringify(transcript, null, 2));
    console.log("✅ Transcript saved:", transcriptFile);

    // Send immediate response (frontend doesn’t wait)
    res.status(200).json({
      message: "Transcript saved successfully",
      analyzedFile: path.basename(analyzedFile),
    });

    // --------------------
    // Run Python NLP script asynchronously
    // --------------------
    console.log("🧠 Starting NLP analysis...");
    const scriptPath = path.join(__dirname, "ml-models", "nlp_analysis.py");

    const py = spawn("python", [scriptPath, transcriptFile, dataDir]);

    py.stdout.on("data", (data) => {
      console.log("🐍 PYTHON OUT:", data.toString());
    });

    py.stderr.on("data", (data) => {
      console.error("❌ PYTHON ERROR:", data.toString());
    });

    py.on("close", (code) => {
      console.log(`✅ Python process exited with code ${code}`);
      if (fs.existsSync(analyzedFile)) {
        console.log("✅ Analyzed transcript saved at:", analyzedFile);
      } else {
        console.error("⚠️ No analyzed transcript found. Check Python logs above.");
      }
    });

  } catch (err) {
    console.error("❌ Failed to save transcript:", err.message);
    res.status(500).json({ error: "Failed to save transcript" });
  }
});

// --------------------
// Get analyzed transcript
// --------------------
app.get("/api/analyze-transcript", (req, res) => {
  const analyzedFile = path.join(dataDir, "analyzed_transcript.json");

  if (!fs.existsSync(analyzedFile)) {
    return res.status(404).json({ error: "No analyzed transcript yet" });
  }

  console.log("📂 Returning analyzed transcript:", analyzedFile);
  const analyzed = JSON.parse(fs.readFileSync(analyzedFile, "utf-8"));
  res.json(analyzed);
});

// --------------------
app.listen(PORT, () =>
  console.log(`✅ Backend running at http://localhost:${PORT}`)
);
