import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useStore } from '~/lib/store';
import Navbar from '~/components/Navbar';
import ScoreGauge from '~/components/ScoreGauge';

export const meta = () => ([
    { title: 'RealityChecker | Compare Resumes' },
    { name: 'description', content: 'Compare two resumes side-by-side' },
]);

const CATEGORIES = [
    { key: 'overallScore', label: 'Overall Score', isTop: true },
    { key: 'ATS',          label: 'ATS Score' },
    { key: 'toneAndStyle', label: 'Tone & Style' },
    { key: 'content',      label: 'Content' },
    { key: 'structure',    label: 'Structure' },
    { key: 'skills',       label: 'Skills' },
] as const;

const getScore = (resume: Resume | null, key: string): number => {
    if (!resume?.feedback) return 0;
    if (key === 'overallScore') return resume.feedback.overallScore ?? 0;
    return (resume.feedback as any)[key]?.score ?? 0;
};

const ScoreBar = ({ score, win }: { score: number; win: boolean }) => {
    const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: win ? '#6ee7b7' : '#c8d0e7' }}>
                    {score}
                    {win && <span style={{ fontSize: '0.7rem', marginLeft: '0.3rem', color: '#10b981' }}>▲</span>}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#3a3a5c' }}>/100</span>
            </div>
            <div style={{ height: '6px', background: '#1e1e35', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', borderRadius: '9999px', width: `${score}%`,
                    background: win ? color : `${color}77`, transition: 'width 0.7s ease',
                }} />
            </div>
        </div>
    );
};

const ResumeSelector = ({ label, value, onChange, resumes }: {
    label: string; value: string; onChange: (id: string) => void; resumes: Resume[];
}) => (
    <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
            {label}
        </p>
        <select
            value={value} onChange={e => onChange(e.target.value)}
            style={{
                width: '100%', background: '#11111f', border: '1px solid #2a2a45',
                color: '#c8d0e7', borderRadius: '0.75rem', padding: '0.625rem 0.875rem',
                fontSize: '0.875rem', cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
            }}
        >
            <option value="">— Select a resume —</option>
            {resumes.map(r => (
                <option key={r.id} value={r.id}>
                    {r.companyName || 'Resume'}{r.jobTitle ? ` · ${r.jobTitle}` : ''} ({r.feedback?.overallScore ?? 0}/100)
                </option>
            ))}
        </select>
    </div>
);

