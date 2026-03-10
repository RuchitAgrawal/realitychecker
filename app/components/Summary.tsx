import ScoreGauge from "~/components/ScoreGauge";

const getScoreClass = (score: number) =>
    score > 69 ? 'score-badge-green' : score > 49 ? 'score-badge-yellow' : 'score-badge-red';

const CategoryRow = ({ title, score }: { title: string; score: number }) => (
    <div className="score-category-row">
        <span className="score-category-label">{title}</span>
        <div className="score-category-right">
            {/* Mini bar */}
            <div style={{ width: '90px', height: '5px', borderRadius: '9999px', background: '#1e1e35', overflow: 'hidden' }}>
                <div style={{
                    height: '100%',
                    width: `${score}%`,
                    borderRadius: '9999px',
                    background: score > 69 ? '#10b981' : score > 49 ? '#f59e0b' : '#ef4444',
                    transition: 'width 0.6s ease',
                }} />
            </div>
            <div className={`score-badge ${getScoreClass(score)}`} style={{ minWidth: '60px', justifyContent: 'center' }}>
                {score}/100
            </div>
        </div>
    </div>
);

const Summary = ({ feedback }: { feedback: Feedback }) => {
    return (
        <div className="score-overview-card">
            <div className="score-overview-header">
                <ScoreGauge score={feedback.overallScore} />
                <div>
                    <p className="score-overview-label">Overall Rating</p>
                    <p className="score-overview-title">Resume Score</p>
                    <p style={{ fontSize: '0.8375rem', color: '#4a5568', marginTop: '0.25rem' }}>
                        Based on content, tone, structure &amp; skills
                    </p>
                </div>
            </div>
            <div className="score-categories">
                <CategoryRow title="Tone &amp; Style" score={feedback.toneAndStyle.score} />
                <CategoryRow title="Content"        score={feedback.content.score} />
                <CategoryRow title="Structure"      score={feedback.structure.score} />
                <CategoryRow title="Skills"         score={feedback.skills.score} />
            </div>
        </div>
    );
};

export default Summary;
