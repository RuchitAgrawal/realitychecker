import React from 'react';

interface Suggestion {
  type: "good" | "improve";
  tip: string;
}

interface ATSProps {
  score: number;
  suggestions: Suggestion[];
}

const getAtsColor = (score: number) =>
    score > 69 ? { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', text: '#6ee7b7', icon: '✓' }
    : score > 49 ? { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#fcd34d', icon: '◈' }
    : { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#fca5a5', icon: '!' };

const getSubtitle = (score: number) =>
    score > 69 ? 'Excellent ATS compatibility' : score > 49 ? 'Good — a few improvements needed' : 'Needs significant improvement';

const ATS: React.FC<ATSProps> = ({ score, suggestions }) => {
  const color = getAtsColor(score);

  return (
    <div className="ats-card">
      <div className="ats-header">
        {/* Icon indicator */}
        <div className="ats-icon-wrap" style={{ background: color.bg, border: `1px solid ${color.border}` }}>
          <span style={{ fontSize: '1.1rem', color: color.text, fontWeight: 700 }}>{color.icon}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: '#c8d0e7' }}>ATS Score</p>
            <div className="ats-score-badge" style={{ background: color.bg, border: `1px solid ${color.border}`, color: color.text }}>
              {score}/100
            </div>
          </div>
          <p style={{ fontSize: '0.8375rem', color: '#4a5568', marginTop: '0.25rem' }}>{getSubtitle(score)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '6px', background: '#1e1e35', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1.25rem' }}>
        <div style={{
          height: '100%',
          width: `${score}%`,
          background: score > 69 ? '#10b981' : score > 49 ? '#f59e0b' : '#ef4444',
          borderRadius: '9999px',
          transition: 'width 0.8s ease',
        }} />
      </div>

      {/* Tips */}
      {suggestions.length > 0 && (
        <div className="ats-tip-list">
          {suggestions.map((s, i) => (
            <div key={i} className={`ats-tip-item ${s.type === 'good' ? 'ats-tip-good' : 'ats-tip-improve'}`}>
              <span style={{ flexShrink: 0, fontSize: '0.8rem', fontWeight: 700 }}>
                {s.type === 'good' ? '✓' : '▲'}
              </span>
              <span>{s.tip}</span>
            </div>
          ))}
        </div>
      )}

      <p style={{ marginTop: '1rem', fontSize: '0.8125rem', color: '#3a3a5c', fontStyle: 'italic' }}>
        Keep refining your resume to improve your chances of passing ATS filters.
      </p>
    </div>
  );
};

export default ATS;
