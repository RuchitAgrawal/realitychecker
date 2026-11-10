import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "~/lib/store";
import Navbar from "~/components/Navbar";
import ScoreGauge from "~/components/ScoreGauge";
import Spinner from "~/components/Spinner";
import { getScoreColor } from "~/lib/utils";

export const meta = () => [
  { title: "RealityChecker | Compare Resumes" },
  { name: "description", content: "Compare two resumes side-by-side" },
];

const CATEGORIES = [
  { key: "overallScore", label: "Overall Score", isTop: true },
  { key: "ATS", label: "ATS Score" },
  { key: "toneAndStyle", label: "Tone & Style" },
  { key: "content", label: "Content" },
  { key: "structure", label: "Structure" },
  { key: "skills", label: "Skills" },
] as const;

const getScore = (resume: Resume | null, key: string): number => {
  if (!resume?.feedback) return 0;
  if (key === "overallScore") return resume.feedback.overallScore ?? 0;
  return (resume.feedback as any)[key]?.score ?? 0;
};

const getTopTip = (resume: Resume | null, key: string): string => {
  if (!resume?.feedback) return "";
  const cat = (resume.feedback as any)[key];
  const tip = cat?.tips?.find((t: any) => t.type === "improve") || cat?.tips?.[0];
  return tip?.tip ? `Tip: ${tip.tip}` : "";
};

const ScoreBar = ({ score, win }: { score: number; win: boolean }) => {
  const color = getScoreColor(score);
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "0.35rem",
        }}
      >
        <span
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            fontFamily: "JetBrains Mono, monospace",
            color: win ? "#1f8a65" : "#26251e",
          }}
        >
          {score}
          {win && (
            <span style={{ fontSize: "0.7rem", marginLeft: "0.3rem", color: "#1f8a65" }}>
              ▲
            </span>
          )}
        </span>
        <span
          style={{
            fontSize: "0.75rem",
            color: "#807d72",
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          /100
        </span>
      </div>
      <div
        style={{
          height: "4px",
          background: "#efeee8",
          borderRadius: "9999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: "9999px",
            width: `${score}%`,
            background: win ? color : `${color}88`,
            transition: "width 0.7s ease",
          }}
        />
      </div>
    </div>
  );
};

const ResumeSelector = ({
  label,
  value,
  onChange,
  resumes,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  resumes: Resume[];
}) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    <p
      style={{
        fontSize: "0.6875rem",
        fontWeight: 600,
        color: "#807d72",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: "0.5rem",
      }}
    >
      {label}
    </p>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        background: "#ffffff",
        border: "1px solid #e6e5e0",
        color: "#26251e",
        borderRadius: "8px",
        padding: "0.625rem 0.875rem",
        fontSize: "0.875rem",
        cursor: "pointer",
        outline: "none",
        fontFamily: "inherit",
      }}
    >
      <option value="">— Select a resume —</option>
      {resumes.map((r) => (
        <option key={r.id} value={r.id}>
          {r.companyName || "Resume"}
          {r.jobTitle ? ` · ${r.jobTitle}` : ""} ({r.feedback?.overallScore ?? 0}/100)
        </option>
      ))}
    </select>
  </div>
);