const Compare = () => {
    const { isLoading, isAuthenticated, storage, resumes: resumeStore } = useStore();
    const navigate = useNavigate();

    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loading, setLoading] = useState(false);
    const [idA, setIdA] = useState('');
    const [idB, setIdB] = useState('');
    const [imgA, setImgA] = useState('');
    const [imgB, setImgB] = useState('');

    useEffect(() => {
        if (!isLoading && !isAuthenticated) navigate('/auth');
    }, [isLoading, isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) return;
        const load = async () => {
            setLoading(true);
            try {
                const items = await resumeStore.list();
                setResumes(items);
            } catch { /* ignore */ }
            setLoading(false);
        };
        load();
    }, [isAuthenticated]);

    // Load preview images from Supabase Storage signed URLs
    useEffect(() => {
        setImgA('');
        if (!idA) return;
        const r = resumes.find(r => r.id === idA);
        if (!r?.imagePath) return;
        storage.getSignedUrl('resume-images', r.imagePath, 3600)
            .then(url => setImgA(url)).catch(() => {});
    }, [idA, resumes]);

    useEffect(() => {
        setImgB('');
        if (!idB) return;
        const r = resumes.find(r => r.id === idB);
        if (!r?.imagePath) return;
        storage.getSignedUrl('resume-images', r.imagePath, 3600)
            .then(url => setImgB(url)).catch(() => {});
    }, [idB, resumes]);

    const resumeA = resumes.find(r => r.id === idA) ?? null;
    const resumeB = resumes.find(r => r.id === idB) ?? null;
    const ready = resumeA && resumeB && idA !== idB;

    return (
        <main>
            <Navbar />
            <section className="main-section">
                <div className="page-heading" style={{ paddingTop: '1.5rem' }}>
                    <h1>Compare Resumes</h1>
                    <p className="page-subheading">Select two resumes to see a side-by-side score breakdown</p>
                </div>

                {loading && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                        <div style={{ width: '36px', height: '36px', border: '3px solid #2a2a45', borderTopColor: '#6366f1', borderRadius: '9999px', animation: 'spin 0.9s linear infinite' }} />
                    </div>
                )}

                {!loading && resumes.length < 2 && (
                    <div className="empty-state" style={{ maxWidth: '420px' }}>
                        <div style={{ fontSize: '2.5rem' }}>📄</div>
                        <div>
                            <p style={{ fontWeight: 600, color: '#c8d0e7', marginBottom: '0.375rem' }}>Not enough resumes</p>
                            <p style={{ color: '#4a5568', fontSize: '0.875rem' }}>You need at least 2 analyzed resumes to compare.</p>
                        </div>
                        <Link to="/upload" className="primary-button">Analyze a Resume</Link>
                    </div>
                )}

                {!loading && resumes.length >= 2 && (
                    <div style={{ width: '100%', maxWidth: '960px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Selectors */}
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <ResumeSelector label="Resume A" value={idA} onChange={setIdA} resumes={resumes} />
                            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.625rem', color: '#2a2a45', fontWeight: 700, fontSize: '1.1rem' }}>vs</div>
                            <ResumeSelector label="Resume B" value={idB} onChange={v => { if (v !== idA) setIdB(v); }} resumes={resumes} />
                        </div>

                        {idA && idB && idA === idB && (
                            <p style={{ color: '#f59e0b', fontSize: '0.875rem', textAlign: 'center' }}>Please select two different resumes.</p>
                        )}

                        {ready && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', animation: 'fadeIn 0.4s ease' }}>
                                {/* Thumbnail row */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'start' }}>
                                    {/* Card A */}
                                    <div style={{ background: '#11111f', border: '1px solid #2a2a45', borderRadius: '1rem', overflow: 'hidden' }}>
                                        <div style={{ padding: '1rem', borderBottom: '1px solid #1e1e35' }}>
                                            <p style={{ fontWeight: 700, color: '#c8d0e7', fontSize: '0.9375rem' }}>{resumeA.companyName || 'Resume A'}</p>
                                            {resumeA.jobTitle && <p style={{ fontSize: '0.8rem', color: '#4a5568', marginTop: '0.125rem' }}>{resumeA.jobTitle}</p>}
                                        </div>
                                        {imgA && <img src={imgA} alt="Resume A" style={{ width: '100%', height: '180px', objectFit: 'cover', objectPosition: 'top' }} />}
                                        <div style={{ padding: '0.875rem', display: 'flex', justifyContent: 'center' }}>
                                            <ScoreGauge score={resumeA.feedback?.overallScore ?? 0} />
                                        </div>
                                    </div>

                                    {/* vs */}
                                    <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '1rem 0', paddingTop: '5rem' }}>
                                        <span style={{ color: '#2a2a45', fontWeight: 800, fontSize: '1.25rem' }}>VS</span>
                                    </div>

                                    {/* Card B */}
                                    <div style={{ background: '#11111f', border: '1px solid #2a2a45', borderRadius: '1rem', overflow: 'hidden' }}>
                                        <div style={{ padding: '1rem', borderBottom: '1px solid #1e1e35' }}>
                                            <p style={{ fontWeight: 700, color: '#c8d0e7', fontSize: '0.9375rem' }}>{resumeB.companyName || 'Resume B'}</p>
                                            {resumeB.jobTitle && <p style={{ fontSize: '0.8rem', color: '#4a5568', marginTop: '0.125rem' }}>{resumeB.jobTitle}</p>}
                                        </div>
                                        {imgB && <img src={imgB} alt="Resume B" style={{ width: '100%', height: '180px', objectFit: 'cover', objectPosition: 'top' }} />}
                                        <div style={{ padding: '0.875rem', display: 'flex', justifyContent: 'center' }}>
                                            <ScoreGauge score={resumeB.feedback?.overallScore ?? 0} />
                                        </div>
                                    </div>
                                </div>

                                {/* Score rows */}
                                <div style={{ background: '#11111f', border: '1px solid #2a2a45', borderRadius: '1rem', overflow: 'hidden' }}>
                                    {CATEGORIES.filter(c => c.key !== 'overallScore').map((cat, i) => {
                                        const sA = getScore(resumeA, cat.key);
                                        const sB = getScore(resumeB, cat.key);
                                        return (
                                            <div key={cat.key} style={{
                                                display: 'grid', gridTemplateColumns: '1fr auto 1fr',
                                                gap: '1rem', alignItems: 'center',
                                                padding: '0.875rem 1.25rem',
                                                borderTop: i > 0 ? '1px solid #1e1e35' : 'none',
                                            }}>
                                                <ScoreBar score={sA} win={sA > sB} />
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#3a3a5c', textAlign: 'center', whiteSpace: 'nowrap', minWidth: '80px' }}>
                                                    {cat.label}
                                                </span>
                                                <ScoreBar score={sB} win={sB > sA} />
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Winner banner */}
                                {(() => {
                                    const sA = getScore(resumeA, 'overallScore');
                                    const sB = getScore(resumeB, 'overallScore');
                                    if (sA === sB) return null;
                                    const winner = sA > sB ? resumeA : resumeB;
                                    return (
                                        <div style={{
                                            background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)',
                                            borderRadius: '0.875rem', padding: '0.875rem 1.25rem',
                                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        }}>
                                            <span style={{ fontSize: '1.25rem' }}>🏆</span>
                                            <p style={{ fontSize: '0.9rem', color: '#6ee7b7' }}>
                                                <strong>{winner.companyName || (sA > sB ? 'Resume A' : 'Resume B')}</strong>
                                                {winner.jobTitle ? ` (${winner.jobTitle})` : ''} has the stronger overall score — <strong>{Math.max(sA, sB)}/100</strong>
                                            </p>
                                        </div>
                                    );
                                })()}

                                {/* View links */}
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                    <Link to={`/resume/${idA}`} className="back-button">View Resume A →</Link>
                                    <Link to={`/resume/${idB}`} className="back-button">View Resume B →</Link>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </section>
        </main>
    );
};

export default Compare;
