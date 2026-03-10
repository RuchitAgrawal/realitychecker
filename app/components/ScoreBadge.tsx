import React from "react";

interface ScoreBadgeProps {
  score: number;
}

const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score }) => {
  const badgeClass = score > 70
    ? 'score-badge-green'
    : score > 49
      ? 'score-badge-yellow'
      : 'score-badge-red';

  const label = score > 70 ? 'Strong' : score > 49 ? 'Good Start' : 'Needs Work';

  return (
    <div className={`score-badge ${badgeClass}`}>
      {label}
    </div>
  );
};

export default ScoreBadge;
