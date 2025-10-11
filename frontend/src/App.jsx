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
    <div className="gradient-bg center-content p-6 relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Main content container with glass morphism */}
      <div className="w-full max-w-4xl glass-container rounded-3xl p-8 relative z-10">
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
