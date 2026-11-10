import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStore } from "~/lib/store";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import KeywordGap from "~/components/KeywordGap";
import Details from "~/components/Details";
import Spinner from "~/components/Spinner";
import Toast, { useToast } from "~/components/Toast";
import AtsXRayViewer from "~/components/AtsXRayViewer";
import BulletDiffRewriter from "~/components/BulletDiffRewriter";
import JobMatchDrawer from "~/components/JobMatchDrawer";
import CommandPalette from "~/components/CommandPalette";
import InterviewPrep from "~/components/InterviewPrep";
import { extractTextFromPdf } from "~/lib/pdf2img";

export const meta = () => [
  { title: "RealityChecker | Review" },
  { name: "description", content: "Detailed AI feedback for your resume" },
];

const ResumeDetail = () => {
  const { isLoading, isAuthenticated, storage, resumes: resumeStore } = useStore();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toasts, addToast, removeToast } = useToast();

  const [imageUrl, setImageUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [sharing, setSharing] = useState(false);
  const [hasRefetchedImage, setHasRefetchedImage] = useState(false);
  const [inspectorView, setInspectorView] = useState<"visual" | "xray">("visual");
  const [rawText, setRawText] = useState<string>("");
  const [extractingText, setExtractingText] = useState(false);
  const [isJobMatchOpen, setIsJobMatchOpen] = useState(false);

  useEffect(() => {
    if ((inspectorView === "xray" || isJobMatchOpen) && !rawText && resumeUrl) {
      setExtractingText(true);
      fetch(resumeUrl)
        .then((res) => res.arrayBuffer())
        .then((buffer) => extractTextFromPdf(buffer))
        .then((text) => setRawText(text))
        .catch((err) => console.warn("Failed to extract raw text:", err))
        .finally(() => setExtractingText(false));
    }
  }, [inspectorView, isJobMatchOpen, rawText, resumeUrl]);

  const handleImageError = () => {
    if (hasRefetchedImage || !resume?.imagePath) return;
    setHasRefetchedImage(true);
    storage
      .getSignedUrl("resume-images", resume.imagePath, 3600)
      .then((url) => setImageUrl(url))
      .catch(() => {});
  };

  const { data: resume, isLoading: loadingResume } = useQuery({
    queryKey: ["resume", id],
    queryFn: async () => {
      if (!id) return null;
      return await resumeStore.get(id);
    },
    enabled: Boolean(id) && !isLoading,
  });

  const isPublic = Boolean(resume?.isPublic);
  const companyName = resume?.companyName ?? "";
  const jobTitle = resume?.jobTitle ?? "";
  const feedback = resume?.feedback ?? null;

  useEffect(() => {
    if (!resume) return;

    if (resume.resumePath) {
      storage
        .getSignedUrl("resume-files", resume.resumePath, 3600)
        .then((url) => setResumeUrl(url))
        .catch(() => {});
    }
    if (resume.imagePath) {
      storage
        .getSignedUrl("resume-images", resume.imagePath, 3600)
        .then((url) => setImageUrl(url))
        .catch(() => {});
    }
  }, [resume, storage]);

  const handleExportPDF = () => window.print();

  const handleShare = async () => {
    if (!id || !resume) return;
    setSharing(true);
    try {
      const nextState = !isPublic;
      await resumeStore.togglePublic(id, nextState);
      queryClient.setQueryData(["resume", id], { ...resume, isPublic: nextState });
      const shareUrl = `${window.location.origin}/resume/${id}`;
      if (nextState) {
        await navigator.clipboard.writeText(shareUrl).catch(() => {});
        addToast("Public link created and copied to clipboard!", "success");
      } else {
        addToast("Sharing revoked. Resume is now private.", "info");
      }
    } catch {
      addToast("Failed to update share status", "error");
    } finally {
      setSharing(false);
    }
  };

  if (!loadingResume && !resume && !isLoading) {
    return (
      <main
        style={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e6e5e0",
            borderRadius: "12px",
            padding: "2.5rem",
            maxWidth: "440px",
            width: "100%",
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
              margin: "0 auto 1.25rem",
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#cf2d56"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 500,
              color: "#26251e",
              marginBottom: "0.5rem",
            }}
          >
            Resume Not Found
          </h2>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#5a5852",
              lineHeight: 1.5,
              marginBottom: "1.5rem",
            }}
          >
            This resume may have been deleted, or the link might be private.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <Link to="/" className="back-button" style={{ textDecoration: "none" }}>
              Dashboard
            </Link>
            <Link
              to="/upload"
              className="primary-button"
              style={{ textDecoration: "none" }}
            >
              Upload Resume
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="full-layout" style={{ paddingTop: 0 }}>
      <Toast toasts={toasts} onRemove={removeToast} />

      <JobMatchDrawer
        isOpen={isJobMatchOpen}
        onClose={() => setIsJobMatchOpen(false)}
        resumeText={rawText}
        existingKeywords={feedback?.keywordAnalysis}
      />

      {/* Sticky top nav */}
      <nav className="resume-nav" id="resume-nav-bar">
        <Link to="/" className="back-button">
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
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Dashboard
        </Link>

        <div style={{ textAlign: "center" }}>
          <span
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#26251e",
              display: "block",
            }}
          >
            Resume Review
          </span>
          {(companyName || jobTitle) && (
            <span
              style={{
                fontSize: "0.75rem",
                color: "#807d72",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              {companyName}
              {companyName && jobTitle ? " · " : ""}
              {jobTitle}
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.625rem", alignItems: "center" }}>
          <CommandPalette
            onToggleXRay={() => setInspectorView((prev) => (prev === "visual" ? "xray" : "visual"))}
            onOpenJobMatch={() => setIsJobMatchOpen(true)}
            onExportPDF={handleExportPDF}
          />

          <button
            type="button"
            onClick={() => setIsJobMatchOpen(true)}
            className="back-button"
            title="Compare your resume against a specific target job posting"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              background: isJobMatchOpen ? "#26251e" : undefined,
              color: isJobMatchOpen ? "#ffffff" : undefined,
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            <span>Match Job</span>
          </button>

          {isAuthenticated && id && (
            <Link
              to={`/upload?reanalyze=${id}`}
              className="back-button"
              title="Re-analyze with updated role or job description"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Re-analyze
            </Link>
          )}

          {isAuthenticated && (
            <button
              onClick={handleShare}
              disabled={sharing}
              className="back-button"
              title={
                isPublic
                  ? "Public link active — click to revoke"
                  : "Make public and copy link"
              }
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              {sharing ? "…" : isPublic ? "Shared (Public)" : "Share"}
            </button>
          )}

          <button
            onClick={handleExportPDF}
            className="back-button"
            title="Export as PDF"
            id="export-pdf-btn"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export PDF
          </button>

          {resumeUrl && (
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="primary-button"
              style={{ fontSize: "0.8125rem", padding: "0.45rem 1rem" }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Open PDF
            </a>
          )}
        </div>
      </nav>

      {!isAuthenticated && (
        <div
          style={{
            background: "#fafaf7",
            borderBottom: "1px solid #e6e5e0",
            padding: "0.625rem 1rem",
            textAlign: "center",
            fontSize: "0.8125rem",
            color: "#5a5852",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
          }}
        >
          <span>Viewing shared resume. Want your own AI feedback?</span>
          <Link
            to="/auth"
            style={{ color: "#f54e00", fontWeight: 500, textDecoration: "underline" }}
          >
            Create a free account →
          </Link>
        </div>
      )}

      {/* Body */}
      <div className="resume-layout">
        {/* Left — resume preview & ATS X-Ray */}
        <div className="resume-preview-panel" id="resume-preview-panel">
          {/* Sub-toolbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
              background: "#ffffff",
              padding: "4px",
              borderRadius: "8px",
              border: "1px solid #e6e5e0",
            }}
          >
            <div style={{ display: "flex", gap: "4px", width: "100%" }}>
              <button
                type="button"
                onClick={() => setInspectorView("visual")}
                style={{
                  flex: 1,
                  padding: "6px 12px",
                  fontSize: "0.75rem",
                  fontWeight: inspectorView === "visual" ? 600 : 400,
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  background: inspectorView === "visual" ? "#fafaf7" : "transparent",
                  color: inspectorView === "visual" ? "#26251e" : "#807d72",
                  boxShadow:
                    inspectorView === "visual" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.375rem",
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                Visual PDF
              </button>
              <button
                type="button"
                onClick={() => setInspectorView("xray")}
                style={{
                  flex: 1,
                  padding: "6px 12px",
                  fontSize: "0.75rem",
                  fontWeight: inspectorView === "xray" ? 600 : 400,
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  background: inspectorView === "xray" ? "#fafaf7" : "transparent",
                  color: inspectorView === "xray" ? "#26251e" : "#807d72",
                  boxShadow:
                    inspectorView === "xray" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.375rem",
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="4 17 10 11 4 5" />
                  <line x1="12" y1="19" x2="20" y2="19" />
                </svg>
                ATS X-Ray Stream
              </button>
            </div>
          </div>

          {inspectorView === "visual" ? (
            imageUrl ? (
              <a
                href={resumeUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                style={{ width: "100%", display: "block" }}
              >
                <img
                  src={imageUrl}
                  alt="Resume preview"
                  onError={handleImageError}
                  className="resume-preview-img"
                />
              </a>
            ) : (
              <Spinner />
            )
          ) : (
            <AtsXRayViewer rawText={rawText} loading={extractingText} />
          )}
        </div>

        {/* Right — feedback */}
        <div className="resume-feedback-panel">
          <div>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 400,
                color: "#26251e",
                letterSpacing: "-0.02em",
                marginBottom: "0.25rem",
              }}
            >
              Resume Analysis
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#5a5852" }}>
              AI-powered feedback across tone, content, structure &amp; ATS compatibility
            </p>
          </div>

          {feedback ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
                animation: "fadeIn 0.5s ease",
              }}
            >
              <Summary feedback={feedback} />
              <KeywordGap analysis={feedback.keywordAnalysis} />
              <BulletDiffRewriter jobTitle={jobTitle} />
              <ATS
                score={feedback.ATS?.score ?? 0}
                suggestions={feedback.ATS?.tips ?? []}
              />
              <InterviewPrep
                feedback={feedback}
                jobTitle={jobTitle}
                companyName={companyName}
              />
              <Details feedback={feedback} />
            </div>
          ) : (
            <Spinner />
          )}
        </div>
      </div>
    </main>
  );
};

export default ResumeDetail;
