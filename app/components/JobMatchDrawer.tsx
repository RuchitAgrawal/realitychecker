import { useState, useMemo } from "react";

interface JobMatchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  resumeText: string;
  existingKeywords?: {
    matched: string[];
    missing: string[];
  };
}

const COMMON_TECH_TERMS = [
  "React", "TypeScript", "JavaScript", "Node.js", "Python", "Go", "Java", "C++",
  "PostgreSQL", "MongoDB", "MySQL", "Redis", "Kafka", "Docker", "Kubernetes",
  "AWS", "GCP", "Azure", "CI/CD", "Git", "REST APIs", "GraphQL", "Microservices",
  "HTML5", "CSS3", "Tailwind CSS", "Next.js", "Jest", "Cypress", "Agile", "Scrum",
  "System Design", "Distributed Systems", "SQL", "Linux", "Terraform", "Redux",
];

export const JobMatchDrawer = ({
  isOpen,
  onClose,
  resumeText,
  existingKeywords,
}: JobMatchDrawerProps) => {
  const [jobDescription, setJobDescription] = useState("");
  const [targetTitle, setTargetTitle] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [copiedMissing, setCopiedMissing] = useState(false);

  // Parse keywords from pasted job description
  const matchResults = useMemo(() => {
    if (!jobDescription.trim()) {
      return { score: 0, matched: [], missing: [] };
    }

    const jdLower = jobDescription.toLowerCase();
    const resumeLower = (resumeText || "").toLowerCase();

    // Find all keywords mentioned in job description
    const requiredSkills: string[] = [];
    for (const term of COMMON_TECH_TERMS) {
      if (jdLower.includes(term.toLowerCase())) {
        requiredSkills.push(term);
      }
    }

    // Also extract capitalized acronyms or hyphenated skills
    const rawTokens = jobDescription.match(/\b[A-Z][a-zA-Z0-9.+]{2,15}\b/g) || [];
    for (const tok of rawTokens) {
      if (!requiredSkills.includes(tok) && requiredSkills.length < 25) {
        if (!["The", "And", "With", "For", "You", "Our", "We", "Will", "Are", "This", "That", "Have"].includes(tok)) {
          requiredSkills.push(tok);
        }
      }
    }

    if (requiredSkills.length === 0) {
      return { score: 70, matched: existingKeywords?.matched || [], missing: existingKeywords?.missing || [] };
    }

    const matched: string[] = [];
    const missing: string[] = [];

    for (const skill of requiredSkills) {
      if (resumeLower.includes(skill.toLowerCase())) {
        matched.push(skill);
      } else {
        missing.push(skill);
      }
    }

    const score = Math.round((matched.length / Math.max(requiredSkills.length, 1)) * 100);

    return { score, matched, missing };
  }, [jobDescription, resumeText, existingKeywords]);

  const handleCopyMissing = async () => {
    if (matchResults.missing.length === 0) return;
    await navigator.clipboard.writeText(matchResults.missing.join(", ")).catch(() => {});
    setCopiedMissing(true);
    setTimeout(() => setCopiedMissing(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(38, 37, 30, 0.4)",
        zIndex: 200,
        display: "flex",
        justifyContent: "flex-end",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          height: "100%",
          background: "#ffffff",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          padding: "1.75rem",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: "1rem",
            borderBottom: "1px solid #e6e5e0",
          }}
        >
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
              Target Job Matcher
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#807d72",
              cursor: "pointer",
              fontSize: "1.125rem",
              padding: "0.25rem",
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: "0.8125rem", color: "#5a5852", marginTop: "1rem", lineHeight: 1.5 }}>
          Paste a target job posting from LinkedIn, Greenhouse, or Lever to calculate an instant role-specific match score and uncover missing keyword filters.
        </p>

        {/* Input fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
          <input
            type="text"
            value={targetTitle}
            onChange={(e) => setTargetTitle(e.target.value)}
            placeholder="Target Role (e.g. Senior Frontend Engineer at Stripe)"
            style={{
              width: "100%",
              height: "38px",
              padding: "0.5rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid #e6e5e0",
              fontSize: "0.8125rem",
              background: "#ffffff",
              color: "#26251e",
            }}
          />

          <textarea
            value={jobDescription}
            onChange={(e) => {
              setJobDescription(e.target.value);
              setAnalyzed(true);
            }}
            placeholder="Paste target job requirements and qualifications here…"
            rows={6}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "8px",
              border: "1px solid #e6e5e0",
              fontSize: "0.8125rem",
              background: "#fafaf7",
              color: "#26251e",
              lineHeight: 1.5,
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Live Match Results */}
        {analyzed && jobDescription.trim().length > 20 && (
          <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Score card */}
            <div
              style={{
                background: "#fafaf7",
                border: "1px solid #e6e5e0",
                borderRadius: "10px",
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span style={{ fontSize: "0.75rem", color: "#807d72", fontFamily: "var(--font-mono)" }}>
                  ROLE MATCH FITNESS
                </span>
                <p style={{ fontSize: "1.125rem", fontWeight: 500, color: "#26251e", margin: "0.2rem 0 0" }}>
                  {targetTitle || "Target Position"}
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <span
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 600,
                    fontFamily: "var(--font-mono)",
                    color: matchResults.score >= 70 ? "#1f8a65" : matchResults.score >= 50 ? "#c08532" : "#cf2d56",
                  }}
                >
                  {matchResults.score}%
                </span>
              </div>
            </div>

            {/* Matched keywords */}
            <div>
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  color: "#1f8a65",
                  display: "block",
                  marginBottom: "0.5rem",
                }}
              >
                Matched Requirements ({matchResults.matched.length})
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                {matchResults.matched.length === 0 ? (
                  <span style={{ fontSize: "0.75rem", color: "#807d72" }}>No direct keyword matches found.</span>
                ) : (
                  matchResults.matched.map((m) => (
                    <span
                      key={m}
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "9999px",
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        color: "#166534",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      ✓ {m}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Missing keywords */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    color: "#cf2d56",
                  }}
                >
                  Missing Keywords ({matchResults.missing.length})
                </span>
                {matchResults.missing.length > 0 && (
                  <button
                    type="button"
                    onClick={handleCopyMissing}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "0.75rem",
                      color: "#f54e00",
                      cursor: "pointer",
                      padding: 0,
                      fontWeight: 500,
                    }}
                  >
                    {copiedMissing ? "✓ Copied!" : "Copy Missing List"}
                  </button>
                )}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                {matchResults.missing.length === 0 ? (
                  <span style={{ fontSize: "0.75rem", color: "#1f8a65" }}>All extracted requirements matched!</span>
                ) : (
                  matchResults.missing.map((m) => (
                    <span
                      key={m}
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "9999px",
                        background: "#fff1f2",
                        border: "1px solid #fecdd3",
                        color: "#9f1239",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      ✕ {m}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Optimization Advice */}
            <div
              style={{
                background: "#fafaf7",
                border: "1px solid #e6e5e0",
                borderRadius: "8px",
                padding: "0.875rem",
                fontSize: "0.75rem",
                lineHeight: 1.5,
                color: "#5a5852",
              }}
            >
              <strong style={{ color: "#26251e", display: "block", marginBottom: "0.25rem" }}>
                💡 Actionable Recommendation:
              </strong>
              Inject {matchResults.missing.slice(0, 3).join(", ") || "the missing skills"} into your recent work experience bullets to boost your automated ATS screening match rate past 80%.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobMatchDrawer;
