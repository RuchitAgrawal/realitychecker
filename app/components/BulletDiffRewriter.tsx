import { useState } from "react";

interface BulletDiffRewriterProps {
  jobTitle?: string;
}

interface RewriteSample {
  id: string;
  category: string;
  original: string;
  rewrites: {
    formula: "xyz" | "star" | "leadership";
    label: string;
    description: string;
    text: string;
  }[];
}

const DEFAULT_SAMPLES: RewriteSample[] = [
  {
    id: "sample-1",
    category: "Full Stack / Backend",
    original: "Built backend features using Node and PostgreSQL for our web platform.",
    rewrites: [
      {
        formula: "xyz",
        label: "Google XYZ Formula",
        description: "Accomplished [X] as measured by [Y], by doing [Z]",
        text: "Engineered scalable REST microservices in Node.js and PostgreSQL, slashing p95 API response times by 38% for 12,000+ daily active users.",
      },
      {
        formula: "star",
        label: "STAR Method",
        description: "Situation, Task, Action, and Quantified Result",
        text: "Addressed database bottlenecks during traffic spikes by redesigning PostgreSQL query indexing and connection pooling, achieving 99.98% service uptime.",
      },
      {
        formula: "leadership",
        label: "Impact & Ownership",
        description: "Emphasizes initiative, system design, and collaboration",
        text: "Spearheaded backend architecture migration to Node.js microservices, onboarding 4 junior engineers and delivering the platform release 2 weeks ahead of schedule.",
      },
    ],
  },
  {
    id: "sample-2",
    category: "Frontend / React",
    original: "Created responsive web pages using React and CSS.",
    rewrites: [
      {
        formula: "xyz",
        label: "Google XYZ Formula",
        description: "Accomplished [X] as measured by [Y], by doing [Z]",
        text: "Architected modular design system components using React and Tailwind CSS, increasing design consistency and accelerating feature velocity across 3 product teams by 40%.",
      },
      {
        formula: "star",
        label: "STAR Method",
        description: "Situation, Task, Action, and Quantified Result",
        text: "Reduced initial page load time from 4.2s to 1.1s by code-splitting React routes and lazy loading assets, driving a 22% increase in visitor checkout conversion.",
      },
      {
        formula: "leadership",
        label: "Impact & Ownership",
        description: "Emphasizes initiative, system design, and collaboration",
        text: "Led frontend performance optimization initiative, auditing Core Web Vitals to elevate lighthouse performance scores from 58 to 96 across all web touchpoints.",
      },
    ],
  },
];

export const BulletDiffRewriter = ({ jobTitle }: BulletDiffRewriterProps) => {
  const [selectedSampleIndex, setSelectedSampleIndex] = useState(0);
  const [activeFormula, setActiveFormula] = useState<"xyz" | "star" | "leadership">("xyz");
  const [customInput, setCustomInput] = useState("");
  const [copied, setCopied] = useState(false);

  const sample = DEFAULT_SAMPLES[selectedSampleIndex];
  const activeRewrite = sample.rewrites.find((r) => r.formula === activeFormula) || sample.rewrites[0];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(activeRewrite.text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e6e5e0",
        borderRadius: "12px",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "9999px",
                background: "#f54e00",
              }}
            />
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 500,
                color: "#26251e",
                letterSpacing: "-0.015em",
                margin: 0,
              }}
            >
              Interactive Bullet Point Rewriter
            </h3>
          </div>
          <p style={{ fontSize: "0.8125rem", color: "#5a5852", marginTop: "0.25rem" }}>
            Compare weak bullet points against high-impact, ATS-optimized formulas with live diff highlights.
          </p>
        </div>

        {/* Sample selector pills */}
        <div style={{ display: "flex", gap: "0.375rem" }}>
          {DEFAULT_SAMPLES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedSampleIndex(idx)}
              style={{
                fontSize: "0.75rem",
                padding: "0.25rem 0.625rem",
                borderRadius: "6px",
                border: selectedSampleIndex === idx ? "1px solid #26251e" : "1px solid #e6e5e0",
                background: selectedSampleIndex === idx ? "#26251e" : "#fafaf7",
                color: selectedSampleIndex === idx ? "#ffffff" : "#5a5852",
                cursor: "pointer",
                fontWeight: 500,
                transition: "all 0.15s ease",
              }}
            >
              {s.category.split("/")[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Formula tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          background: "#fafaf7",
          padding: "4px",
          borderRadius: "8px",
          border: "1px solid #e6e5e0",
        }}
      >
        {sample.rewrites.map((r) => {
          const isActive = activeFormula === r.formula;
          return (
            <button
              key={r.formula}
              type="button"
              onClick={() => setActiveFormula(r.formula)}
              style={{
                flex: 1,
                padding: "0.4rem 0.75rem",
                fontSize: "0.75rem",
                fontWeight: isActive ? 600 : 400,
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                background: isActive ? "#ffffff" : "transparent",
                color: isActive ? "#26251e" : "#807d72",
                boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {/* Diff visualizer */}
      <div
        style={{
          border: "1px solid #e6e5e0",
          borderRadius: "8px",
          overflow: "hidden",
          fontSize: "0.8125rem",
          lineHeight: 1.6,
        }}
      >
        {/* Before */}
        <div
          style={{
            background: "#fff5f5",
            padding: "0.875rem 1.125rem",
            borderBottom: "1px solid #fee2e2",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.75rem",
          }}
        >
          <span
            style={{
              fontSize: "0.6875rem",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              color: "#cf2d56",
              padding: "0.1rem 0.4rem",
              background: "#fee2e2",
              borderRadius: "4px",
              flexShrink: 0,
            }}
          >
            ORIGINAL
          </span>
          <p style={{ color: "#7f1d1d", margin: 0, textDecoration: "line-through", opacity: 0.85 }}>
            {sample.original}
          </p>
        </div>

        {/* After (Diff Highlight) */}
        <div
          style={{
            background: "#f0fdf4",
            padding: "0.875rem 1.125rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.75rem",
          }}
        >
          <span
            style={{
              fontSize: "0.6875rem",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              color: "#1f8a65",
              padding: "0.1rem 0.4rem",
              background: "#dcfce7",
              borderRadius: "4px",
              flexShrink: 0,
            }}
          >
            OPTIMIZED
          </span>
          <div style={{ flex: 1 }}>
            <p style={{ color: "#14532d", margin: 0, fontWeight: 500 }}>
              {activeRewrite.text}
            </p>
            <span
              style={{
                display: "block",
                marginTop: "0.375rem",
                fontSize: "0.7rem",
                color: "#166534",
                fontFamily: "var(--font-mono)",
              }}
            >
              Formula: {activeRewrite.description}
            </span>
          </div>
        </div>
      </div>

      {/* Copy & action bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.75rem", color: "#807d72" }}>
          Targeted for {jobTitle || "Software Engineering"} roles
        </span>

        <button
          type="button"
          onClick={handleCopy}
          className="back-button"
          style={{
            padding: "0.45rem 1rem",
            fontSize: "0.8125rem",
            background: copied ? "#1f8a65" : "#26251e",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            fontWeight: 500,
            transition: "all 0.2s ease",
          }}
        >
          {copied ? "✓ Copied to Clipboard!" : "Copy Rewritten Bullet"}
        </button>
      </div>
    </div>
  );
};

export default BulletDiffRewriter;
