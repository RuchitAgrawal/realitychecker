import React, { useState } from "react";

interface KeywordGapProps {
  analysis?: KeywordAnalysis;
}

const KeywordGap: React.FC<KeywordGapProps> = ({ analysis }) => {
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);

  if (!analysis) return null;

  const matched = analysis.matched || [];
  const missing = analysis.missing || [];
  const partial = analysis.partialMatch || [];

  if (matched.length === 0 && missing.length === 0 && partial.length === 0) {
    return null;
  }

  const handleCopy = async (keyword: string) => {
    try {
      await navigator.clipboard.writeText(keyword);
      setCopiedKeyword(keyword);
      setTimeout(() => setCopiedKeyword(null), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <div className="keyword-gap-card">
      <div style={{ marginBottom: "1rem" }}>
        <h3
          style={{
            fontSize: "1.05rem",
            fontWeight: 700,
            color: "#c8d0e7",
            marginBottom: "0.25rem",
          }}
        >
          Target Role Keyword Match
        </h3>
        <p style={{ fontSize: "0.8125rem", color: "#5a6585" }}>
          Comparison against key requirements found in the target job description
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* Matched */}
        <div className="keyword-column">
          <div
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#6ee7b7",
              marginBottom: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <span>✓</span> Matched ({matched.length})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {matched.map((kw, i) => (
              <span key={i} className="keyword-pill keyword-pill-matched">
                {kw}
              </span>
            ))}
            {matched.length === 0 && (
              <span style={{ fontSize: "0.75rem", color: "#4a5568" }}>None detected</span>
            )}
          </div>
        </div>

        {/* Missing */}
        <div className="keyword-column">
          <div
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#fca5a5",
              marginBottom: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <span>✕</span> Missing ({missing.length})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {missing.map((kw, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleCopy(kw)}
                title="Click to copy keyword"
                className="keyword-pill keyword-pill-missing"
                style={{ cursor: "pointer" }}
              >
                <span>{kw}</span>
                <span style={{ fontSize: "0.65rem", opacity: 0.7 }}>
                  {copiedKeyword === kw ? "✓" : "📋"}
                </span>
              </button>
            ))}
            {missing.length === 0 && (
              <span style={{ fontSize: "0.75rem", color: "#4a5568" }}>
                All keywords present
              </span>
            )}
          </div>
        </div>

        {/* Partial */}
        {partial.length > 0 && (
          <div className="keyword-column">
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "#fcd34d",
                marginBottom: "0.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span>◈</span> Partial Match ({partial.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {partial.map((kw, i) => (
                <span key={i} className="keyword-pill keyword-pill-partial">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KeywordGap;
