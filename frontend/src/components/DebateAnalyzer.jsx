import React, { useState } from "react";
import "../App.css";
 // Importing the consolidated CSS

function DebateAnalyzer({ analysis, onRestart }) {
  const [openDetails, setOpenDetails] = useState(null);

  const toggleDetail = (index) => {
    setOpenDetails(openDetails === index ? null : index);
  };

  if (!analysis) {
    return (
      <div className="loading-indicator">
        ⏳ <span className="animate-pulse">Waiting for analysis results...</span>
      </div>
    );
  }

  const details = analysis?.detailed_analysis || [];
  const speakerSummary = analysis?.speaker_summary || {};

  return (
    <div className="debate-analyzer">
      {/* <h2 className="heading">🧠 Debate Analysis Results</h2> */}

      <div className="summary-card">
        <p className="font-semibold">{analysis.summary}</p>
        <p>Total Speakers: {analysis.total_speakers}</p>
        <p>Total Sentences: {analysis.total_sentences}</p>
        <p>Total Words: {analysis.total_words}</p>
        <p className="timestamp">🕒 {analysis.timestamp}</p>
      </div>

      {details.length === 0 ? (
        <p className="no-details">No detailed data found.</p>
      ) : (
        <div className="details-container">
          {details.map((entry, index) => (
            <div
              key={index}
              className="detail-card"
            >
              <h3
                className="speaker-title"
                onClick={() => toggleDetail(index)}
              >
                {entry.speaker}
              </h3>
              {openDetails === index && (
                <div className="detail-text">
                  <b>🗣️ Speech:</b> {entry.text}
                </div>
              )}
              <div className="metrics">
                <div className="metric sentiment">
                  <b>Sentiment:</b> <span>{entry.sentiment?.label}</span> ({entry.sentiment?.score})
                </div>
                <div className="metric emotion">
                  <b>Emotion:</b> <span>{entry.emotion?.label}</span> ({entry.emotion?.score})
                </div>
                <div className="metric relevance">
                  <b>Relevance:</b> {entry.relevance}
                </div>
              </div>

              <div className="grammar">
                <b>📝 Grammar:</b>{" "}
                {entry.grammar?.errors === 0
                  ? "✅Perfect grammar."
                  : `${entry.grammar?.errors} issues found.`}
              </div>

              <div className="judgment">
                <b>💬 Judgment:</b> {entry.judgment}
              </div>
            </div>
          ))}
        </div>
      )}

      {Object.keys(speakerSummary).length > 0 && (
        <div className="speaker-summary">
          <h3 className="summary-heading">📊 Speaker-wise Judgments</h3>
          {Object.entries(speakerSummary).map(([speaker, judgmentText]) => (
            <div key={speaker} className="summary-card">
              <p className="font-semibold">{speaker}</p>
              <p>{judgmentText}</p>
            </div>
          ))}
        </div>
      )}

      <div className="text-center mt-6">
        <button
          onClick={onRestart}
          className="restart-button"
        >
          🔁 Restart Debate
        </button>
      </div>
    </div>
  );
}

export default DebateAnalyzer;
