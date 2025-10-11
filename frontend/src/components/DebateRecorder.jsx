// src/components/DebateRecorder.jsx
import React, { useState, useRef } from "react";

function DebateRecorder({ transcript, setTranscript, onEndDebate }) {
  const [numSpeakers, setNumSpeakers] = useState(2);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
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

  const fetchAnalysis = async (retries = 5) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch("http://localhost:5000/api/analyze-transcript");
        const data = await res.json();

        if (res.ok) {
          console.log("✅ Analyzed transcript fetched:", data);
          setAnalysis(data);
          return;
        } else {
          console.warn("⏳ Waiting for analysis to complete...");
        }
      } catch (err) {
        console.error("❌ Error fetching analysis:", err.message);
      }
      await new Promise((resolve) => setTimeout(resolve, 3000)); // wait 3s
    }

    alert("⚠️ Could not fetch analyzed transcript yet. Try again later.");
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

      console.log("Transcript saved:", data);
      alert("✅ Transcript saved successfully! Analysis started...");

      // wait & fetch result
      await fetchAnalysis(6); // poll 6 times (≈18 seconds total)

      onEndDebate?.();
    } catch (err) {
      console.error("Error saving transcript:", err);
      alert(`❌ Failed to save transcript: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearTranscript = () => setTranscript([]);
  
  return (
    <div className="p-6 text-center">
      <h2 className="text-3xl font-bold mb-6">🎤 AI Debate Analyzer</h2>

      {/* Speaker count selector */}
      <div className="mb-4">
        <label className="font-medium mr-2">Number of speakers:</label>
        <select
          value={numSpeakers}
          onChange={(e) => setNumSpeakers(Number(e.target.value))}
          className="border rounded p-2"
        >
          {[2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {/* Speaker buttons */}
      <div className="flex justify-center flex-wrap gap-4 mb-6">
        {Array.from({ length: numSpeakers }, (_, i) => `Speaker ${i + 1}`).map(
          (speaker) => (
            <button
              key={speaker}
              onClick={() => startRecognition(speaker)}
              disabled={activeSpeaker !== null || loading}
              className={`px-5 py-3 rounded-lg text-white text-lg font-semibold ${
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

      {/* Transcript display */}
      <div className="bg-gray-100 p-5 rounded-lg text-left max-w-2xl mx-auto shadow-md">
        <h3 className="font-semibold mb-3 text-xl">📝 Transcript:</h3>
        {transcript.length === 0 ? (
          <p className="text-gray-500">No transcript yet</p>
        ) : (
          <ul className="space-y-2">
            {transcript.map((entry, index) => (
              <li key={index}>
                <b>{entry.speaker}:</b> {entry.text}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex gap-4 justify-center">
        <button
          onClick={saveTranscript}
          disabled={loading || transcript.length === 0}
          className={`px-5 py-3 rounded-lg text-white text-lg ${
            loading ? "bg-gray-400" : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          {loading ? "Saving..." : "💾 Save + Analyze"}
        </button>

        <button
          onClick={clearTranscript}
          className="px-5 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white text-lg"
        >
          🗑️ Clear
        </button>
      </div>

      {/* Display analysis */}
      {analysis && (
        <div className="mt-8 bg-white p-5 rounded-lg shadow-md max-w-2xl mx-auto text-left">
          <h3 className="text-xl font-bold mb-3">📊 Analysis Result:</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
            {JSON.stringify(analysis, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default DebateRecorder;
