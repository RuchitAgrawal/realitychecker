import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useStore } from "~/lib/store";

interface CommandItem {
  id: string;
  category: "Navigation" | "Actions" | "Resumes";
  label: string;
  detail?: string;
  shortcut?: string;
  icon: React.ReactNode;
  perform: () => void;
}

interface CommandPaletteProps {
  onToggleXRay?: () => void;
  onOpenJobMatch?: () => void;
  onExportPDF?: () => void;
}

export const CommandPalette = ({
  onToggleXRay,
  onOpenJobMatch,
  onExportPDF,
}: CommandPaletteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { resumes: resumeStore, isAuthenticated } = useStore();
  const [resumesList, setResumesList] = useState<Resume[]>([]);

  // Listen for global Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch recent resumes when opening
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      resumeStore
        .list()
        .then((list) => setResumesList(list.slice(0, 5)))
        .catch(() => {});
    }
  }, [isOpen, isAuthenticated, resumeStore]);

  // Reset query on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const commands = useMemo<CommandItem[]>(() => {
    const base: CommandItem[] = [
      {
        id: "nav-dash",
        category: "Navigation",
        label: "Go to Dashboard",
        detail: "View all candidate resume evaluations",
        shortcut: "G D",
        icon: (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        ),
        perform: () => {
          navigate("/");
          setIsOpen(false);
        },
      },
      {
        id: "nav-upload",
        category: "Navigation",
        label: "Upload & Analyze New Resume",
        detail: "Run ATS parsing & keyword evaluation on a PDF",
        shortcut: "G U",
        icon: (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        ),
        perform: () => {
          navigate("/upload");
          setIsOpen(false);
        },
      },
      {
        id: "nav-compare",
        category: "Navigation",
        label: "Compare Resumes Side-by-Side",
        detail: "Category score delta and tip comparison",
        shortcut: "G C",
        icon: (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="18" />
            <rect x="14" y="3" width="7" height="18" />
          </svg>
        ),
        perform: () => {
          navigate("/compare");
          setIsOpen(false);
        },
      },
    ];

    if (onToggleXRay) {
      base.push({
        id: "act-xray",
        category: "Actions",
        label: "Toggle ATS X-Ray View",
        detail: "Inspect raw terminal token stream vs visual PDF",
        shortcut: "X",
        icon: (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
          </svg>
        ),
        perform: () => {
          onToggleXRay();
          setIsOpen(false);
        },
      });
    }

    if (onOpenJobMatch) {
      base.push({
        id: "act-match",
        category: "Actions",
        label: "Open Target Job Matcher",
        detail: "Paste job description to calculate role fitness",
        shortcut: "J",
        icon: (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        ),
        perform: () => {
          onOpenJobMatch();
          setIsOpen(false);
        },
      });
    }

    if (onExportPDF) {
      base.push({
        id: "act-export",
        category: "Actions",
        label: "Export Candidate Audit Report",
        detail: "Print or download executive PDF scorecard",
        shortcut: "⌘P",
        icon: (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        ),
        perform: () => {
          onExportPDF();
          setIsOpen(false);
        },
      });
    }

    // Add recent resumes
    for (const r of resumesList) {
      base.push({
        id: `resume-${r.id}`,
        category: "Resumes",
        label: r.companyName ? `${r.companyName} (${r.jobTitle || "Resume"})` : r.jobTitle || "Analyzed Resume",
        detail: `Overall Score: ${r.feedback?.overallScore ?? 0}/100`,
        icon: (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        ),
        perform: () => {
          navigate(`/resume/${r.id}`);
          setIsOpen(false);
        },
      });
    }

    return base;
  }, [navigate, onToggleXRay, onOpenJobMatch, onExportPDF, resumesList]);

  // Filter commands by query
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        (c.detail && c.detail.toLowerCase().includes(q)) ||
        c.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  // Handle arrow keys
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(filtered.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(filtered.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].perform();
      }
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="navbar-action-btn"
        title="Open Command Palette (⌘K)"
        style={{
          padding: "0.3rem 0.65rem",
          fontSize: "0.75rem",
          color: "#807d72",
        }}
      >
        <svg
          width="12"
          height="12"
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
        <span>Search</span>
        <kbd
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            background: "#fafaf7",
            border: "1px solid #cfcdc4",
            borderRadius: "4px",
            padding: "0.1rem 0.35rem",
            color: "#26251e",
          }}
        >
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(38, 37, 30, 0.45)",
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "12vh",
        paddingLeft: "1rem",
        paddingRight: "1rem",
        animation: "fadeIn 0.15s ease",
      }}
      onClick={() => setIsOpen(false)}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          background: "#ffffff",
          border: "1px solid #e6e5e0",
          borderRadius: "12px",
          boxShadow: "0 24px 48px rgba(0,0,0,0.12)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0.875rem 1.125rem",
            borderBottom: "1px solid #efeee8",
            gap: "0.75rem",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#807d72"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search resumes…"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "0.9375rem",
              fontFamily: "inherit",
              background: "transparent",
              color: "#26251e",
            }}
          />
          <kbd
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              background: "#fafaf7",
              border: "1px solid #cfcdc4",
              borderRadius: "4px",
              padding: "0.15rem 0.4rem",
              color: "#807d72",
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: "340px", overflowY: "auto", padding: "0.5rem" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "#807d72", fontSize: "0.8125rem" }}>
              No commands matching &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <div
                  key={item.id}
                  onClick={() => item.perform()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.625rem 0.875rem",
                    borderRadius: "6px",
                    background: isSelected ? "#fafaf7" : "transparent",
                    border: isSelected ? "1px solid #e6e5e0" : "1px solid transparent",
                    cursor: "pointer",
                    transition: "background 0.1s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span
                      style={{
                        width: "1.75rem",
                        height: "1.75rem",
                        borderRadius: "4px",
                        background: isSelected ? "#ffffff" : "#fafaf7",
                        border: "1px solid #e6e5e0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8125rem",
                        color: "#26251e",
                      }}
                    >
                      {item.icon}
                    </span>
                    <div>
                      <span
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: isSelected ? 500 : 400,
                          color: "#26251e",
                          display: "block",
                        }}
                      >
                        {item.label}
                      </span>
                      {item.detail && (
                        <span style={{ fontSize: "0.75rem", color: "#807d72" }}>
                          {item.detail}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.shortcut && (
                    <kbd
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.6875rem",
                        background: isSelected ? "#ffffff" : "#fafaf7",
                        border: "1px solid #cfcdc4",
                        borderRadius: "4px",
                        padding: "0.1rem 0.35rem",
                        color: "#807d72",
                      }}
                    >
                      {item.shortcut}
                    </kbd>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.5rem 1rem",
            background: "#fafaf7",
            borderTop: "1px solid #efeee8",
            fontSize: "0.6875rem",
            color: "#807d72",
            fontFamily: "var(--font-mono)",
          }}
        >
          <span>Navigate with ↑ ↓ · Press Enter to select</span>
          <span>RealityChecker IDE</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;

