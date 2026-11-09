import { Link } from "react-router";
import ScoreCircle from "~/components/ScoreCircle";
import { useEffect, useState } from "react";
import { useStore } from "~/lib/store";
import { formatDate } from "~/lib/utils";

interface ResumeCardProps {
    resume: Resume;
    selected?: boolean;
    onToggleSelect?: (e: React.MouseEvent) => void;
}

const ResumeCard = ({ resume: { id, companyName, jobTitle, feedback, imagePath, createdAt }, selected, onToggleSelect }: ResumeCardProps) => {
    const { storage } = useStore();
    const [resumeUrl, setResumeUrl] = useState('');
    const [hasRefetched, setHasRefetched] = useState(false);

    useEffect(() => {
        if (!imagePath) return;
        storage.getSignedUrl('resume-images', imagePath, 3600)
            .then(url => setResumeUrl(url))
            .catch(() => {});
    }, [imagePath, storage]);

    const handleImageError = () => {
        if (hasRefetched || !imagePath) return;
        setHasRefetched(true);
        storage.getSignedUrl('resume-images', imagePath, 3600)
            .then(url => setResumeUrl(url))
            .catch(() => {});
    };

    const score = feedback?.overallScore ?? 0;
    const scoreBgClass = score >= 70 ? 'score-badge-green' : score >= 50 ? 'score-badge-yellow' : 'score-badge-red';

    return (
        <Link to={`/resume/${id}`} className="resume-card" style={{ outline: selected ? '2px solid #6366f1' : 'none' }}>
            {onToggleSelect && (
                <div
                    onClick={onToggleSelect}
                    title={selected ? "Deselect" : "Select for comparison"}
                    style={{
                        position: 'absolute',
                        top: '0.875rem',
                        left: '0.875rem',
                        width: '1.25rem',
                        height: '1.25rem',
                        borderRadius: '0.25rem',
                        border: selected ? '1px solid #6366f1' : '1px solid #3a3a5c',
                        background: selected ? '#6366f1' : '#11111f',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        zIndex: 10,
                    }}
                >
                    {selected ? '✓' : ''}
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', paddingLeft: onToggleSelect ? '1.5rem' : 0 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '1rem', color: '#c8d0e7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {companyName || 'Resume'}
                    </p>
                    {jobTitle && (
                        <p style={{ fontSize: '0.8375rem', color: '#4a5568', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {jobTitle}
                        </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.625rem', flexWrap: 'wrap' }}>
                        <div className={`score-badge ${scoreBgClass}`}>
                            Score: {score}/100
                        </div>
                        {createdAt && (
                            <span style={{ fontSize: '0.75rem', color: '#4a5568' }}>
                                {formatDate(createdAt)}
                            </span>
                        )}
                    </div>
                </div>
                <ScoreCircle score={score} />
            </div>

            {/* Divider */}
            <hr className="section-divider" />

            {/* Resume preview */}
            {resumeUrl ? (
                <div style={{
                    flex: 1, borderRadius: '0.75rem', overflow: 'hidden',
                    border: '1px solid #1e1e35', background: '#0e0e1e',
                }}>
                    <img
                        src={resumeUrl}
                        alt="resume preview"
                        onError={handleImageError}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
                    />
                </div>
            ) : (
                <div style={{
                    flex: 1, borderRadius: '0.75rem', background: '#0e0e1e',
                    border: '1.5px dashed #2a2a45', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2a2a45" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span style={{ fontSize: '0.8rem', color: '#3a3a5c' }}>Loading preview…</span>
                </div>
            )}
        </Link>
    );
};

export default ResumeCard;
