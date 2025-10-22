// src/components/DebateRecorder.jsx
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
      const response = await fetch("https://ai-debate-analyzer-3.onrender.com/api/save-transcript", {
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
      alert(`❌ Failed to save transcript: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearTranscript = () => setTranscript([]);

  return (
    <div className="debate-recorder-container">
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">AI Debate Analyzer</h2>

        <div className="mb-4">
          <label className="font-medium mr-2">Select number of speakers:</label>
          <select
            value={numSpeakers}
            onChange={(e) => setNumSpeakers(Number(e.target.value))}
            className="border rounded p-2"
          >
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-center flex-wrap gap-4 mb-6">
          {Array.from({ length: numSpeakers }, (_, i) => `Speaker ${i + 1}`).map(
            (speaker) => (
              <button
                key={speaker}
                onClick={() => startRecognition(speaker)}
                disabled={activeSpeaker !== null || loading}
                className={`px-4 py-2 rounded-lg text-white ${
                  activeSpeaker === speaker
                    ? "bg-gray-400"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                🎙️ {speaker}
              </button>
            )
          )}
        </div>

        <div className="mt-4 flex gap-4 justify-center">
          <button
            onClick={saveTranscript}
            disabled={loading || transcript.length === 0}
            className={`px-4 py-2 rounded-lg text-white ${
              loading ? "bg-gray-400" : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {loading ? "Saving..." : "💾 Save & Analyze"}
          </button>
          <button
            onClick={clearTranscript}
            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white"
          >
            🗑️ Clear
          </button>
        </div>
      </div>
    </div>
  );
}

export default DebateRecorder;
