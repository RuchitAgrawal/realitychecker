import { Link, useLocation } from "react-router";

interface NavbarProps {
    showBack?: boolean;
}

const Navbar = ({ showBack = false }: NavbarProps) => {
    const location = useLocation();
    const isUpload = location.pathname === '/upload';
    const isHome = location.pathname === '/';

    return (
        <div className="navbar-wrap">
            <nav className="navbar">
                <Link to="/" className="navbar-brand">
                    Resume Guide
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Home page nav actions */}
                    {isHome && (
                        <>
                            <Link
                                to="/compare"
                                style={{
                                    fontSize: '0.85rem', fontWeight: 500, color: '#64748b',
                                    textDecoration: 'none', padding: '0.4rem 0.75rem',
                                    borderRadius: '9999px', transition: 'color 0.2s',
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                }}
                                onMouseOver={e => (e.currentTarget.style.color = '#c8d0e7')}
                                onMouseOut={e => (e.currentTarget.style.color = '#64748b')}
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="7" height="18"/><rect x="14" y="3" width="7" height="18"/>
                                </svg>
                                Compare
                            </Link>
                            <Link to="/upload" className="primary-button">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                                </svg>
                                Analyze Resume
                            </Link>
                        </>
                    )}

                    {/* Upload page — just a back button */}
                    {isUpload && (
                        <Link to="/" className="back-button">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"/>
                            </svg>
                            Back to Dashboard
                        </Link>
                    )}

                    {/* Other pages (resume detail, etc.) — nothing extra */}
                </div>
            </nav>
        </div>
    );
};

export default Navbar;
