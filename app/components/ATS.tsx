import React from "react";
import { getScoreColor, getScoreLevel } from "~/lib/utils";

interface Suggestion {
  type: "good" | "improve";
  tip: string;
}

interface ATSProps {
  score: number;
  suggestions: Suggestion[];
}

const getAtsColor = (score: number) => {
  const level = getScoreLevel(score);
  if (level === "high") {
    return {
      bg: "#fafaf7",
      border: "#cfcdc4",
      text: "#1f8a65",
      icon: "✓",
    };
  }
  if (level === "medium") {
    return {
      bg: "#fafaf7",
      border: "#cfcdc4",
      text: "#c08532",
      icon: "◈",
    };
  }
  return {
    bg: "#fafaf7",
    border: "#cfcdc4",
    text: "#cf2d56",
    icon: "!",
  };
};

const getSubtitle = (score: number) => {
  const level = getScoreLevel(score);
  if (level === "high") return "Strong formatting and keyword density";
  if (level === "medium") return "Moderate — key improvements recommended";
  return "Formatting and layout need attention";
};

const ATS: React.FC<ATSProps> = ({ score, suggestions }) => {
  const color = getAtsColor(score);
  const barColor = getScoreColor(score);

  return (
    <div className="ats-card">
      <div className="ats-header">
        {/* Icon indicator */}
        <div
          className="ats-icon-wrap"
          style={{ background: color.bg, border: `1px solid ${color.border}` }}
        >
          <span style={{ fontSize: "1.1rem", color: color.text, fontWeight: 600 }}>
            {color.icon}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <p style={{ fontSize: "1.05rem", fontWeight: 500, color: "#26251e" }}>
              ATS Compatibility
            </p>
            <div
              className="ats-score-badge"
              style={{
                background: color.bg,
                border: `1px solid ${color.border}`,
                color: color.text,
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              {score}/100
            </div>
          </div>
          <p style={{ fontSize: "0.8375rem", color: "#807d72", marginTop: "0.25rem" }}>
            {getSubtitle(score)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: "4px",
          background: "#efeee8",
          borderRadius: "9999px",
          overflow: "hidden",
          marginBottom: "1.25rem",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${score}%`,
            background: barColor,
            borderRadius: "9999px",
            transition: "width 0.8s ease",
          }}
        />
      </div>

      {/* Tips */}
      {suggestions.length > 0 && (
        <div className="ats-tip-list">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className={`ats-tip-item ${s.type === "good" ? "ats-tip-good" : "ats-tip-improve"}`}
            >
              <span
                style={{
                  flexShrink: 0,
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: s.type === "good" ? "#1f8a65" : "#f54e00",
                }}
              >
                {s.type === "good" ? "✓" : "▲"}
              </span>
              <span style={{ color: "#5a5852" }}>{s.tip}</span>
            </div>
          ))}
        </div>
      )}

      <p
        style={{
          marginTop: "1rem",
          fontSize: "0.75rem",
          color: "#807d72",
        }}
      >
        Tailoring keywords and structure significantly improves automated ATS scanning.
      </p>
    </div>
  );
};

export default ATS;
