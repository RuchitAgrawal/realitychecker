import { useState, useCallback, useEffect } from "react";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import Toast, { useToast } from "~/components/Toast";
import { useStore } from "~/lib/store";
import { useNavigate, useSearchParams } from "react-router";
import { convertPdfToImage, extractTextFromPdf } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/utils";

export const meta = () => [
  { title: "RealityChecker — Analyze Resume" },
  {
    name: "description",
    content: "Upload your resume and get instant AI-powered feedback",
  },
];

type AnalysisStatus = "idle" | "processing" | "error";

const STEPS = [
  { id: 1, label: "Extracting resume content", stage: "thinking", pill: "Thinking" },
  { id: 2, label: "Rendering document preview", stage: "grep", pill: "Grepping" },
  { id: 3, label: "Storing document assets", stage: "read", pill: "Reading" },
  { id: 4, label: "Evaluating ATS score & feedback", stage: "edit", pill: "Evaluating" },
  { id: 5, label: "Finalizing analysis report", stage: "done", pill: "Done" },
];

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms / 1000}s`)),
      ms
    );
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

const Upload = () => {
  const { storage, resumes: resumeStore } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toasts, addToast, removeToast } = useToast();

  const reanalyzeId = searchParams.get("reanalyze");

  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [doneSteps, setDoneSteps] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (status === "processing") {
      setElapsedSeconds(0);
      interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  useEffect(() => {
    if (!reanalyzeId) return;
    resumeStore
      .get(reanalyzeId)
      .then((existing) => {
        if (existing) {
          if (existing.companyName) setCompanyName(existing.companyName);
          if (existing.jobTitle) setJobTitle(existing.jobTitle);
          if (existing.jobDescription) setJobDescription(existing.jobDescription);
          addToast("Pre-filled job details from existing resume.", "info");
        }
      })
      .catch(() => {});
  }, [reanalyzeId, resumeStore]);

  const handleFileSelect = useCallback((selectedFile: File | null) => {
    setFile(selectedFile);
    if (selectedFile) setFileError("");
  }, []);

  const markStep = (step: number) => {
    setCurrentStep(step);
    setDoneSteps((prev) => [...prev, step - 1].filter((s) => s > 0));
  };

  const reset = () => {
    setStatus("idle");
    setCurrentStep(0);
    setDoneSteps([]);
    setErrorMessage("");
  };

  const handleAnalyze = async () => {
    if (!file) {
      setFileError("Please upload a resume PDF file first.");
      return;
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setFileError("Invalid file type. Please upload a valid PDF document.");
      return;
    }
    setStatus("processing");
    setErrorMessage("");
    setFileError("");
    setCurrentStep(1);
    setDoneSteps([]);

    const fail = (msg: string) => {
      setErrorMessage(msg);
      setStatus("error");
      addToast(msg, "error");
    };

    try {
      // ── Step 1: Extract text ─────────────────────────────────
      markStep(1);
      let resumeText = "";
      try {
        resumeText = await withTimeout(
          extractTextFromPdf(file),
          30_000,
          "Text extraction"
        );
      } catch (e) {
        console.warn("Text extraction failed:", e);
      }
      if (!resumeText || resumeText.trim().length < 50) {
        return fail(
          "Could not read text from this PDF. Please ensure it is a text-based PDF (not a scanned image)."
        );
      }

      // ── Step 2: Convert to image ─────────────────────────────
      markStep(2);
      let imageFile: File | null = null;
      try {
        const result = await withTimeout(convertPdfToImage(file), 30_000, "PDF preview");
        imageFile = result.file;
      } catch (e) {
        console.warn("Image conversion failed (non-fatal):", e);
      }

      // ── Step 3: Upload files to Supabase Storage ─────────────
      markStep(3);
      const uuid = generateUUID();
      const resumePath = await withTimeout(
        storage.uploadFile("resume-files", file, `${uuid}/${file.name}`),
        60_000,
        "File upload"
      );

      let imagePath = "";
      if (imageFile) {
        try {
          imagePath = await withTimeout(
            storage.uploadFile("resume-images", imageFile, `${uuid}/preview.png`),
            30_000,
            "Image upload"
          );
        } catch (e) {
          console.warn("Image upload failed (non-fatal):", e);
        }
      }

      // ── Step 4: AI analysis via Groq edge function ────────────
      markStep(4);
      const analysisRes = await withTimeout(
        fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeText: resumeText.substring(0, 10000),
            jobTitle: jobTitle.trim() || undefined,
            jobDescription: jobDescription.trim() || undefined,
          }),
        }),
        180_000,
        "AI analysis"
      );

      if (!analysisRes.ok) {
        const errData = await analysisRes.json().catch(() => ({}));
        return fail((errData as any).error ?? "AI analysis failed. Please try again.");
      }

      const { feedback } = await analysisRes.json();
      if (!feedback) return fail("AI returned no feedback. Please try again.");

      // ── Step 5: Save to Supabase ──────────────────────────────
      markStep(5);
      const saved = await withTimeout(
        resumeStore.create({
          companyName: companyName.trim(),
          jobTitle: jobTitle.trim(),
          jobDescription: jobDescription.trim(),
          resumePath,
          imagePath,
          feedback,
        }),
        30_000,
        "Save"
      );
      setDoneSteps([1, 2, 3, 4, 5]);
      addToast("Analysis complete!", "success");
      setTimeout(() => navigate(`/resume/${saved.id}`), 600);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Analysis pipeline error:", err);
      fail(`Something went wrong: ${msg}`);
    }
  };

  return (
    <main>
      <Navbar />
      <Toast toasts={toasts} onRemove={removeToast} />

      <section className="main-section">
        <div className="page-heading" style={{ paddingTop: "2rem" }}>
          <h1>
            Smart feedback for
            <br />
            your dream job
          </h1>

          {/* ── Processing ── */}
          {status === "processing" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1.5rem",
                marginTop: "1.5rem",
                width: "100%",
                maxWidth: "480px",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "#26251e", fontSize: "1rem", fontWeight: 500 }}>
                  Analyzing your resume
                </p>
                <p style={{ color: "#807d72", fontSize: "0.8125rem", marginTop: "0.25rem", fontFamily: "JetBrains Mono, monospace" }}>
                  Elapsed time: {elapsedSeconds}s
                </p>
              </div>

              <div className="progress-steps">
                {STEPS.map((step) => {
                  const isDone = doneSteps.includes(step.id);
                  const isActive = currentStep === step.id && !isDone;
                  const cls = isDone ? "done" : isActive ? "active" : "";
                  return (
                    <div key={step.id} className={`progress-step ${cls}`}>
                      <span className={`timeline-pill timeline-pill-${step.stage}`}>
                        {step.pill}
                      </span>
                      <span className={`step-label ${cls || "idle"}`}>{step.label}</span>
                      {isActive && (
                        <div style={{ marginLeft: "auto", flexShrink: 0 }}>
                          <div
                            style={{
                              width: "14px",
                              height: "14px",
                              border: "2px solid #e6e5e0",
                              borderTopColor: "#f54e00",
                              borderRadius: "9999px",
                              animation: "spin 0.8s linear infinite",
                            }}
                          />
                        </div>
                      )}
                      {isDone && (
                        <span style={{ marginLeft: "auto", color: "#1f8a65", fontSize: "0.875rem", fontWeight: 600 }}>
                          ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p
                style={{
                  color: "#807d72",
                  fontSize: "0.75rem",
                  maxWidth: "380px",
                  textAlign: "center",
                }}
              >
                AI analysis evaluates structure, impact, tone, and keyword coverage.
              </p>
            </div>
          )}

          {/* ── Error ── */}
          {status === "error" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1.25rem",
                marginTop: "1.5rem",
                width: "100%",
                maxWidth: "440px",
              }}
            >
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #cf2d56",
                  borderLeft: "4px solid #cf2d56",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  width: "100%",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    color: "#cf2d56",
                    fontWeight: 600,
                    fontSize: "0.9375rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  Analysis Failed
                </p>
                <p style={{ color: "#5a5852", fontSize: "0.875rem", lineHeight: 1.5 }}>
                  {errorMessage}
                </p>
              </div>
              <button className="primary-button" onClick={reset}>
                Try Again
              </button>
            </div>
          )}

          {/* ── Idle ── */}
          {status === "idle" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1.5rem",
                marginTop: "1rem",
                width: "100%",
                maxWidth: "540px",
              }}
            >
              <p style={{ color: "#5a5852", fontSize: "1.0625rem", lineHeight: 1.6 }}>
                Upload your resume and get an instant ATS score with actionable editorial feedback.
              </p>

              <div
                style={{
                  width: "100%",
                  background: "#ffffff",
                  border: "1px solid #e6e5e0",
                  borderRadius: "12px",
                  padding: "1.75rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                }}
              >
                <div>
                  <FileUploader
                    file={file}
                    onFileSelect={handleFileSelect}
                    onError={(msg) => setFileError(msg)}
                  />
                  {fileError && (
                    <p
                      style={{
                        color: "#cf2d56",
                        fontSize: "0.8125rem",
                        marginTop: "0.5rem",
                        textAlign: "center",
                      }}
                    >
                      {fileError}
                    </p>
                  )}
                </div>

                {/* Job details */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      marginBottom: "0.875rem",
                    }}
                  >
                    <hr style={{ flex: 1, border: "none", borderTop: "1px solid #efeee8" }} />
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        color: "#807d72",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Target Role Details <span style={{ color: "#a09c92" }}>(optional)</span>
                    </span>
                    <hr style={{ flex: 1, border: "none", borderTop: "1px solid #efeee8" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <input
                        type="text"
                        placeholder="Company name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <input
                        type="text"
                        placeholder="Target job title"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        style={{ flex: 1 }}
                      />
                    </div>
                    <div style={{ position: "relative" }}>
                      <textarea
                        placeholder="Paste the target job description here for keyword matching and role-specific feedback…"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        maxLength={3000}
                        rows={4}
                        style={{ width: "100%", resize: "vertical", lineHeight: 1.55 }}
                      />
                      <div
                        style={{
                          textAlign: "right",
                          fontSize: "0.7rem",
                          fontFamily: "JetBrains Mono, monospace",
                          color: jobDescription.length > 2700 ? "#c08532" : "#807d72",
                          marginTop: "0.25rem",
                        }}
                      >
                        {jobDescription.length} / 3000 chars
                      </div>
                    </div>
                  </div>
                  {jobTitle && jobDescription && (
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        color: "#1f8a65",
                        marginTop: "0.625rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                      }}
                    >
                      <span>✓</span> Feedback will be targeted for {jobTitle.trim()}
                    </p>
                  )}
                </div>

                <button
                  className="primary-button full"
                  onClick={handleAnalyze}
                >
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
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Analyze Resume
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;
