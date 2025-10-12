// src/components/DebateAnalyzer.jsx
import React from "react";

function DebateAnalyzer({ analysis, onRestart }) {
  if (!analysis) {
    return (
      <div className="p-8 text-center text-xl font-semibold">
        ⏳ Waiting for analysis results...
      </div>
    );
  }

  const details = analysis?.detailed_analysis || [];
  const speakerSummary = analysis?.speaker_summary || {};

  return (
    <div className="p-6 bg-white shadow-lg rounded-2xl w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-4">🧠 Debate Analysis Results</h2>

      <div className="mb-4 p-4 bg-gray-100 rounded-xl shadow-sm">
        <p className="font-semibold">{analysis.summary}</p>
        <p>Total Speakers: {analysis.total_speakers}</p>
        <p>Total Sentences: {analysis.total_sentences}</p>
        <p>Total Words: {analysis.total_words}</p>
        <p className="text-gray-500 text-sm">🕒 {analysis.timestamp}</p>
      </div>

      {details.length === 0 ? (
        <p className="text-center text-gray-600">No detailed data found.</p>
      ) : (
        <div className="space-y-4">
          {details.map((entry, index) => (
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

              <div className="mt-3 p-3 bg-yellow-50 rounded-md text-sm">
                <b>📝 Grammar:</b>{" "}
                {entry.grammar?.errors === 0
                  ? "✅Perfect grammar."
                  : `${entry.grammar?.errors} issues found.`}
              </div>

              <div className="mt-3 p-3 bg-orange-100 rounded-md text-sm">
                <b>💬 Judgment:</b> {entry.judgment}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ----------------------------- */}
      {/* Speaker-wise human judgment */}
      {/* ----------------------------- */}
      {Object.keys(speakerSummary).length > 0 && (
        <div className="mt-6 p-4 bg-gray-200 rounded-xl">
          <h3 className="text-xl font-bold mb-2 text-center">📊 Speaker-wise Judgments</h3>
          {Object.entries(speakerSummary).map(([speaker, judgmentText]) => (
            <div key={speaker} className="p-3 bg-white rounded-lg shadow-sm mb-3">
              <p className="font-semibold">{speaker}</p>
              <p>{judgmentText}</p>
            </div>
          ))}
        </div>
      )}

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
