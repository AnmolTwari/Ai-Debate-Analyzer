import React, { useEffect, useState } from "react";

function DebateAnalyzer({ transcript, onRestart }) {
  const [analysis, setAnalysis] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/analyze-transcript")
      .then((res) => res.json())
      .then((data) => setAnalysis(data))
      .catch(() => console.log("No analyzed transcript yet"));
  }, []);

  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">🧠 Debate Analysis Results</h2>

      {analysis.length === 0 ? (
        <p>No analysis yet.</p>
      ) : (
        <div className="max-w-2xl mx-auto bg-gray-50 p-4 rounded-lg text-left">
          {analysis.map((a, i) => (
            <div key={i} className="border-b py-2">
              <b>{a.speaker}</b>: {a.text} <br />
              <i>Sentiment:</i> {a.sentiment.label} ({a.sentiment.score}) <br />
              <i>Emotion:</i> {a.emotion.label} ({a.emotion.score}) <br />
              <i>Relevance:</i> {a.relevance}
            </div>
          ))}
        </div>
      )}

      <button
        className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-lg"
        onClick={onRestart}
      >
        🔁 Restart Debate
      </button>
    </div>
  );
}

export default DebateAnalyzer;
