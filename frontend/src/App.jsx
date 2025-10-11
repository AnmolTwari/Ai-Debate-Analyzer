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
    </div>
  );
}

export default App;
