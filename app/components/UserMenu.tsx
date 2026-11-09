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
    <div style={{ position: "relative" }} ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        type="button"
        title={email}
        style={{
          width: "2.125rem",
          height: "2.125rem",
          borderRadius: "9999px",
          background: "#26251e",
          color: "#f7f7f4",
          fontWeight: 600,
          fontSize: "0.8125rem",
          border: "1px solid #26251e",
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
            background: "#ffffff",
            border: "1px solid #e6e5e0",
            borderRadius: "8px",
            padding: "0.875rem",
            minWidth: "200px",
            zIndex: 100,
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "#807d72",
              marginBottom: "0.5rem",
              fontFamily: "JetBrains Mono, monospace",
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
              borderTop: "1px solid #efeee8",
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
              color: "#cf2d56",
              textAlign: "left",
              padding: "0.375rem 0.5rem",
              borderRadius: "6px",
              fontSize: "0.8125rem",
              cursor: "pointer",
              transition: "background 0.15s",
              fontFamily: "inherit",
              fontWeight: 500,
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#fafaf7")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
