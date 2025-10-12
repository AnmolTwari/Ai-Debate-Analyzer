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

// POST: save transcript and trigger analysis
app.post("/api/save-transcript", (req, res) => {
  try {
    const { transcript, topic } = req.body;

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return res.status(400).json({ error: "Transcript empty or invalid" });
    }

    const timestamp = Date.now();
    const transcriptFile = path.join(dataDir, `transcript_${timestamp}.json`);
    const analyzedFile = path.join(dataDir, `analyzed_transcript_${timestamp}.json`);
    const topicFile = path.join(dataDir, `topic_${timestamp}.json`);

    fs.writeFileSync(transcriptFile, JSON.stringify(transcript, null, 2));
    if (topic) fs.writeFileSync(topicFile, JSON.stringify({ topic }, null, 2));

    console.log("✅ Transcript saved:", transcriptFile);
    console.log("🧠 Running NLP analysis...");

    const scriptPath = path.join(__dirname, "ml-models", "nlp_analysis.py");
    const args = [scriptPath, transcriptFile, dataDir, timestamp.toString()];
    if (topic) args.push(topicFile);

    const py = spawn("python", args);

    let pyOutput = "";
    let pyError = "";

    py.stdout.on("data", (data) => (pyOutput += data.toString()));
    py.stderr.on("data", (data) => (pyError += data.toString()));

    py.on("close", async (code) => {
      console.log(`✅ Python process exited with code ${code}`);
      if (pyError) console.error("❌ PYTHON ERROR:", pyError);
      console.log(pyOutput);

      const waitForFile = (filePath, retries = 10, delay = 1000) =>
        new Promise((resolve, reject) => {
          let tries = 0;
          const check = () => {
            if (fs.existsSync(filePath)) resolve(true);
            else if (tries++ >= retries) reject(new Error("File not found after waiting."));
            else setTimeout(check, delay);
          };
          check();
        });

      try {
        await waitForFile(analyzedFile, 15, 1000);
        const analyzed = JSON.parse(fs.readFileSync(analyzedFile, "utf-8"));
        res.status(200).json({
          message: "Transcript saved and analyzed successfully",
          analyzed,
        });
      } catch (err) {
        console.error("⚠️ Analyzed transcript not found after Python run.");
        res.status(500).json({ error: "Analysis failed or took too long" });
      }
    });
  } catch (err) {
    console.error("❌ Failed to save transcript:", err.message);
    res.status(500).json({ error: "Failed to save transcript" });
  }
});

app.listen(PORT, () =>
  console.log(`✅ Backend running at http://localhost:${PORT}`)
);
