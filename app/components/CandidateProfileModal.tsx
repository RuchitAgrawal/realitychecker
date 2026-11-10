import { useState, useEffect } from "react";
import { useStore, type ProfileData } from "~/lib/store";

interface CandidateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const CandidateProfileModal = ({
  isOpen,
  onClose,
  onSaved,
}: CandidateProfileModalProps) => {
  const { user, auth } = useStore();

  const metadata = (user?.user_metadata || {}) as Record<string, string>;

  const [fullName, setFullName] = useState(metadata.full_name || "");
  const [targetRole, setTargetRole] = useState(metadata.target_role || "");
  const [seniority, setSeniority] = useState(metadata.seniority || "Entry");
  const [skills, setSkills] = useState(metadata.skills || "");
  const [targetCompanies, setTargetCompanies] = useState(metadata.target_companies || "");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen && user?.user_metadata) {
      const meta = user.user_metadata as Record<string, string>;
      setFullName(meta.full_name || "");
      setTargetRole(meta.target_role || "");
      setSeniority(meta.seniority || "Entry");
      setSkills(meta.skills || "");
      setTargetCompanies(meta.target_companies || "");
      setErrorMsg("");
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    try {
      const profile: ProfileData = {
        fullName: fullName.trim(),
        targetRole: targetRole.trim(),
        seniority,
        skills: skills.trim(),
        targetCompanies: targetCompanies.trim(),
      };

      const err = await auth.updateProfile(profile);
      if (err) {
        setErrorMsg(err);
      } else {
        if (onSaved) onSaved();
        onClose();
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(38, 37, 30, 0.45)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        animation: "fadeIn 0.15s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#ffffff",
          border: "1px solid #e6e5e0",
          borderRadius: "12px",
          boxShadow: "0 24px 48px rgba(0, 0, 0, 0.12)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid #efeee8",
            background: "#fafaf7",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div
              style={{
                width: "2rem",
                height: "2rem",
                borderRadius: "6px",
                background: "#ffffff",
                border: "1px solid #e6e5e0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#f54e00",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  color: "#26251e",
                  letterSpacing: "-0.01em",
                }}
              >
                Candidate Profile &amp; Preferences
              </h3>
              <span style={{ fontSize: "0.75rem", color: "#807d72" }}>
                Auto-configures target roles and ATS baseline benchmarks
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="navbar-action-btn"
            style={{
              padding: "0.25rem 0.5rem",
              fontSize: "0.8125rem",
              color: "#807d72",
            }}
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {errorMsg && (
            <div
              style={{
                padding: "0.625rem 0.875rem",
                background: "#fee2e2",
                border: "1px solid #fca5a5",
                borderRadius: "6px",
                fontSize: "0.8125rem",
                color: "#991b1b",
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#26251e",
                marginBottom: "0.35rem",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Full Name / Display Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ruchit Agrawal"
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                fontSize: "0.875rem",
                borderRadius: "6px",
                border: "1px solid #e6e5e0",
                background: "#ffffff",
                color: "#26251e",
                outline: "none",
              }}
            />
          </div>

          {/* Target Role & Seniority in a 2-col row */}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "0.75rem" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#26251e",
                  marginBottom: "0.35rem",
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Primary Target Role
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Software Engineer - Backend"
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.875rem",
                  borderRadius: "6px",
                  border: "1px solid #e6e5e0",
                  background: "#ffffff",
                  color: "#26251e",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#26251e",
                  marginBottom: "0.35rem",
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Target Level
              </label>
              <select
                value={seniority}
                onChange={(e) => setSeniority(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.875rem",
                  borderRadius: "6px",
                  border: "1px solid #e6e5e0",
                  background: "#ffffff",
                  color: "#26251e",
                  outline: "none",
                }}
              >
                <option value="Entry">Entry / New Grad (0-2 Yrs)</option>
                <option value="Mid">Mid-Level (2-5 Yrs)</option>
                <option value="Senior">Senior / Staff (5+ Yrs)</option>
              </select>
            </div>
          </div>

          {/* Tech Stack Skills */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#26251e",
                marginBottom: "0.35rem",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Core Technical Skills &amp; Stack
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Python, TypeScript, React, Docker, PostgreSQL, Redis, FastAPI"
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                fontSize: "0.875rem",
                borderRadius: "6px",
                border: "1px solid #e6e5e0",
                background: "#ffffff",
                color: "#26251e",
                outline: "none",
              }}
            />
            <span style={{ fontSize: "0.6875rem", color: "#807d72", marginTop: "0.25rem", display: "block" }}>
              Used by the keyword diff engine to verify your resume against your target stack.
            </span>
          </div>

          {/* Target Companies / Industry */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#26251e",
                marginBottom: "0.35rem",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Target Companies / Preferences
            </label>
            <input
              type="text"
              value={targetCompanies}
              onChange={(e) => setTargetCompanies(e.target.value)}
              placeholder="e.g. High-growth startups, Cloud platforms, Fintech"
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                fontSize: "0.875rem",
                borderRadius: "6px",
                border: "1px solid #e6e5e0",
                background: "#ffffff",
                color: "#26251e",
                outline: "none",
              }}
            />
          </div>

          {/* Action buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "0.625rem",
              marginTop: "0.5rem",
              paddingTop: "0.875rem",
              borderTop: "1px solid #efeee8",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="navbar-action-btn"
              disabled={saving}
              style={{ padding: "0.45rem 1rem" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="navbar-action-primary"
              disabled={saving}
              style={{ padding: "0.45rem 1.125rem" }}
            >
              {saving ? "Saving Preferences…" : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CandidateProfileModal;
