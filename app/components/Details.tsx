import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
} from "./Accordion";
import { getScoreBadgeClass } from "~/lib/utils";

const ScorePill = ({ score }: { score: number }) => (
    <div className={`score-badge ${getScoreBadgeClass(score)}`} style={{ fontSize: '0.8rem' }}>
        {score}/100
    </div>
);

const CategoryHeader = ({ title, categoryScore }: { title: string; categoryScore: number }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#c8d0e7' }}>{title}</span>
        <ScorePill score={categoryScore} />
    </div>
);

const CategoryContent = ({
    tips,
}: {
    tips: { type: "good" | "improve"; tip: string; explanation?: string }[];
}) => {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleCopyTip = async (index: number, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 1500);
        } catch {
            // ignore
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Quick summary grid */}
            <div className="tips-grid">
                {tips.map((tip, i) => (
                    <div key={i} className="tip-quick">
                        <span style={{ fontSize: '0.75rem', color: tip.type === 'good' ? '#10b981' : '#f59e0b', flexShrink: 0 }}>
                            {tip.type === 'good' ? '✓' : '▲'}
                        </span>
                        <span>{tip.tip}</span>
                    </div>
                ))}
            </div>

            {/* Detailed cards */}
            <div className="tips-detail-list">
                {tips.map((tip, i) => (
                    <div key={i + tip.tip} className={`tip-detail-card ${tip.type === 'good' ? 'tip-good' : 'tip-improve'}`}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.8rem' }}>{tip.type === 'good' ? '✓' : '▲'}</span>
                                <p className="tip-title">{tip.tip}</p>
                            </div>
                            <button
                                type="button"
                                title="Copy tip"
                                onClick={() => handleCopyTip(i, `${tip.tip}: ${tip.explanation || ''}`)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: copiedIndex === i ? '#6ee7b7' : '#64748b',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    padding: '0.2rem 0.4rem',
                                    borderRadius: '0.25rem',
                                }}
                            >
                                {copiedIndex === i ? 'Copied ✓' : 'Copy'}
                            </button>
                        </div>
                        {tip.explanation && (
                            <p className="tip-body" style={{ fontSize: '0.875rem', paddingLeft: '1.375rem' }}>{tip.explanation}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const Details = ({ feedback }: { feedback: Feedback }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <Accordion>
            {[
                { id: 'tone-style', title: 'Tone & Style', score: feedback.toneAndStyle.score, tips: feedback.toneAndStyle.tips },
                { id: 'content',    title: 'Content',      score: feedback.content.score,       tips: feedback.content.tips },
                { id: 'structure',  title: 'Structure',    score: feedback.structure.score,     tips: feedback.structure.tips },
                { id: 'skills',     title: 'Skills',       score: feedback.skills.score,        tips: feedback.skills.tips },
            ].map(({ id, title, score, tips }) => (
                <AccordionItem key={id} id={id}>
                    <AccordionHeader itemId={id}>
                        <CategoryHeader title={title} categoryScore={score} />
                    </AccordionHeader>
                    <AccordionContent itemId={id}>
                        <CategoryContent tips={tips} />
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    </div>
);

export default Details;
