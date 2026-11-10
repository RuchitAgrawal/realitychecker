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
      <div style={{ marginBottom: "1.25rem" }}>
        <h3
          style={{
            fontSize: "1.05rem",
            fontWeight: 500,
            color: "#26251e",
            marginBottom: "0.25rem",
          }}
        >
          Target Role Keyword Match
        </h3>
        <p style={{ fontSize: "0.8125rem", color: "#807d72" }}>
          Comparison against key requirements extracted from the target job description
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
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#1f8a65",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "0.625rem",
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
              <span style={{ fontSize: "0.75rem", color: "#807d72" }}>None detected</span>
            )}
          </div>
        </div>

        {/* Missing */}
        <div className="keyword-column">
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#cf2d56",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "0.625rem",
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
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                  {copiedKeyword === kw ? (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </span>
              </button>
            ))}
            {missing.length === 0 && (
              <span style={{ fontSize: "0.75rem", color: "#807d72" }}>
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
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#c08532",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "0.625rem",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span>◈</span> Partial ({partial.length})
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
