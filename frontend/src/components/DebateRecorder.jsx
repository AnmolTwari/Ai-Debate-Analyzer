import React, { useState, useRef } from "react";
import "../App.css"; // Ensure this imports your global CSS

function DebateRecorder({ transcript, setTranscript, onEndDebate, onAnalysisReady }) {
  const [numSpeakers, setNumSpeakers] = useState(2);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);

  const startRecognition = (speaker) => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech Recognition not supported in this browser. Try Chrome desktop.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setActiveSpeaker(speaker);

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript.trim();
      if (text) {
        setTranscript((prev) => [...prev, { speaker, text }]);
      } else {
        alert("No speech detected. Please try again.");
      }
      setActiveSpeaker(null);
    };

    recognition.onerror = (event) => {
      console.error("Recognition error:", event.error);
      alert(`Speech recognition error: ${event.error}`);
      setActiveSpeaker(null);
    };

    recognition.onend = () => setActiveSpeaker(null);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const saveTranscript = async () => {
    if (transcript.length === 0) return alert("No transcript to save.");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/save-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save transcript");

      console.log("✅ Transcript saved and analyzed:", data);
      alert("✅ Transcript analyzed successfully!");
      if (onAnalysisReady) onAnalysisReady(data.analyzed);

      onEndDebate();
    } catch (err) {
      console.error("Error saving transcript:", err);
    } finally {
      setLoading(false);
    }
  };

  const clearTranscript = () => setTranscript([]);

  return (
    <div className="debate-recorder-container">
      {/* Left Side: Controls */}
      <div className="recorder-left">
        <h2 className="heading">AI Debate Analyzer</h2>

        <div className="select-speakers">
          <label className="label">Select number of speakers:</label>
          <select
            value={numSpeakers}
            onChange={(e) => setNumSpeakers(Number(e.target.value))}
            className="speaker-select"
          >
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="speaker-buttons">
          {Array.from({ length: numSpeakers }, (_, i) => `Speaker ${i + 1}`).map(
            (speaker) => (
              <button
                key={speaker}
                onClick={() => startRecognition(speaker)}
                disabled={activeSpeaker !== null || loading}
                className={`speaker-btn ${activeSpeaker === speaker ? "active" : ""}`}
              >
                🎙️ {speaker}
              </button>
            )
          )}
        </div>

        <div className="action-buttons">
          <button
            onClick={saveTranscript}
            disabled={loading || transcript.length === 0}
            className={`save-btn ${loading ? "loading" : ""}`}
          >
            {loading ? "Saving..." : "💾 Save & Analyze"}
          </button>
          <button onClick={clearTranscript} className="clear-btn">
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Right Side: Transcript Chatbox */}
      <div className="transcript-box">
        {transcript.map((entry, index) => (
          <div
            key={index}
            className={`transcript-message ${entry.speaker ? "speaker" : ""}`}
          >
            <strong>{entry.speaker}:</strong> {entry.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DebateRecorder;
