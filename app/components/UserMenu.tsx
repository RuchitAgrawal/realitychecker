import React, { useState, useRef, useEffect } from "react";
import { useStore } from "~/lib/store";
import { useNavigate } from "react-router";

const UserMenu: React.FC = () => {
  const { user, auth, isAuthenticated } = useStore();
  const [open, setOpen] = useState(false);
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
  const initial = email[0]?.toUpperCase() || "U";

  const handleSignOut = async () => {
    setOpen(false);
    await auth.signOut();
    navigate("/auth");
  };

  return (
    <div style={{ position: "relative" }} ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        type="button"
        title={email}
        style={{
          width: "2.125rem",
          height: "2.125rem",
          borderRadius: "9999px",
          background: "linear-gradient(135deg, #6366f1, #a855f7)",
          color: "#ffffff",
          fontWeight: 700,
          fontSize: "0.875rem",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        {initial}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 0.5rem)",
            right: 0,
            background: "#11111f",
            border: "1px solid #2a2a45",
            borderRadius: "0.75rem",
            padding: "0.75rem",
            minWidth: "180px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
            zIndex: 100,
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "#94a3b8",
              marginBottom: "0.5rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {email}
          </div>
          <hr
            style={{
              border: "none",
              borderTop: "1px solid #1e1e35",
              marginBottom: "0.5rem",
            }}
          />
          <button
            onClick={handleSignOut}
            type="button"
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              color: "#fca5a5",
              textAlign: "left",
              padding: "0.375rem 0.5rem",
              borderRadius: "0.375rem",
              fontSize: "0.8125rem",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
