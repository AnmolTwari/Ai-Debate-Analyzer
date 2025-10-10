const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 5000;

// Health check
app.get("/", (req, res) => res.send("✅ AI Debate Analyzer backend is running!"));

// Save transcript and run Python analysis
app.post("/api/save-transcript", (req, res) => {
  try {
    const { transcript } = req.body;

    // Validate payload
    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return res.status(400).json({ error: "Transcript empty or invalid" });
    }

    // Ensure data folder exists
    const dataDir = path.join(__dirname, "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

    // Save transcript file with timestamp
    const timestamp = Date.now();
    const filePath = path.join(dataDir, `transcript_${timestamp}.json`);
    fs.writeFileSync(filePath, JSON.stringify(transcript, null, 2));

    console.log("✅ Transcript saved:", filePath);

    // Run Python analysis asynchronously
    const scriptPath = path.join(__dirname, "ml-models", "nlp_analysis.py");
    exec(`python "${scriptPath}" "${filePath}"`, (err, stdout, stderr) => {
      if (err) {
        console.error("❌ Python error:", stderr || err.message);
      } else {
        console.log("✅ Python analysis output:\n", stdout);
      }
    });

    // Respond to frontend immediately
    res.status(200).json({ message: "Transcript saved and analysis started!" });

  } catch (err) {
    console.error("❌ Failed to save transcript:", err.message);
    res.status(500).json({ error: "Failed to save transcript" });
  }
});

// Get analyzed transcript
app.get("/api/analyze-transcript", (req, res) => {
  const analyzedPath = path.join(__dirname, "data", "analyzed_transcript.json");
  if (!fs.existsSync(analyzedPath)) {
    return res.status(404).json({ error: "No analyzed transcript yet" });
  }
  const analyzed = JSON.parse(fs.readFileSync(analyzedPath, "utf-8"));
  res.json(analyzed);
});

app.listen(PORT, () => console.log(`✅ Backend running at http://localhost:${PORT}`));
