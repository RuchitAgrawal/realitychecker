import React, { useState, useRef, useEffect } from "react";
import { useStore } from "~/lib/store";
import { useNavigate } from "react-router";
import CandidateProfileModal from "./CandidateProfileModal";

const UserMenu: React.FC = () => {
  const { user, auth, isAuthenticated } = useStore();
  const [open, setOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAuthenticated || !user) return null;

  const email = user.email || "user@example.com";
  const metadata = (user.user_metadata || {}) as Record<string, string>;
  const fullName = metadata.full_name || "";
  const targetRole = metadata.target_role || "Engineering Candidate";
  const seniority = metadata.seniority || "Entry";

  // Calculate initials (e.g. "Ruchit Agrawal" -> "RA", or email "r")
  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : email[0]?.toUpperCase() || "U";

  const handleSignOut = async () => {
    try {
      setOpen(false);
      await auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      navigate("/auth");
    }
  };

  return (
    <>
      <div style={{ position: "relative" }} ref={menuRef}>
        <button
          onClick={() => setOpen((prev) => !prev)}
          type="button"
          title={fullName ? `${fullName} (${email})` : email}
          style={{
            width: "2.125rem",
            height: "2.125rem",
            borderRadius: "6px",
            background: "#26251e",
            color: "#f7f7f4",
            fontWeight: 600,
            fontSize: "0.75rem",
            border: "1px solid #1a1914",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.04em",
            transition: "all 0.12s ease",
          }}
        >
          {initials}
        </button>

        {open && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 0.5rem)",
              right: 0,
              background: "#ffffff",
              border: "1px solid #e6e5e0",
              borderRadius: "10px",
              boxShadow: "0 16px 36px rgba(0, 0, 0, 0.1)",
              width: "260px",
              zIndex: 1000,
              overflow: "hidden",
              animation: "fadeIn 0.12s ease",
            }}
          >
            {/* Identity Banner */}
            <div
              style={{
                padding: "0.875rem 1rem",
                background: "#fafaf7",
                borderBottom: "1px solid #efeee8",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.35rem" }}>
                <div
                  style={{
                    width: "2rem",
                    height: "2rem",
                    borderRadius: "6px",
                    background: "#26251e",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    fontFamily: "var(--font-mono)",
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#26251e",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fullName || "Candidate"}
                  </div>
                  <div
                    style={{
                      fontSize: "0.6875rem",
                      color: "#807d72",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {targetRole} · {seniority}
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: "0.6875rem",
                  color: "#807d72",
                  fontFamily: "var(--font-mono)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginTop: "0.25rem",
                }}
              >
                {email}
              </div>
            </div>

            {/* Live System Telemetry Strip */}
            <div
              style={{
                padding: "0.5rem 1rem",
                background: "#ffffff",
                borderBottom: "1px solid #efeee8",
                display: "flex",
                flexDirection: "column",
                gap: "0.3rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.6875rem" }}>
                <span style={{ color: "#807d72", fontFamily: "var(--font-mono)" }}>AI Engine:</span>
                <span style={{ color: "#008542", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#008542" }} />
                  Groq + Gemini
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.6875rem" }}>
                <span style={{ color: "#807d72", fontFamily: "var(--font-mono)" }}>Cache Layer:</span>
                <span style={{ color: "#008542", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#008542" }} />
                  Redis (40ms)
                </span>
              </div>
            </div>

            {/* Actions Menu */}
            <div style={{ padding: "0.375rem" }}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setIsProfileOpen(true);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  color: "#26251e",
                  background: "transparent",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.1s ease",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "#fafaf7")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#807d72"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span>Career Profile &amp; Settings</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  const event = new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true });
                  window.dispatchEvent(event);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  color: "#26251e",
                  background: "transparent",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.1s ease",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "#fafaf7")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#807d72"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>Command Palette</span>
                </div>
                <kbd
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.625rem",
                    background: "#efeee8",
                    padding: "0.1rem 0.3rem",
                    borderRadius: "4px",
                    color: "#807d72",
                  }}
                >
                  ⌘K
                </kbd>
              </button>

              <hr style={{ border: "none", borderTop: "1px solid #efeee8", margin: "0.35rem 0" }} />

              <button
                onClick={handleSignOut}
                type="button"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  color: "#cf2d56",
                  background: "transparent",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.1s ease",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "#fdf2f4")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Candidate Profile Settings Modal */}
      <CandidateProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
};

export default UserMenu;
