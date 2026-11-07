import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import Spinner from "~/components/Spinner";
import Toast, { useToast } from "~/components/Toast";
import { useStore } from "~/lib/store";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "RealityChecker — Smart Resume Feedback" },
    { name: "description", content: "AI-powered resume analysis and ATS scoring." },
  ];
}

type SortOption = 'newest' | 'oldest' | 'score-high' | 'score-low';

export default function Home() {
  const { isLoading, isAuthenticated, resumes: resumeStore } = useStore();
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const queryClient = useQueryClient();

  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/auth');
  }, [isLoading, isAuthenticated, navigate]);

  const { data: resumes = [], isLoading: loadingResumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumeStore.list(),
    enabled: isAuthenticated,
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDeletingId(id);
    try {
      await resumeStore.delete(id);
      queryClient.setQueryData<Resume[]>(['resumes'], (old = []) => old.filter(r => r.id !== id));
      addToast('Resume deleted', 'success');
    } catch {
      addToast('Failed to delete resume', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const sorted = [...resumes].sort((a, b) => {
    if (sortBy === 'newest')     return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    if (sortBy === 'oldest')     return (a.createdAt ?? 0) - (b.createdAt ?? 0);
    if (sortBy === 'score-high') return (b.feedback?.overallScore ?? 0) - (a.feedback?.overallScore ?? 0);
    if (sortBy === 'score-low')  return (a.feedback?.overallScore ?? 0) - (b.feedback?.overallScore ?? 0);
    return 0;
  });

  return (
    <main>
      <Navbar />
      <Toast toasts={toasts} onRemove={removeToast} />

      <section className="main-section">
        <div className="page-heading">
          <h1>Your Resume Dashboard</h1>
          <p className="page-subheading">
            {!loadingResumes && resumes.length === 0
              ? 'No analyses yet — upload your first resume to get started'
              : 'Review your AI-powered feedback and track improvement'}
          </p>
        </div>

        {!loadingResumes && resumes.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', alignSelf: 'flex-end', paddingRight: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: '#4a5568' }}>Sort by</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="select-dropdown"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="score-high">Highest score</option>
              <option value="score-low">Lowest score</option>
            </select>
          </div>
        )}

        {loadingResumes && <Spinner label="Loading your resumes…" size={40} />}

        {!loadingResumes && sorted.length > 0 && (
          <div className="resumes-section">
            {sorted.map(resume => (
              <div key={resume.id} style={{ position: 'relative' }}>
                <ResumeCard resume={resume} />
                <button
                  onClick={e => handleDelete(resume.id, e)}
                  disabled={deletingId === resume.id}
                  title="Delete this resume"
                  className="btn-delete-card"
                >
                  {deletingId === resume.id ? '…' : '✕'}
                </button>
              </div>
            ))}
          </div>
        )}

        {!loadingResumes && resumes.length === 0 && (
          <div className="empty-state" style={{ maxWidth: '420px' }}>
            <div style={{
              width: '4rem', height: '4rem', borderRadius: '1.25rem',
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div>
              <p style={{ fontWeight: 600, color: '#c8d0e7', marginBottom: '0.375rem' }}>No resumes yet</p>
              <p style={{ color: '#4a5568', fontSize: '0.875rem' }}>Upload your resume and get instant AI feedback</p>
            </div>
            <Link to="/upload" className="primary-button" style={{ marginTop: '0.5rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Upload Your First Resume
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
