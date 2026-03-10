import { useState, useCallback } from 'react';
import Navbar from '~/components/Navbar';
import FileUploader from '~/components/FileUploader';
import Toast, { useToast } from '~/components/Toast';
import { useStore } from '~/lib/store';
import { useNavigate } from 'react-router';
import { convertPdfToImage, extractTextFromPdf } from '~/lib/pdf2img';
import { generateUUID } from '~/lib/utils';

export const meta = () => ([
    { title: 'RealityChecker — Analyze Resume' },
    { name: 'description', content: 'Upload your resume and get instant AI-powered feedback' },
]);

type AnalysisStatus = 'idle' | 'processing' | 'error';

const STEPS = [
    { id: 1, label: 'Reading resume text' },
    { id: 2, label: 'Generating preview' },
    { id: 3, label: 'Uploading files' },
    { id: 4, label: 'AI analysis' },
    { id: 5, label: 'Saving results' },
];

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
        promise.then(v => { clearTimeout(timer); resolve(v); }, e => { clearTimeout(timer); reject(e); });
    });
}

const Upload = () => {
    const { storage, resumes: resumeStore } = useStore();
    const navigate = useNavigate();
    const { toasts, addToast, removeToast } = useToast();

    const [status, setStatus] = useState<AnalysisStatus>('idle');
    const [currentStep, setCurrentStep] = useState(0);
    const [doneSteps, setDoneSteps] = useState<number[]>([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState('');

    const [companyName, setCompanyName] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [jobDescription, setJobDescription] = useState('');

    const handleFileSelect = useCallback((selectedFile: File | null) => {
        setFile(selectedFile);
        if (selectedFile) setFileError('');
    }, []);

    const markStep = (step: number) => {
        setCurrentStep(step);
        setDoneSteps(prev => [...prev, step - 1].filter(s => s > 0));
    };

    const reset = () => {
        setStatus('idle'); setCurrentStep(0); setDoneSteps([]); setErrorMessage('');
    };

    const handleAnalyze = async () => {
        if (!file) { setFileError('Please upload a resume PDF file first.'); return; }
        setStatus('processing'); setErrorMessage(''); setFileError(''); setCurrentStep(1); setDoneSteps([]);

        const fail = (msg: string) => { setErrorMessage(msg); setStatus('error'); addToast(msg, 'error'); };

        try {
            // ── Step 1: Extract text ─────────────────────────────────
            markStep(1);
            let resumeText = '';
            try {
                resumeText = await withTimeout(extractTextFromPdf(file), 30_000, 'Text extraction');
            } catch (e) { console.warn('Text extraction failed:', e); }
            if (!resumeText || resumeText.trim().length < 50) {
                return fail('Could not read text from this PDF. Please ensure it is a text-based PDF (not a scanned image).');
            }

            // ── Step 2: Convert to image ─────────────────────────────
            markStep(2);
            let imageFile: File | null = null;
            try {
                const result = await withTimeout(convertPdfToImage(file), 30_000, 'PDF preview');
                imageFile = result.file;
            } catch (e) { console.warn('Image conversion failed (non-fatal):', e); }

            // ── Step 3: Upload files to Supabase Storage ─────────────
            markStep(3);
            const uuid = generateUUID();
            const resumePath = await withTimeout(
                storage.uploadFile('resume-files', file, `${uuid}/${file.name}`),
                60_000, 'File upload'
            );

            let imagePath = '';
            if (imageFile) {
                try {
                    imagePath = await withTimeout(
                        storage.uploadFile('resume-images', imageFile, `${uuid}/preview.png`),
                        30_000, 'Image upload'
                    );
                } catch (e) { console.warn('Image upload failed (non-fatal):', e); }
            }

            // ── Step 4: AI analysis via Groq edge function ────────────
            markStep(4);
            const analysisRes = await withTimeout(
                fetch('/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        resumeText: resumeText.substring(0, 6000),
                        jobTitle: jobTitle.trim() || undefined,
                        jobDescription: jobDescription.trim() || undefined,
                    }),
                }),
                180_000, 'AI analysis'
            );

            if (!analysisRes.ok) {
                const errData = await analysisRes.json().catch(() => ({}));
                return fail((errData as any).error ?? 'AI analysis failed. Please try again.');
            }

            const { feedback } = await analysisRes.json();
            if (!feedback) return fail('AI returned no feedback. Please try again.');

            // ── Step 5: Save to Supabase ──────────────────────────────
            markStep(5);
            const saved = await withTimeout(
                resumeStore.create({
                    companyName: companyName.trim(),
                    jobTitle: jobTitle.trim(),
                    jobDescription: jobDescription.trim(),
                    resumePath,
                    imagePath,
                    feedback,
                }),
                30_000, 'Save'
            );
            setDoneSteps([1, 2, 3, 4, 5]);
            addToast('Analysis complete!', 'success');
            setTimeout(() => navigate(`/resume/${saved.id}`), 600);

        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error('Analysis pipeline error:', err);
            fail(`Something went wrong: ${msg}`);
        }
    };

    return (
        <main>
            <Navbar />
            <Toast toasts={toasts} onRemove={removeToast} />

            <section className="main-section">
                <div className="page-heading" style={{ paddingTop: '2rem' }}>
                    <h1>Smart feedback for<br />your dream job</h1>

                    {/* ── Processing ── */}
                    {status === 'processing' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginTop: '1.5rem', width: '100%' }}>
                            <p style={{ color: '#64748b', fontSize: '0.9375rem' }}>
                                Analyzing your resume with AI — please wait…
                            </p>
                            <div className="progress-steps">
                                {STEPS.map(step => {
                                    const isDone = doneSteps.includes(step.id);
                                    const isActive = currentStep === step.id && !isDone;
                                    const cls = isDone ? 'done' : isActive ? 'active' : '';
                                    return (
                                        <div key={step.id} className={`progress-step ${cls}`}>
                                            <div className={`step-icon ${cls}`}>{isDone ? '✓' : step.id}</div>
                                            <span className={`step-label ${cls || 'idle'}`}>{step.label}</span>
                                            {isActive && (
                                                <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                                                    <div style={{
                                                        width: '16px', height: '16px', border: '2px solid #2a2a45',
                                                        borderTopColor: '#6366f1', borderRadius: '9999px',
                                                        animation: 'spin 0.9s linear infinite',
                                                    }} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <p style={{ color: '#3a3a5c', fontSize: '0.8rem', maxWidth: '380px', textAlign: 'center' }}>
                                AI analysis can take 5–30 seconds. Please keep this tab open.
                            </p>
                        </div>
                    )}

                    {/* ── Error ── */}
                    {status === 'error' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', marginTop: '1.5rem', width: '100%', maxWidth: '440px' }}>
                            <div style={{
                                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                                borderRadius: '1rem', padding: '1.5rem', width: '100%', textAlign: 'center',
                            }}>
                                <div style={{
                                    width: '2.5rem', height: '2.5rem', borderRadius: '9999px',
                                    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 0.875rem', fontSize: '1rem', color: '#fca5a5',
                                }}>✕</div>
                                <p style={{ color: '#fca5a5', fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.5rem' }}>Analysis Failed</p>
                                <p style={{ color: '#f87171', fontSize: '0.875rem', lineHeight: 1.5 }}>{errorMessage}</p>
                            </div>
                            <button className="primary-button" onClick={reset}>Try Again</button>
                        </div>
                    )}

                    {/* ── Idle ── */}
                    {status === 'idle' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', marginTop: '1rem', width: '100%', maxWidth: '520px' }}>
                            <p style={{ color: '#4a5568', fontSize: '1rem', lineHeight: 1.6 }}>
                                Upload your resume and get an instant ATS score with actionable AI feedback
                            </p>

                            <div style={{ width: '100%' }}>
                                <FileUploader onFileSelect={handleFileSelect} />
                                {fileError && (
                                    <p style={{ color: '#fca5a5', fontSize: '0.8125rem', marginTop: '0.5rem', textAlign: 'center' }}>
                                        {fileError}
                                    </p>
                                )}
                            </div>

                            {/* Job details */}
                            <div style={{ width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
                                    <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #1e1e35' }} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#3a3a5c', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                                        Job Details <span style={{ color: '#2a2a45' }}>(optional)</span>
                                    </span>
                                    <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #1e1e35' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <input type="text" placeholder="Company name" value={companyName}
                                            onChange={e => setCompanyName(e.target.value)} style={{ flex: 1 }} />
                                        <input type="text" placeholder="Job title" value={jobTitle}
                                            onChange={e => setJobTitle(e.target.value)} style={{ flex: 1 }} />
                                    </div>
                                    <textarea
                                        placeholder="Paste the job description here for role-specific AI feedback…"
                                        value={jobDescription} onChange={e => setJobDescription(e.target.value)}
                                        rows={4} style={{ width: '100%', resize: 'vertical', lineHeight: 1.55 }}
                                    />
                                </div>
                                {jobTitle && jobDescription && (
                                    <p style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                        <span>✓</span> AI will tailor feedback for the {jobTitle.trim()} role
                                    </p>
                                )}
                            </div>

                            <button className="primary-button full" onClick={handleAnalyze} style={{ maxWidth: '520px' }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                </svg>
                                Analyze My Resume
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
};

export default Upload;
