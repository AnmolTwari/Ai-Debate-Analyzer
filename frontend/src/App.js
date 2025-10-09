// src/App.js
import React, { useState } from "react";
import DebateRecorder from "./components/DebateRecorder";
import DebateAnalyzer from "./components/DebateAnalyzer";

function App() {
  const [transcript, setTranscript] = useState([]);
  const [showAnalyzer, setShowAnalyzer] = useState(false);

  const handleDebateEnd = () => setShowAnalyzer(true);

  const handleRestart = () => {
    setTranscript([]);
    setShowAnalyzer(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
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
  );
}

export default App;
