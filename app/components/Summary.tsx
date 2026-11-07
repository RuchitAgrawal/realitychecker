import ScoreGauge from "~/components/ScoreGauge";
import { getScoreBadgeClass, getScoreColor } from "~/lib/utils";

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
                    background: getScoreColor(score),
                    transition: 'width 0.6s ease',
                }} />
            </div>
            <div className={`score-badge ${getScoreBadgeClass(score)}`} style={{ minWidth: '60px', justifyContent: 'center' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <p className="score-overview-label">Overall Rating</p>
                        {feedback.experienceLevel && (
                            <span style={{
                                fontSize: '0.7rem',
                                textTransform: 'capitalize',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '9999px',
                                background: 'rgba(99, 102, 241, 0.15)',
                                color: '#a5b4fc',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                fontWeight: 600,
                            }}>
                                {feedback.experienceLevel} Level
                            </span>
                        )}
                    </div>
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
