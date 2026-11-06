export function formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const generateUUID = () => crypto.randomUUID();

export type ScoreLevel = 'high' | 'medium' | 'low';

export const SCORE_COLORS = {
    high: '#10b981',
    medium: '#f59e0b',
    low: '#ef4444',
} as const;

export function getScoreLevel(score: number): ScoreLevel {
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
}

export function getScoreColor(score: number): string {
    return SCORE_COLORS[getScoreLevel(score)];
}

export function getScoreBadgeClass(score: number): string {
    const level = getScoreLevel(score);
    if (level === 'high') return 'score-badge-green';
    if (level === 'medium') return 'score-badge-yellow';
    return 'score-badge-red';
}
