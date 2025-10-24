import React, { useState } from "react";
import DebateRecorder from "./components/DebateRecorder.jsx";
import DebateAnalyzer from "./components/DebateAnalyzer.jsx";
import "./App.css";

function App() {
  const [transcript, setTranscript] = useState([]);
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [topic, setTopic] = useState("");

  // When debate ends
  const handleDebateEnd = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic before analyzing!");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/save-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, topic }),
      });

      const data = await res.json();
      if (data.analyzed) {
        setAnalysis(data.analyzed);  // Set the analysis data
        setShowAnalyzer(true);  // Show the Analyzer component
      } else {
        console.error("Analysis data not found.");
      }
    } catch (err) {
      console.error("Error sending transcript:", err);
    }
  };

  // Restart debate
  const handleRestart = () => {
    setTranscript([]);
    setShowAnalyzer(false);
    setAnalysis(null);
    setTopic("");
  };

  return (
    <div className="app-container">
      <div className="background-blobs">
        <div className="blob purple"></div>
        <div className="blob yellow"></div>
        <div className="blob pink"></div>
      </div>

      {/* Main Glass Box */}
      <div className="main-card">
        {!showAnalyzer ? (
          <div className="debate-recorder-container" style={{ overflow: "hidden" }}>
            <div className="mb-4">
              <label className="block font-semibold mb-2">🧩 Enter Debate Topic:</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Impact of AI on Education"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <DebateRecorder
              transcript={transcript}
              setTranscript={setTranscript}
              onEndDebate={handleDebateEnd}
              onAnalysisReady={setAnalysis}
            />
          </div>
        ) : (
          <DebateAnalyzer analysis={analysis} onRestart={handleRestart} />
        )}
      </div>
    </div>
  );
}

export default App;
