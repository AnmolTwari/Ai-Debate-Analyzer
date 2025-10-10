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

app.get("/", (req, res) => res.send("✅ AI Debate Analyzer backend is running!"));

// --------------------
// Save transcript
// --------------------
app.post("/api/save-transcript", (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript || transcript.length === 0) {
      return res.status(400).json({ error: "Transcript empty" });
    }

    // Validate each entry
    for (let i = 0; i < transcript.length; i++) {
      const entry = transcript[i];
      if (!entry.speaker || !entry.text) {
        return res.status(400).json({ error: `Invalid entry at index ${i}` });
      }
    }

    const filePath = path.join(dataDir, `transcript_${Date.now()}.json`);
    fs.writeFileSync(filePath, JSON.stringify(transcript, null, 2));
    console.log("✅ Transcript saved:", filePath);

    // Unique analyzed filename
    const analyzedFileName = `analyzed_transcript_${Date.now()}.json`;
    const analyzedFilePath = path.join(dataDir, analyzedFileName);

    // Send response immediately
    res.status(200).json({ 
      message: "Transcript saved successfully", 
      analyzedFile: analyzedFileName 
    });

    // Run Python asynchronously (background)
    const scriptPath = path.join(__dirname, "ml-models", "nlp_analysis.py");
    const py = spawn("python", [scriptPath, filePath, analyzedFilePath]);

    py.stdout.on("data", (data) => {
      console.log("Python:", data.toString());
    });

    py.stderr.on("data", (data) => {
      console.error("Python error:", data.toString());
    });

    py.on("close", (code) => {
      console.log(`Python process exited with code ${code}`);
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
  const { file } = req.query;
  if (!file) return res.status(400).json({ error: "No file specified" });

  const analyzedPath = path.join(dataDir, file);
  if (!fs.existsSync(analyzedPath)) {
    return res.status(404).json({ error: "Analyzed file not found" });
  }

  const analyzed = JSON.parse(fs.readFileSync(analyzedPath, "utf-8"));
  res.json(analyzed);
});

// --------------------
app.listen(PORT, () => console.log(`✅ Backend running at http://localhost:${PORT}`));
