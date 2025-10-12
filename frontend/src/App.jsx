// src/App.jsx
import React, { useState } from "react";
import DebateRecorder from "./components/DebateRecorder.jsx";
import DebateAnalyzer from "./components/DebateAnalyzer.jsx";
import "./App.css";

function App() {
  const [transcript, setTranscript] = useState([]);
  const [showAnalyzer, setShowAnalyzer] = useState(false);

  const handleDebateEnd = () => setShowAnalyzer(true);
  const handleRestart = () => {
    setTranscript([]);
    setShowAnalyzer(false);
  };

  return (
    <div className="app-container">
      {/* Background Blobs */}
      <div className="background-blobs">
        <div className="blob purple"></div>
        <div className="blob yellow"></div>
        <div className="blob pink"></div>
      </div>

      {/* Main Glass Box */}
      <div className="main-card">
        {!showAnalyzer ? (
          <DebateRecorder
            transcript={transcript}
            setTranscript={setTranscript}
            onEndDebate={handleDebateEnd}
          />
        ) : (
          <DebateAnalyzer onRestart={handleRestart} />
        )}
      </div>

      {/* Transcript Box on the right */}
      <div className="transcript-box">
        <h3 className="font-semibold mb-2">Transcript</h3>
        {transcript.length === 0 ? (
          <p className="text-gray-500">No transcript yet</p>
        ) : (
          <ul>
            {transcript.map((entry, index) => (
              <li key={index}>
                <b>{entry.speaker}:</b> {entry.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>

  );
}

export default App;
