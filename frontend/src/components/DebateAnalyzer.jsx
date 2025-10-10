// src/components/DebateAnalyzer.jsx
import React, { useEffect, useState } from "react";

function DebateAnalyzer({ onRestart }) {
  const [analysis, setAnalysis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/analyze-transcript");
        if (!res.ok) throw new Error("No analyzed transcript found yet");
        const data = await res.json();
        setAnalysis(data);
      } catch (err) {
        console.error("Error fetching analysis:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, []);

  if (loading)
    return (
      <div className="p-8 text-center text-xl font-semibold">
        🔍 Analyzing debate...
      </div>
    );

  if (error)
    return (
      <div className="p-8 text-center text-red-600">
        ❌ {error}
        <div>
          <button
            onClick={onRestart}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );

  return (
    <div className="p-6 bg-white shadow-lg rounded-2xl w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-4">
        🧠 Debate Analysis Results
      </h2>

      {analysis.length === 0 ? (
        <p className="text-center text-gray-600">No data found.</p>
      ) : (
        <div className="space-y-4">
          {analysis.map((entry, index) => (
            <div
              key={index}
              className="border rounded-xl p-4 bg-gray-50 shadow-sm"
            >
              <h3 className="font-semibold text-lg mb-2">{entry.speaker}</h3>
              <p className="text-gray-700 mb-2">
                <b>🗣️ Speech:</b> {entry.text}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2 text-sm">
                <div className="p-2 bg-green-100 rounded-md">
                  <b>Sentiment:</b>{" "}
                  <span className="capitalize">{entry.sentiment?.label}</span>{" "}
                  ({entry.sentiment?.score})
                </div>
                <div className="p-2 bg-blue-100 rounded-md">
                  <b>Emotion:</b>{" "}
                  <span className="capitalize">{entry.emotion?.label}</span>{" "}
                  ({entry.emotion?.score})
                </div>
                <div className="p-2 bg-purple-100 rounded-md">
                  <b>Relevance:</b> {entry.relevance}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Restart Button */}
      <div className="text-center mt-6">
        <button
          onClick={onRestart}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
        >
          🔁 Restart Debate
        </button>
      </div>
    </div>
  );
}

export default DebateAnalyzer;
