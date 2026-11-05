import React from "react";

const SetupBanner: React.FC = () => {
  return (
    <div
      style={{
        background: "rgba(239, 68, 68, 0.12)",
        border: "1px solid rgba(239, 68, 68, 0.35)",
        color: "#fca5a5",
        padding: "0.875rem 1.25rem",
        borderRadius: "0.75rem",
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
        <strong>Supabase environment variables missing:</strong> Please set{" "}
        <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in{" "}
        <code>.env.local</code>.
      </div>
      <a
        href="https://supabase.com/docs"
        target="_blank"
        rel="noreferrer"
        style={{
          color: "#fff",
          textDecoration: "underline",
          whiteSpace: "nowrap",
          fontWeight: 600,
        }}
      >
        Setup Guide
      </a>
    </div>
  );
};

export default SetupBanner;
