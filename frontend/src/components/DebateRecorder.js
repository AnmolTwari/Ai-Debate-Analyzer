import React, { useState, useRef } from "react";

function DebateRecorder({ transcript, setTranscript, onEndDebate }) {
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);

  const startRecognition = (speaker) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
      onEndDebate(); // move to analyzer
    } catch (err) {
      console.error("Error saving transcript:", err);
      alert("❌ Failed to save transcript. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">AI Debate Analyzer</h2>

      <div className="flex justify-center gap-6 mb-6">
        {["Speaker 1", "Speaker 2"].map((speaker) => (
          <button
            key={speaker}
            className={`px-4 py-2 rounded-lg ${
              activeSpeaker === speaker
                ? "bg-gray-400"
                : speaker === "Speaker 1"
                ? "bg-blue-500 text-white"
                : "bg-green-500 text-white"
            }`}
            onClick={() => startRecognition(speaker)}
            disabled={activeSpeaker !== null || loading}
          >
            🎙️ {speaker}
          </button>
        ))}
      </div>

      <div className="bg-gray-100 p-4 rounded-lg text-left max-w-lg mx-auto">
        <h3 className="font-semibold mb-2">Transcript:</h3>
        {transcript.length === 0 ? (
          <p>No transcript yet</p>
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

      <button
        className={`mt-4 px-4 py-2 rounded-lg text-white ${
          loading ? "bg-gray-400" : "bg-purple-500"
        }`}
        onClick={saveTranscript}
        disabled={transcript.length === 0 || loading}
      >
        {loading ? "Saving..." : "💾 Save Transcript"}
      </button>
    </div>
  );
}

export default DebateRecorder;
