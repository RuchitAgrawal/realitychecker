import React from "react";

const SetupBanner: React.FC = () => {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #cf2d56",
        borderLeft: "4px solid #cf2d56",
        color: "#26251e",
        padding: "0.875rem 1.25rem",
        borderRadius: "8px",
        margin: "1rem auto",
        maxWidth: "960px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        fontSize: "0.875rem",
      }}
    >
      <div>
        <strong style={{ color: "#cf2d56" }}>Missing Supabase credentials:</strong> Please set{" "}
        <code style={{ background: "#fafaf7", padding: "0.15rem 0.35rem", borderRadius: "4px", border: "1px solid #e6e5e0" }}>VITE_SUPABASE_URL</code> and{" "}
        <code style={{ background: "#fafaf7", padding: "0.15rem 0.35rem", borderRadius: "4px", border: "1px solid #e6e5e0" }}>VITE_SUPABASE_ANON_KEY</code> in{" "}
        <code>.env.local</code>.
      </div>
      <a
        href="https://supabase.com/docs"
        target="_blank"
        rel="noreferrer"
        style={{
          color: "#f54e00",
          textDecoration: "underline",
          whiteSpace: "nowrap",
          fontWeight: 500,
        }}
      >
        Documentation →
      </a>
    </div>
  );
};

export default SetupBanner;
