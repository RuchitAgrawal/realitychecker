import { useState, useMemo } from "react";

interface AtsXRayViewerProps {
  rawText: string;
  loading?: boolean;
}

interface Hazard {
  id: string;
  level: "good" | "warning" | "info";
  title: string;
  detail: string;
}

export const AtsXRayViewer = ({ rawText, loading }: AtsXRayViewerProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Run ATS structural heuristics on rawText
  const { hazards, stats, highlightedLines } = useMemo(() => {
    if (!rawText) {
      return { hazards: [], stats: { words: 0, lines: 0, chars: 0 }, highlightedLines: [] };
    }

    const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
    const words = rawText.trim().split(/\s+/).length;
    const chars = rawText.length;

    const detectedHazards: Hazard[] = [];

    // 1. Email & Phone detection
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(rawText);
    const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(rawText);

    if (hasEmail && hasPhone) {
      detectedHazards.push({
        id: "contact",
        level: "good",
        title: "Contact Info Verified",
        detail: "Standard email and phone detected for ATS candidate records.",
      });
    } else {
      detectedHazards.push({
        id: "contact-missing",
        level: "warning",
        title: "Contact Info Hazard",
        detail: !hasEmail
          ? "No email found in text stream. ATS may fail to parse candidate identity."
          : "No phone number found in text stream.",
      });
    }

    // 2. Standard Section Headers
    const lower = rawText.toLowerCase();
    const standardHeaders = [
      { name: "Experience", match: /experience|work history|employment/i },
      { name: "Education", match: /education|academic/i },
      { name: "Skills", match: /skills|technologies|proficiencies/i },
      { name: "Projects", match: /projects|open source/i },
    ];

    const missingHeaders = standardHeaders
      .filter((h) => !h.match.test(lower))
      .map((h) => h.name);

    if (missingHeaders.length === 0) {
      detectedHazards.push({
        id: "headers",
        level: "good",
        title: "Standard Sections Detected",
        detail: "All core sections (Experience, Education, Skills, Projects) found.",
      });
    } else {
      detectedHazards.push({
        id: "headers-missing",
        level: "warning",
        title: "Non-Standard Sections",
        detail: `Missing standard headers: ${missingHeaders.join(", ")}. Legacy ATS may skip unclassified sections.`,
      });
    }

    // 3. Tabular / Multi-Column Scramble Heuristic
    const shortBrokenLines = lines.filter((l) => l.length < 15).length;
    if (shortBrokenLines > lines.length * 0.45 && lines.length > 20) {
      detectedHazards.push({
        id: "table-hazard",
        level: "warning",
        title: "Possible Multi-Column Flattening",
        detail: "High density of short line fragments detected. Two-column tables often get scrambled by legacy ATS parsers.",
      });
    } else {
      detectedHazards.push({
        id: "flow-clean",
        level: "good",
        title: "Clean Plaintext Stream",
        detail: "Document flattens into sequential linear reading order.",
      });
    }

    return {
      hazards: detectedHazards,
      stats: { words, lines: lines.length, chars },
      highlightedLines: lines,
    };
  }, [rawText]);

  // Filter or highlight lines matching search
  const filteredLines = useMemo(() => {
    if (!searchQuery.trim()) return highlightedLines;
    const q = searchQuery.toLowerCase();
    return highlightedLines.filter((l) => l.toLowerCase().includes(q));
  }, [highlightedLines, searchQuery]);

  if (loading) {
    return (
      <div
        style={{
          padding: "3rem 1.5rem",
          textAlign: "center",
          color: "#807d72",
          fontFamily: "var(--font-mono)",
          fontSize: "0.8125rem",
        }}
      >
        <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⚙️</span>
        <p style={{ marginTop: "0.75rem" }}>Extracting raw ATS parser token stream…</p>
      </div>
    );
  }

  if (!rawText) {
    return (
      <div
        style={{
          padding: "3rem 1.5rem",
          textAlign: "center",
          color: "#807d72",
          fontSize: "0.875rem",
        }}
      >
        No raw text stream available for this document.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Diagnostics ribbon */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e6e5e0",
          borderRadius: "8px",
          padding: "0.875rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.625rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <span
            style={{
              fontSize: "0.6875rem",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#807d72",
            }}
          >
            ATS Parser Diagnostics
          </span>
          <span
            style={{
              fontSize: "0.6875rem",
              fontFamily: "var(--font-mono)",
              color: "#5a5852",
            }}
          >
            {stats.words} words · {stats.lines} lines · {stats.chars} chars
          </span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {hazards.map((h) => {
            const isGood = h.level === "good";
            return (
              <div
                key={h.id}
                title={h.detail}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.625rem",
                  borderRadius: "9999px",
                  background: isGood ? "#fafaf7" : "#fff7ed",
                  border: isGood ? "1px solid #e6e5e0" : "1px solid #fed7aa",
                  color: isGood ? "#1f8a65" : "#c08532",
                  cursor: "help",
                }}
              >
                <span>{isGood ? "✓" : "⚠️"}</span>
                <span style={{ fontWeight: 500 }}>{h.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stream search & terminal header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              fontSize: "0.75rem",
              fontFamily: "var(--font-mono)",
              color: "#807d72",
            }}
          >
            RAW STREAM
          </span>
          <span
            style={{
              fontSize: "0.6875rem",
              background: "#e6e5e0",
              color: "#26251e",
              borderRadius: "4px",
              padding: "0.1rem 0.35rem",
              fontFamily: "var(--font-mono)",
            }}
          >
            PLAINTEXT
          </span>
        </div>

        <div style={{ position: "relative", maxWidth: "220px", width: "100%" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stream…"
            style={{
              width: "100%",
              height: "28px",
              fontSize: "0.75rem",
              padding: "0.25rem 0.625rem",
              borderRadius: "6px",
              border: "1px solid #e6e5e0",
              fontFamily: "var(--font-mono)",
              background: "#ffffff",
              color: "#26251e",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "6px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                fontSize: "0.7rem",
                color: "#807d72",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Monospaced text viewport */}
      <div
        style={{
          background: "#fafaf7",
          border: "1px solid #e6e5e0",
          borderRadius: "8px",
          padding: "1rem 1.25rem",
          fontFamily: "var(--font-mono)",
          fontSize: "0.75rem",
          lineHeight: 1.6,
          color: "#26251e",
          overflowX: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {filteredLines.length === 0 ? (
          <p style={{ color: "#807d72", fontStyle: "italic" }}>
            No text matching &quot;{searchQuery}&quot;
          </p>
        ) : (
          filteredLines.map((line, idx) => {
            const isMatch =
              searchQuery && line.toLowerCase().includes(searchQuery.toLowerCase());
            return (
              <div
                key={idx}
                style={{
                  background: isMatch ? "#fef3c7" : "transparent",
                  padding: isMatch ? "0 0.25rem" : "0",
                  borderRadius: isMatch ? "3px" : "0",
                }}
              >
                {line}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AtsXRayViewer;

