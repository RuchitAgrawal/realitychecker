import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import Spinner from "~/components/Spinner";
import ConfirmModal from "~/components/ConfirmModal";
import Toast, { useToast } from "~/components/Toast";
import { useStore } from "~/lib/store";
import { Link, useNavigate } from "react-router";
import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "RealityChecker — Smart Resume Feedback" },
    { name: "description", content: "AI-powered resume analysis and ATS scoring." },
  ];
}

type SortOption = "newest" | "oldest" | "score-high" | "score-low";
type ScoreFilter = "all" | "high" | "mid" | "low";

export default function Home() {
  const { isLoading, isAuthenticated, resumes: resumeStore, user } = useStore();
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const queryClient = useQueryClient();

  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/auth");
  }, [isLoading, isAuthenticated, navigate]);

  const { data: resumes = [], isLoading: loadingResumes } = useQuery({
    queryKey: ["resumes"],
    queryFn: () => resumeStore.list(),
    enabled: isAuthenticated,
  });

  const avgScore = useMemo(() => {
    if (!resumes.length) return 0;
    const total = resumes.reduce((acc, r) => acc + (r.feedback?.overallScore ?? 0), 0);
    return Math.round(total / resumes.length);
  }, [resumes]);

  const topGap = useMemo(() => {
    if (!resumes.length) return "None detected";
    const map = new Map<string, number>();
    for (const r of resumes) {
      const missing = r.feedback?.keywordAnalysis?.missing || [];
      for (const m of missing) {
        map.set(m, (map.get(m) || 0) + 1);
      }
    }
    let topKey = "";
    let maxCount = 0;
    for (const [k, count] of map.entries()) {
      if (count > maxCount) {
        maxCount = count;
        topKey = k;
      }
    }
    return topKey || "System Metrics";
  }, [resumes]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      navigate("/upload", { state: { initialFile: droppedFile } });
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 2
          ? [...prev, id]
          : [prev[1] ?? "", id].filter(Boolean)
    );
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const executeDelete = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setDeletingId(id);
    setConfirmDeleteId(null);
    try {
      await resumeStore.delete(id);
      queryClient.setQueryData<Resume[]>(["resumes"], (old = []) =>
        old.filter((r) => r.id !== id)
      );
      addToast("Resume deleted", "success");
    } catch {
      addToast("Failed to delete resume", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const sorted = [...resumes].sort((a, b) => {
    if (sortBy === "newest") return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    if (sortBy === "oldest") return (a.createdAt ?? 0) - (b.createdAt ?? 0);
    if (sortBy === "score-high")
      return (b.feedback?.overallScore ?? 0) - (a.feedback?.overallScore ?? 0);
    if (sortBy === "score-low")
      return (a.feedback?.overallScore ?? 0) - (b.feedback?.overallScore ?? 0);
    return 0;
  });

  const filtered = sorted.filter((r) => {
    const score = r.feedback?.overallScore ?? 0;
    if (scoreFilter === "high" && score < 70) return false;
    if (scoreFilter === "mid" && (score < 50 || score >= 70)) return false;
    if (scoreFilter === "low" && score >= 50) return false;

    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const company = (r.companyName || "").toLowerCase();
    const title = (r.jobTitle || "").toLowerCase();
    return company.includes(term) || title.includes(term);
  });

  return (
    <main>
      <Navbar />
      <Toast toasts={toasts} onRemove={removeToast} />

      <section className="main-section">
        {/* Editorial Heading */}
        <div style={{ maxWidth: "1200px", width: "100%", margin: "0 auto 1.5rem" }}>
          <h1
            style={{
              fontSize: "1.375rem",
              fontWeight: 500,
              color: "#26251e",
              letterSpacing: "-0.02em",
              marginBottom: "0.25rem",
            }}
          >
            {user?.user_metadata?.full_name
              ? `${user.user_metadata.full_name}'s Evaluator Workbench`
              : "Candidate Evaluations"}
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "#807d72", margin: 0 }}>
            {user?.user_metadata?.target_role
              ? `Targeting ${user.user_metadata.target_role} · Precision ATS scoring & Google XYZ bullet rewriter`
              : "Precision ATS scoring, gap detection, and Google XYZ bullet rewriter"}
          </p>
        </div>

        {/* Hero Dropzone & Metrics Strip */}
        <div className="home-hero-container">
          <div
            className={`home-dropzone ${isDragging ? "dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => navigate("/upload")}
            title="Drop PDF or click to analyze a new resume"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  borderRadius: "8px",
                  background: "#fafaf7",
                  border: "1px solid #e6e5e0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#f54e00",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    color: "#26251e",
                    display: "block",
                  }}
                >
                  Drop candidate PDF for instant ATS &amp; keyword audit
                </span>
                <span style={{ fontSize: "0.8125rem", color: "#807d72" }}>
                  Full token stream parsing, STAR formula diffs, and interview questions in &lt; 5s
                </span>
              </div>
            </div>

            <button
              type="button"
              className="navbar-action-primary"
              style={{ padding: "0.45rem 1rem", fontSize: "0.8125rem" }}
            >
              Select PDF File →
            </button>
          </div>

          {resumes.length > 0 && (
            <div className="home-stats-strip">
              <div className="home-stat-card">
                <span className="home-stat-label">Evaluated Candidates</span>
                <div className="home-stat-value">
                  {resumes.length}
                  <span style={{ fontSize: "0.8125rem", fontWeight: 400, color: "#807d72" }}>
                    {resumes.length === 1 ? "document" : "documents"}
                  </span>
                </div>
                <span className="home-stat-sub">Active in current workspace</span>
              </div>

              <div className="home-stat-card">
                <span className="home-stat-label">Average ATS Readiness</span>
                <div className="home-stat-value">
                  <span
                    style={{
                      color:
                        avgScore >= 70 ? "#008542" : avgScore >= 50 ? "#c97d00" : "#cf2d56",
                    }}
                  >
                    {avgScore}
                  </span>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 400, color: "#807d72" }}>
                    / 100
                  </span>
                </div>
                <span className="home-stat-sub">
                  {avgScore >= 70
                    ? "Strong ATS candidate match"
                    : "Keyword & metric optimization recommended"}
                </span>
              </div>

              <div className="home-stat-card">
                <span className="home-stat-label">Top Recurring Skill Gap</span>
                <div className="home-stat-value" style={{ fontSize: "1.125rem" }}>
                  {topGap}
                </div>
                <span className="home-stat-sub">Most frequent missing technical keyword</span>
              </div>
            </div>
          )}
        </div>

        {!loadingResumes && resumes.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
              width: "100%",
              maxWidth: "1200px",
              margin: "0 auto 1.25rem",
            }}
          >
            <div
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                width: "100%",
                maxWidth: "300px",
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#807d72"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ position: "absolute", left: "0.75rem", pointerEvents: "none" }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search candidates or roles…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.75rem 0.45rem 2rem",
                  fontSize: "0.8125rem",
                  borderRadius: "6px",
                  border: "1px solid #e6e5e0",
                  background: "#ffffff",
                }}
              />
            </div>

            {resumes.length > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  flexWrap: "wrap",
                }}
              >
                <select
                  value={scoreFilter}
                  onChange={(e) => setScoreFilter(e.target.value as ScoreFilter)}
                  className="select-dropdown"
                  title="Filter by score"
                >
                  <option value="all">All scores</option>
                  <option value="high">Score 70+ (Strong)</option>
                  <option value="mid">Score 50-69 (Average)</option>
                  <option value="low">Score &lt;50 (Needs Work)</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="select-dropdown"
                  title="Sort order"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="score-high">Highest score</option>
                  <option value="score-low">Lowest score</option>
                </select>
              </div>
            )}
          </div>
        )}

        {loadingResumes && <Spinner label="Loading evaluations…" size={40} />}

        {!loadingResumes && filtered.length > 0 && (
          <div className="resumes-section">
            {filtered.map((resume) => (
              <div key={resume.id} style={{ position: "relative" }}>
                <ResumeCard
                  resume={resume}
                  selected={selectedIds.includes(resume.id)}
                  onToggleSelect={(e) => toggleSelect(resume.id, e)}
                />
                <button
                  onClick={(e) => handleDeleteClick(resume.id, e)}
                  disabled={deletingId === resume.id}
                  title="Delete this resume"
                  className="btn-delete-card"
                >
                  {deletingId === resume.id ? "…" : "✕"}
                </button>
              </div>
            ))}

            {/* Embedded New Resume Action Card in grid */}
            <Link to="/upload" className="home-new-card">
              <div
                style={{
                  width: "2.75rem",
                  height: "2.75rem",
                  borderRadius: "8px",
                  background: "#fafaf7",
                  border: "1px solid #e6e5e0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#f54e00",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    color: "#26251e",
                    display: "block",
                  }}
                >
                  Analyze New Resume
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#807d72",
                    marginTop: "0.25rem",
                    display: "block",
                  }}
                >
                  Upload and evaluate another candidate PDF
                </span>
              </div>
            </Link>
          </div>
        )}

        {!loadingResumes && resumes.length === 0 && (
          <div className="empty-state" style={{ maxWidth: "440px" }}>
            <div
              style={{
                width: "3.5rem",
                height: "3.5rem",
                borderRadius: "8px",
                background: "#fafaf7",
                border: "1px solid #e6e5e0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#26251e"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <p
                style={{
                  fontWeight: 500,
                  color: "#26251e",
                  fontSize: "1.05rem",
                  marginBottom: "0.25rem",
                }}
              >
                No resumes analyzed yet
              </p>
              <p style={{ color: "#5a5852", fontSize: "0.875rem" }}>
                Upload your resume to receive role-tailored feedback and ATS scores.
              </p>
            </div>
            <Link to="/upload" className="primary-button" style={{ marginTop: "0.5rem" }}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload Your First Resume
            </Link>
          </div>
        )}
        {selectedIds.length > 0 && (
          <div
            style={{
              position: "fixed",
              bottom: "1.5rem",
              left: "50%",
              transform: "translateX(-50%)",
              background: "#26251e",
              border: "1px solid #26251e",
              borderRadius: "8px",
              padding: "0.625rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              zIndex: 100,
            }}
          >
            <span
              style={{
                fontSize: "0.85rem",
                color: "#f7f7f4",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              {selectedIds.length} of 2 selected
            </span>
            {selectedIds.length === 2 && (
              <button
                onClick={() =>
                  navigate(`/compare?a=${selectedIds[0]}&b=${selectedIds[1]}`)
                }
                className="primary-button"
                style={{
                  padding: "0.35rem 0.875rem",
                  fontSize: "0.8rem",
                  height: "32px",
                }}
              >
                Compare Selected →
              </button>
            )}
            <button
              onClick={() => setSelectedIds([])}
              style={{
                background: "none",
                border: "none",
                color: "#a09c92",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              Clear
            </button>
          </div>
        )}
        {confirmDeleteId && (
          <ConfirmModal
            title="Delete Resume"
            message="Are you sure you want to delete this resume analysis? This action cannot be undone."
            confirmLabel="Delete Resume"
            onConfirm={executeDelete}
            onCancel={() => setConfirmDeleteId(null)}
          />
        )}
      </section>
    </main>
  );
}
