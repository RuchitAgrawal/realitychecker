import { getScoreColor, getScoreLevel } from "~/lib/utils";

const ScoreCircle = ({ score = 75 }: { score: number }) => {
  const radius = 38;
  const stroke = 6;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const strokeDashoffset = circumference * (1 - score / 100);

  const color = getScoreColor(score);
  const trackColor = "#efeee8";

  return (
    <div style={{ position: "relative", width: "72px", height: "72px", flexShrink: 0 }}>
      <svg
        height="100%"
        width="100%"
        viewBox="0 0 80 80"
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Track */}
        <circle
          cx="40"
          cy="40"
          r={normalizedRadius}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="transparent"
        />
        {/* Progress */}
        <circle
          cx="40"
          cy="40"
          r={normalizedRadius}
          stroke={color}
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "JetBrains Mono, monospace",
        }}
      >
        <span style={{ fontSize: "0.875rem", fontWeight: 600, color, lineHeight: 1 }}>
          {score}
        </span>
        <span
          style={{
            fontSize: "0.5625rem",
            color: "#807d72",
            lineHeight: 1,
            marginTop: "2px",
          }}
        >
          /100
        </span>
      </div>
    </div>
  );
};

export default ScoreCircle;
