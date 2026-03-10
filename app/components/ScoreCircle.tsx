const ScoreCircle = ({ score = 75 }: { score: number }) => {
    const radius = 38;
    const stroke = 7;
    const normalizedRadius = radius - stroke / 2;
    const circumference = 2 * Math.PI * normalizedRadius;
    const strokeDashoffset = circumference * (1 - score / 100);

    const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
    const trackColor = score >= 70 ? 'rgba(16,185,129,0.12)' : score >= 50 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)';

    return (
        <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
            <svg height="100%" width="100%" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
                {/* Track */}
                <circle cx="40" cy="40" r={normalizedRadius} stroke={trackColor} strokeWidth={stroke} fill="transparent" />
                {/* Progress */}
                <circle
                    cx="40" cy="40" r={normalizedRadius}
                    stroke={color} strokeWidth={stroke} fill="transparent"
                    strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
            </svg>
            <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
            }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
                <span style={{ fontSize: '0.6rem', color: '#4a5568', lineHeight: 1, marginTop: '1px' }}>/100</span>
            </div>
        </div>
    );
};

export default ScoreCircle;
