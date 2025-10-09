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

app.get("/", (req, res) => res.send("✅ AI Debate Analyzer backend is running!"));

app.post("/api/save-transcript", (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript || transcript.length === 0) {
      return res.status(400).json({ error: "Transcript empty" });
    }

    const dataDir = path.join(__dirname, "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

    const filePath = path.join(dataDir, `transcript_${Date.now()}.json`);
    fs.writeFileSync(filePath, JSON.stringify(transcript, null, 2));

    console.log("✅ Transcript saved:", filePath);

    // Send response immediately
    res.status(200).json({ message: "Transcript saved successfully" });

    // Run Python asynchronously (background)
    const scriptPath = path.join(__dirname, "ml-models", "nlp_analysis.py");
    exec(`python "${scriptPath}" "${filePath}"`, (err, stdout, stderr) => {
      if (err) {
        console.error("❌ Python error:", stderr || err.message);
      } else {
        console.log("✅ Python output:", stdout);
      }
    });
  } catch (err) {
    console.error("❌ Failed to save transcript:", err.message);
    res.status(500).json({ error: "Failed to save transcript" });
  }
});

app.get("/api/analyze-transcript", (req, res) => {
  const analyzedPath = path.join(__dirname, "data", "analyzed_transcript.json");
  if (!fs.existsSync(analyzedPath)) {
    return res.status(404).json({ error: "No analyzed transcript yet" });
  }
  const analyzed = JSON.parse(fs.readFileSync(analyzedPath, "utf-8"));
  res.json(analyzed);
});

app.listen(PORT, () => console.log(`✅ Backend running at http://localhost:${PORT}`));
