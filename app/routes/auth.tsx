import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from '~/lib/store';

export const meta = () => ([
    { title: 'RealityChecker — Sign In' },
    { name: 'description', content: 'Sign in to analyze your resume with AI' },
]);

type AuthMode = 'signin' | 'signup';

const Auth = () => {
    const { isLoading, isAuthenticated, auth } = useStore();
    const navigate = useNavigate();

    const [mode, setMode] = useState<AuthMode>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!isLoading && isAuthenticated) navigate('/');
    }, [isLoading, isAuthenticated]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setSuccess(''); setSubmitting(true);
        try {
            if (mode === 'signin') {
                const err = await auth.signInWithEmail(email, password);
                if (err) setError(err);
            } else {
                const err = await auth.signUpWithEmail(email, password);
                if (err) setError(err);
                else setSuccess('Account created! Check your email to confirm, then sign in.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{
                background: '#11111f', border: '1px solid #2a2a45', borderRadius: '1.5rem',
                padding: '2.5rem 2.5rem 2rem', maxWidth: '420px', width: '100%', textAlign: 'center',
                boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.06)',
            }}>
                {/* Brand */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{
                        width: '3rem', height: '3rem', borderRadius: '0.875rem',
                        background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10 9 9 9 8 9"/>
                        </svg>
                    </div>
                    <p style={{
                        fontSize: '1.35rem', fontWeight: 800,
                        background: 'linear-gradient(135deg, #dde4ff, #a78bfa)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem',
                    }}>RealityChecker</p>
                    <p style={{ fontSize: '0.875rem', color: '#4a5568', lineHeight: 1.5 }}>
                        {mode === 'signin' ? 'Sign in to analyze and track your resumes' : 'Create a free account to get started'}
                    </p>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #1e1e35', marginBottom: '1.5rem' }} />

                {/* Google */}
                <button
                    className="auth-button"
                    style={{ width: '100%', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem' }}
                    onClick={() => auth.signInWithGoogle()}
                    disabled={submitting}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                </button>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #1e1e35' }} />
                    <span style={{ fontSize: '0.75rem', color: '#3a3a5c' }}>or</span>
                    <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #1e1e35' }} />
                </div>

                {/* Email form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input
                        type="email" placeholder="Email address" value={email} required
                        onChange={e => setEmail(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                    <input
                        type="password" placeholder="Password" value={password} required minLength={6}
                        onChange={e => setPassword(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                    />

                    {error && <p style={{ color: '#fca5a5', fontSize: '0.8125rem', textAlign: 'left' }}>{error}</p>}
                    {success && <p style={{ color: '#6ee7b7', fontSize: '0.8125rem', textAlign: 'left' }}>{success}</p>}

                    <button type="submit" className="primary-button full" disabled={submitting} style={{ marginTop: '0.25rem' }}>
                        {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                {/* Toggle */}
                <p style={{ marginTop: '1.25rem', fontSize: '0.8125rem', color: '#4a5568' }}>
                    {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                    <button
                        onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess(''); }}
                        style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontWeight: 600, padding: 0, fontFamily: 'inherit', fontSize: 'inherit' }}
                    >
                        {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                    </button>
                </p>
            </div>
        </main>
    );
};

export default Auth;
