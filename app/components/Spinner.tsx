import React from "react";

interface SpinnerProps {
  label?: string;
  size?: number;
}

const Spinner: React.FC<SpinnerProps> = ({ label = "Loading…", size = 36 }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.875rem",
        padding: "2rem",
      }}
    >
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "9999px",
          border: "3px solid #2a2a45",
          borderTopColor: "#6366f1",
          animation: "spin 0.9s linear infinite",
        }}
      />
      {label && <p style={{ color: "#5a6585", fontSize: "0.875rem" }}>{label}</p>}
    </div>
  );
};

export default Spinner;
