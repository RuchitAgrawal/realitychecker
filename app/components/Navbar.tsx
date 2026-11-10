import { Link, useLocation } from "react-router";
import UserMenu from "./UserMenu";
import CommandPalette from "./CommandPalette";

interface NavbarProps {
  showBack?: boolean;
}

const Navbar = ({ showBack = false }: NavbarProps) => {
  const location = useLocation();
  const isUpload = location.pathname === "/upload";
  const isHome = location.pathname === "/";
  const isCompare = location.pathname === "/compare";

  return (
    <div className="navbar-wrap">
      <nav className="navbar">
        <Link to="/" className="navbar-brand">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f54e00"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <span>RealityChecker</span>
          <span className="navbar-version-badge">CORE</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          {/* Home page nav actions */}
          {isHome && (
            <>
              <Link to="/compare" className="navbar-action-btn">
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
                  <rect x="3" y="3" width="7" height="18" />
                  <rect x="14" y="3" width="7" height="18" />
                </svg>
                Compare
              </Link>
              <Link to="/upload" className="navbar-action-primary">
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
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Analyze Resume
              </Link>
            </>
          )}

          {/* Compare page */}
          {isCompare && (
            <Link to="/" className="navbar-action-btn">
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
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Dashboard
            </Link>
          )}

          {/* Upload page — back button */}
          {isUpload && (
            <Link to="/" className="navbar-action-btn">
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
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Dashboard
            </Link>
          )}

          <CommandPalette />
          <UserMenu />
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
