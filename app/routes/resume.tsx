import { Link, useNavigate, useParams } from 'react-router';
import { useEffect, useState } from 'react';
import { useStore } from '~/lib/store';
import Summary from '~/components/Summary';
import ATS from '~/components/ATS';
import Details from '~/components/Details';
import Spinner from '~/components/Spinner';
import Toast, { useToast } from '~/components/Toast';

export const meta = () => ([
    { title: 'RealityChecker | Review' },
    { name: 'description', content: 'Detailed AI feedback for your resume' },
]);

const ResumeDetail = () => {
    const { isLoading, isAuthenticated, storage, resumes: resumeStore } = useStore();
    const { id } = useParams();
    const navigate = useNavigate();
    const { toasts, addToast, removeToast } = useToast();

    const [imageUrl, setImageUrl] = useState('');
    const [resumeUrl, setResumeUrl] = useState('');
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [companyName, setCompanyName] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [sharing, setSharing] = useState(false);

    useEffect(() => {
        if (!id || isLoading) return;
        const loadResume = async () => {
            const resume = await resumeStore.get(id);
            if (!resume) {
                if (!isAuthenticated) navigate('/auth');
                else navigate('/');
                return;
            }

            setCompanyName(resume.companyName ?? '');
            setJobTitle(resume.jobTitle ?? '');
            setFeedback(resume.feedback ?? null);
            setIsPublic(Boolean(resume.isPublic));

            if (resume.resumePath) {
                try {
                    const url = await storage.getSignedUrl('resume-files', resume.resumePath, 3600);
                    setResumeUrl(url);
                } catch { /* non-fatal */ }
            }
            if (resume.imagePath) {
                try {
                    const url = await storage.getSignedUrl('resume-images', resume.imagePath, 3600);
                    setImageUrl(url);
                } catch { /* non-fatal */ }
            }
        };
        loadResume();
    }, [id, isLoading, isAuthenticated, navigate]);

    const handleExportPDF = () => window.print();

    const handleShare = async () => {
        if (!id) return;
        setSharing(true);
        try {
            const nextState = !isPublic;
            await resumeStore.togglePublic(id, nextState);
            setIsPublic(nextState);
            const shareUrl = `${window.location.origin}/resume/${id}`;
            if (nextState) {
                await navigator.clipboard.writeText(shareUrl).catch(() => {});
                addToast('Public link created and copied to clipboard!', 'success');
            } else {
                addToast('Sharing revoked. Resume is now private.', 'info');
            }
        } catch {
            addToast('Failed to update share status', 'error');
        } finally {
            setSharing(false);
        }
    };

    return (
        <main className="full-layout" style={{ paddingTop: 0 }}>
            <Toast toasts={toasts} onRemove={removeToast} />

            {/* Sticky top nav */}
            <nav className="resume-nav" id="resume-nav-bar">
                <Link to="/" className="back-button">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                    Dashboard
                </Link>

                <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#5a6585', display: 'block' }}>Resume Review</span>
                    {(companyName || jobTitle) && (
                        <span style={{ fontSize: '0.75rem', color: '#3a3a5c' }}>
                            {companyName}{companyName && jobTitle ? ' · ' : ''}{jobTitle}
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
                    {isAuthenticated && (
                        <button onClick={handleShare} disabled={sharing} className="back-button" title={isPublic ? "Public link active — click to revoke" : "Make public and copy link"}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                            </svg>
                            {sharing ? '…' : isPublic ? 'Shared (Public)' : 'Share'}
                        </button>
                    )}

                    <button onClick={handleExportPDF} className="back-button" title="Export as PDF" id="export-pdf-btn">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Export PDF
                    </button>

                    {resumeUrl && (
                        <a href={resumeUrl} target="_blank" rel="noopener noreferrer"
                            className="primary-button" style={{ fontSize: '0.8125rem', padding: '0.45rem 1rem' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                            </svg>
                            Open PDF
                        </a>
                    )}
                </div>
            </nav>

            {!isAuthenticated && (
                <div style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderBottom: '1px solid rgba(99, 102, 241, 0.25)',
                    padding: '0.625rem 1rem',
                    textAlign: 'center',
                    fontSize: '0.8125rem',
                    color: '#c8d0e7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                }}>
                    <span>Viewing shared resume. Want your own AI feedback?</span>
                    <Link to="/auth" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'underline' }}>
                        Create a free account →
                    </Link>
                </div>
            )}

            {/* Body */}
            <div className="resume-layout">
                {/* Left — resume preview */}
                <div className="resume-preview-panel" id="resume-preview-panel">
                    {imageUrl ? (
                        <a href={resumeUrl || '#'} target="_blank" rel="noopener noreferrer"
                            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img
                                src={imageUrl} alt="Resume preview"
                                className="resume-preview-img"
                                style={{ animation: 'fadeIn 0.5s ease' }}
                            />
                        </a>
                    ) : <Spinner />}
                </div>

                {/* Right — feedback */}
                <div className="resume-feedback-panel">
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#c8d0e7', marginBottom: '0.25rem' }}>
                            Resume Analysis
                        </h2>
                        <p style={{ fontSize: '0.875rem', color: '#4a5568' }}>
                            AI-powered feedback across tone, content, structure &amp; ATS compatibility
                        </p>
                    </div>

                    {feedback ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.5s ease' }}>
                            <Summary feedback={feedback} />
                            <ATS score={feedback.ATS?.score ?? 0} suggestions={feedback.ATS?.tips ?? []} />
                            <Details feedback={feedback} />
                        </div>
                    ) : <Spinner />}
                </div>
            </div>
        </main>
    );
};

export default ResumeDetail;
