// server.js
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
// Data directory setup
// --------------------
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

// Health check
app.get("/", (req, res) => res.send("✅ AI Debate Analyzer backend is running!"));

// --------------------
// Save transcript and trigger Python NLP
// --------------------
app.post("/api/save-transcript", (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return res.status(400).json({ error: "Transcript is empty or invalid" });
    }

    // Validate entries
    for (let i = 0; i < transcript.length; i++) {
      const entry = transcript[i];
      if (!entry.speaker || !entry.text) {
        return res.status(400).json({ error: `Invalid entry at index ${i}` });
      }
    }

    // Save transcript JSON
    const timestamp = Date.now();
    const transcriptFile = path.join(dataDir, `transcript_${timestamp}.json`);
    fs.writeFileSync(transcriptFile, JSON.stringify(transcript, null, 2));
    console.log("✅ Transcript saved:", transcriptFile);

    // Output file path for Python
    const analyzedOutputDir = dataDir; // same folder
    const analyzedFileName = `analyzed_transcript_${timestamp}.json`;
    const analyzedFilePath = path.join(analyzedOutputDir, analyzedFileName);

    // Respond immediately (non-blocking)
    res.status(200).json({
      message: "Transcript saved successfully. Analysis started...",
      analyzedFile: analyzedFileName,
    });

    // --------------------
    // Run Python asynchronously
    // --------------------
    const scriptPath = path.join(__dirname, "ml-models", "nlp_analysis.py");
    const py = spawn("python", [scriptPath, transcriptFile, analyzedOutputDir]);

    py.stdout.on("data", (data) => console.log("🐍 Python:", data.toString()));
    py.stderr.on("data", (data) => console.error("❌ Python error:", data.toString()));
    py.on("close", (code) => {
      console.log(`⚙️ Python process exited with code ${code}`);
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
  try {
    const files = fs.readdirSync(dataDir).filter(f => f.startsWith("analyzed_transcript_"));
    if (files.length === 0) {
      return res.status(404).json({ error: "No analyzed transcript found yet" });
    }

    // Get the latest analyzed file
    const latestFile = files
      .map(f => ({
        name: f,
        time: fs.statSync(path.join(dataDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time)[0].name;

    const latestPath = path.join(dataDir, latestFile);
    const analyzedData = JSON.parse(fs.readFileSync(latestPath, "utf-8"));

    console.log(`✅ Serving analyzed transcript: ${latestFile}`);
    res.json(analyzedData);
  } catch (err) {
    console.error("❌ Failed to read analyzed transcript:", err);
    res.status(500).json({ error: "Failed to read analyzed transcript" });
  }
});

// --------------------
app.listen(PORT, () =>
  console.log(`✅ Backend running at http://localhost:${PORT}`)
);
