import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import Spinner from "~/components/Spinner";
import ConfirmModal from "~/components/ConfirmModal";
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
type ScoreFilter = 'all' | 'high' | 'mid' | 'low';

export default function Home() {
  const { isLoading, isAuthenticated, resumes: resumeStore } = useStore();
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const queryClient = useQueryClient();

  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/auth');
  }, [isLoading, isAuthenticated, navigate]);

  const { data: resumes = [], isLoading: loadingResumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumeStore.list(),
    enabled: isAuthenticated,
  });

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 2
          ? [...prev, id]
          : [prev[1] ?? '', id].filter(Boolean)
    );
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const executeDelete = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setDeletingId(id);
    setConfirmDeleteId(null);
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

  const filtered = sorted.filter(r => {
    const score = r.feedback?.overallScore ?? 0;
    if (scoreFilter === 'high' && score < 70) return false;
    if (scoreFilter === 'mid' && (score < 50 || score >= 70)) return false;
    if (scoreFilter === 'low' && score >= 50) return false;

    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const company = (r.companyName || '').toLowerCase();
    const title = (r.jobTitle || '').toLowerCase();
    return company.includes(term) || title.includes(term);
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

        {!loadingResumes && resumes.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', width: '100%', maxWidth: '960px', margin: '0 auto 1.5rem' }}>
            <input
              type="text"
              placeholder="Search by company or role…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                maxWidth: '300px',
                padding: '0.5rem 0.875rem',
                fontSize: '0.8125rem',
                borderRadius: '9999px',
              }}
            />
            {resumes.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <select
                  value={scoreFilter}
                  onChange={e => setScoreFilter(e.target.value as ScoreFilter)}
                  className="select-dropdown"
                  title="Filter by score"
                >
                  <option value="all">All scores</option>
                  <option value="high">Score 70+ (Strong)</option>
                  <option value="mid">Score 50-69 (Average)</option>
                  <option value="low">Score &lt;50 (Needs Work)</option>
                </select>

                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortOption)}
                  className="select-dropdown"
                  title="Sort order"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="score-high">Highest score</option>
                  <option value="score-low">Lowest score</option>
                </select>
              </div>
            )}
          </div>
        )}

        {loadingResumes && <Spinner label="Loading your resumes…" size={40} />}

        {!loadingResumes && filtered.length > 0 && (
          <div className="resumes-section">
            {filtered.map(resume => (
              <div key={resume.id} style={{ position: 'relative' }}>
                <ResumeCard
                  resume={resume}
                  selected={selectedIds.includes(resume.id)}
                  onToggleSelect={e => toggleSelect(resume.id, e)}
                />
                <button
                  onClick={e => handleDeleteClick(resume.id, e)}
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
        {selectedIds.length > 0 && (
          <div style={{
            position: 'fixed',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#11111f',
            border: '1px solid #2a2a45',
            borderRadius: '9999px',
            padding: '0.625rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
            zIndex: 100,
          }}>
            <span style={{ fontSize: '0.85rem', color: '#c8d0e7' }}>
              {selectedIds.length} of 2 selected for comparison
            </span>
            {selectedIds.length === 2 && (
              <button
                onClick={() => navigate(`/compare?a=${selectedIds[0]}&b=${selectedIds[1]}`)}
                className="primary-button"
                style={{ padding: '0.35rem 0.875rem', fontSize: '0.8rem' }}
              >
                Compare Selected →
              </button>
            )}
            <button
              onClick={() => setSelectedIds([])}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Clear
            </button>
          </div>
        )}
        {confirmDeleteId && (
          <ConfirmModal
            title="Delete Resume"
            message="Are you sure you want to delete this resume analysis? This action cannot be undone."
            confirmLabel="Delete Resume"
            onConfirm={executeDelete}
            onCancel={() => setConfirmDeleteId(null)}
          />
        )}
      </section>
    </main>
  );
}
