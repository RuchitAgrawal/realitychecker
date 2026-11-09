import React from "react";
import { getScoreBadgeClass, getScoreLevel } from "~/lib/utils";

interface ScoreBadgeProps {
  score: number;
}

const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score }) => {
  const badgeClass = getScoreBadgeClass(score);
  const level = getScoreLevel(score);
  const label =
    level === "high" ? "Strong" : level === "medium" ? "Good Start" : "Needs Work";

  return <div className={`score-badge ${badgeClass}`}>{label}</div>;
};

export default ScoreBadge;