const Compare = () => {
  const { isLoading, isAuthenticated, storage, resumes: resumeStore } = useStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const paramA = searchParams.get("a") || "";
  const paramB = searchParams.get("b") || "";

  const [idA, setIdA] = useState(paramA);
  const [idB, setIdB] = useState(paramB);
  const [imgA, setImgA] = useState("");
  const [imgB, setImgB] = useState("");

  const handleSelectA = (newA: string) => {
    let nextB = idB;
    if (newA === idB) {
      nextB = idA;
      setIdB(nextB);
    }
    setIdA(newA);
    if (newA && nextB) {
      setSearchParams({ a: newA, b: nextB }, { replace: true });
    }
  };

  const handleSelectB = (newB: string) => {
    let nextA = idA;
    if (newB === idA) {
      nextA = idB;
      setIdA(nextA);
    }
    setIdB(newB);
    if (nextA && newB) {
      setSearchParams({ a: nextA, b: newB }, { replace: true });
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/auth");
  }, [isLoading, isAuthenticated, navigate]);

  const { data: resumes = [], isLoading: loading } = useQuery({
    queryKey: ["resumes"],
    queryFn: () => resumeStore.list(),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (paramA && paramB && (!idA || !idB)) {
      setIdA(paramA);
      setIdB(paramB);
    } else if (resumes.length >= 2 && !idA && !idB) {
      setIdA(resumes[0]?.id ?? "");
      setIdB(resumes[1]?.id ?? "");
    }
  }, [resumes, idA, idB, paramA, paramB]);

  // Load preview images from Supabase Storage signed URLs
  useEffect(() => {
    setImgA("");
    if (!idA) return;
    const r = resumes.find((r) => r.id === idA);
    if (!r?.imagePath) return;
    storage
      .getSignedUrl("resume-images", r.imagePath, 3600)
      .then((url) => setImgA(url))
      .catch(() => {});
  }, [idA, resumes]);

  useEffect(() => {
    setImgB("");
    if (!idB) return;
    const r = resumes.find((r) => r.id === idB);
    if (!r?.imagePath) return;
    storage
      .getSignedUrl("resume-images", r.imagePath, 3600)
      .then((url) => setImgB(url))
      .catch(() => {});
  }, [idB, resumes]);

  const resumeA = resumes.find((r) => r.id === idA) ?? null;
  const resumeB = resumes.find((r) => r.id === idB) ?? null;
  const ready = resumeA && resumeB && idA !== idB;

  return (
    <main>
      <Navbar />
      <section className="main-section">
        <div className="page-heading" style={{ paddingTop: "1.5rem" }}>
          <h1>Compare Resumes</h1>
          <p className="page-subheading">
            Select two resumes to see a side-by-side score breakdown
          </p>
        </div>

        {loading && <Spinner label="Loading resumes…" />}

        {!loading && resumes.length < 2 && (
          <div
            className="empty-state"
            style={{
              maxWidth: "440px",
              background: "#ffffff",
              border: "1px solid #e6e5e0",
              borderRadius: "12px",
              padding: "2.5rem 1.75rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "3rem",
                height: "3rem",
                borderRadius: "8px",
                background: "#fafaf7",
                border: "1px solid #e6e5e0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 0.75rem",
                color: "#807d72",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="18" />
                <rect x="14" y="3" width="7" height="18" />
              </svg>
            </div>
            <div>
              <p
                style={{
                  fontWeight: 500,
                  color: "#26251e",
                  fontSize: "1.125rem",
                  letterSpacing: "-0.015em",
                  marginBottom: "0.375rem",
                }}
              >
                Not enough resumes
              </p>
              <p style={{ color: "#5a5852", fontSize: "0.875rem", lineHeight: 1.5 }}>
                You need at least 2 analyzed resumes to run a side-by-side comparison.
              </p>
            </div>
            <Link to="/upload" className="primary-button" style={{ marginTop: "1rem" }}>
              Analyze a Resume
            </Link>
          </div>
        )}

        {!loading && resumes.length >= 2 && (
          <div
            style={{
              width: "100%",
              maxWidth: "1040px",
              display: "flex",
              flexDirection: "column",
              gap: "2rem",
            }}
          >
            {/* Selectors */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                flexWrap: "wrap",
                alignItems: "flex-end",
              }}
            >
              <ResumeSelector
                label="Resume A"
                value={idA}
                onChange={handleSelectA}
                resumes={resumes}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingBottom: "0.75rem",
                  color: "#807d72",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                vs
              </div>
              <ResumeSelector
                label="Resume B"
                value={idB}
                onChange={handleSelectB}
                resumes={resumes}
              />
            </div>

            {idA && idB && idA === idB && (
              <p
                style={{
                  color: "#c08532",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8125rem",
                  textAlign: "center",
                }}
              >
                Please select two different resumes.
              </p>
            )}

            {ready && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                  animation: "fadeIn 0.3s ease",
                }}
              >
                {/* Thumbnail row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto 1fr",
                    gap: "1.25rem",
                    alignItems: "start",
                  }}
                >
                  {/* Card A */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e6e5e0",
                      borderRadius: "12px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "1rem 1.25rem",
                        borderBottom: "1px solid #efeee8",
                        background: "#fafaf7",
                      }}
                    >
                      <p
                        style={{
                          fontWeight: 500,
                          color: "#26251e",
                          fontSize: "0.9375rem",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {resumeA.companyName || "Resume A"}
                      </p>
                      {resumeA.jobTitle && (
                        <p
                          style={{
                            fontSize: "0.8125rem",
                            color: "#5a5852",
                            marginTop: "0.125rem",
                          }}
                        >
                          {resumeA.jobTitle}
                        </p>
                      )}
                    </div>
                    {imgA && (
                      <img
                        src={imgA}
                        alt="Resume A"
                        style={{
                          width: "100%",
                          height: "180px",
                          objectFit: "cover",
                          objectPosition: "top",
                          borderBottom: "1px solid #efeee8",
                        }}
                      />
                    )}
                    <div
                      style={{
                        padding: "1rem",
                        display: "flex",
                        justifyContent: "center",
                        background: "#ffffff",
                      }}
                    >
                      <ScoreGauge score={resumeA.feedback?.overallScore ?? 0} />
                    </div>
                  </div>

                  {/* vs */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      paddingTop: "5rem",
                    }}
                  >
                    <span
                      style={{
                        color: "#807d72",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        letterSpacing: "0.1em",
                      }}
                    >
                      VS
                    </span>
                  </div>

                  {/* Card B */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e6e5e0",
                      borderRadius: "12px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "1rem 1.25rem",
                        borderBottom: "1px solid #efeee8",
                        background: "#fafaf7",
                      }}
                    >
                      <p
                        style={{
                          fontWeight: 500,
                          color: "#26251e",
                          fontSize: "0.9375rem",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {resumeB.companyName || "Resume B"}
                      </p>
                      {resumeB.jobTitle && (
                        <p
                          style={{
                            fontSize: "0.8125rem",
                            color: "#5a5852",
                            marginTop: "0.125rem",
                          }}
                        >
                          {resumeB.jobTitle}
                        </p>
                      )}
                    </div>
                    {imgB && (
                      <img
                        src={imgB}
                        alt="Resume B"
                        style={{
                          width: "100%",
                          height: "180px",
                          objectFit: "cover",
                          objectPosition: "top",
                          borderBottom: "1px solid #efeee8",
                        }}
                      />
                    )}
                    <div
                      style={{
                        padding: "1rem",
                        display: "flex",
                        justifyContent: "center",
                        background: "#ffffff",
                      }}
                    >
                      <ScoreGauge score={resumeB.feedback?.overallScore ?? 0} />
                    </div>
                  </div>
                </div>

                {/* Score rows */}
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e6e5e0",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  {CATEGORIES.filter((c) => c.key !== "overallScore").map((cat, i) => {
                    const sA = getScore(resumeA, cat.key);
                    const sB = getScore(resumeB, cat.key);
                    const delta = sA - sB;
                    const tipA = getTopTip(resumeA, cat.key);
                    const tipB = getTopTip(resumeB, cat.key);
                    return (
                      <div
                        key={cat.key}
                        style={{
                          padding: "1rem 1.25rem",
                          borderTop: i > 0 ? "1px solid #efeee8" : "none",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr auto 1fr",
                            gap: "1.25rem",
                            alignItems: "center",
                          }}
                        >
                          <ScoreBar score={sA} win={sA > sB} />
                          <div style={{ textAlign: "center", minWidth: "110px" }}>
                            <span
                              style={{
                                fontSize: "0.8125rem",
                                fontWeight: 500,
                                color: "#26251e",
                                display: "block",
                              }}
                            >
                              {cat.label}
                            </span>
                            {delta !== 0 && (
                              <span
                                style={{
                                  fontSize: "0.6875rem",
                                  fontFamily: "var(--font-mono)",
                                  fontWeight: 500,
                                  color: delta > 0 ? "#1f8a65" : "#c08532",
                                }}
                              >
                                {delta > 0
                                  ? `+${delta} on A`
                                  : `+${Math.abs(delta)} on B`}
                              </span>
                            )}
                          </div>
                          <ScoreBar score={sB} win={sB > sA} />
                        </div>
                        {(tipA || tipB) && (
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr auto 1fr",
                              gap: "1.25rem",
                              marginTop: "0.625rem",
                              fontSize: "0.75rem",
                              color: "#5a5852",
                              lineHeight: 1.45,
                            }}
                          >
                            <span>{tipA}</span>
                            <span style={{ minWidth: "110px" }}></span>
                            <span>{tipB}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Winner banner */}
                {(() => {
                  const sA = getScore(resumeA, "overallScore");
                  const sB = getScore(resumeB, "overallScore");
                  if (sA === sB) return null;
                  const winner = sA > sB ? resumeA : resumeB;
                  return (
                    <div
                      style={{
                        background: "#fafaf7",
                        border: "1px solid #e6e5e0",
                        borderRadius: "8px",
                        padding: "0.875rem 1.25rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "9999px",
                          background: "#1f8a65",
                          flexShrink: 0,
                        }}
                      />
                      <p style={{ fontSize: "0.875rem", color: "#26251e" }}>
                        <strong style={{ fontWeight: 600 }}>
                          {winner.companyName || (sA > sB ? "Resume A" : "Resume B")}
                        </strong>
                        {winner.jobTitle ? ` (${winner.jobTitle})` : ""} has the stronger
                        overall score —{" "}
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontWeight: 600,
                            color: "#1f8a65",
                          }}
                        >
                          {Math.max(sA, sB)}/100
                        </span>
                      </p>
                    </div>
                  );
                })()}

                {/* View links */}
                <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                  <Link to={`/resume/${idA}`} className="back-button">
                    View Resume A →
                  </Link>
                  <Link to={`/resume/${idB}`} className="back-button">
                    View Resume B →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
};

export default Compare;
