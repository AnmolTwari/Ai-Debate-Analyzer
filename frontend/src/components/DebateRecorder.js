// src/components/DebateRecorder.js
import React, { useState, useRef } from "react";

function DebateRecorder({ transcript, setTranscript, onEndDebate }) {
  const [numSpeakers, setNumSpeakers] = useState(2);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);

  const startRecognition = (speaker) => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript((prev) => [...prev, { speaker, text }]);
      setActiveSpeaker(null);
    };

    recognition.onerror = (err) => {
      if (err.error === "no-speech") alert("No speech detected. Please try again.");
      else console.error("Recognition error:", err);
      setActiveSpeaker(null);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setActiveSpeaker(speaker);
  };

  const saveTranscript = async () => {
    if (transcript.length === 0) return;
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/save-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      const text = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${text}`);

      const data = JSON.parse(text);
      console.log("Transcript saved:", data);
      alert("✅ Transcript saved successfully!");
      onEndDebate(); // Move to analyzer
    } catch (err) {
      console.error("Error saving transcript:", err);
      alert("❌ Failed to save transcript. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const clearTranscript = () => setTranscript([]);

  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">AI Debate Analyzer</h2>

      {/* Speaker count selector */}
      <div className="mb-4">
        <label className="font-medium mr-2">Select number of speakers:</label>
        <select
          value={numSpeakers}
          onChange={(e) => {
            setNumSpeakers(Number(e.target.value));
            setTranscript([]); // reset transcript on speaker change
          }}
          className="border rounded p-2"
        >
          {[2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* Dynamic speaker buttons */}
      <div className="flex justify-center flex-wrap gap-4 mb-6">
        {Array.from({ length: numSpeakers }, (_, i) => `Speaker ${i + 1}`).map(
          (speaker) => (
            <button
              key={speaker}
              className={`px-4 py-2 rounded-lg text-white ${
                activeSpeaker === speaker
                  ? "bg-gray-400"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              onClick={() => startRecognition(speaker)}
              disabled={activeSpeaker !== null || loading}
            >
              🎙️ {speaker}
            </button>
          )
        )}
      </div>

      {/* Transcript display */}
      <div className="bg-gray-100 p-4 rounded-lg text-left max-w-lg mx-auto">
        <h3 className="font-semibold mb-2">Transcript:</h3>
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

      {/* Buttons */}
      <div className="mt-4 flex gap-4 justify-center">
        <button
          className={`px-4 py-2 rounded-lg text-white ${
            loading ? "bg-gray-400" : "bg-purple-600 hover:bg-purple-700"
          }`}
          onClick={saveTranscript}
          disabled={transcript.length === 0 || loading}
        >
          {loading ? "Saving..." : "💾 Save Transcript"}
        </button>

        <button
          className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white"
          onClick={clearTranscript}
        >
          🗑️ Clear
        </button>
      </div>
    </div>
  );
}

export default DebateRecorder;
