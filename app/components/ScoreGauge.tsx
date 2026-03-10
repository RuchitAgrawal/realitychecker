import { useEffect, useRef, useState } from "react";

const ScoreGauge = ({ score = 75 }: { score: number }) => {
    const [pathLength, setPathLength] = useState(0);
    const pathRef = useRef<SVGPathElement>(null);

    useEffect(() => {
        if (pathRef.current) setPathLength(pathRef.current.getTotalLength());
    }, []);

    const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, gap: '0.25rem' }}>
            {/* Arc gauge */}
            <svg viewBox="0 0 100 56" style={{ width: '110px', height: '62px' }}>
                {/* Track */}
                <path d="M10,54 A44,44 0 0,1 90,54" fill="none" stroke="#1e1e35" strokeWidth="10" strokeLinecap="round" />
                {/* Filled arc */}
                <path
                    ref={pathRef}
                    d="M10,54 A44,44 0 0,1 90,54"
                    fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={pathLength || 138}
                    strokeDashoffset={(pathLength || 138) * (1 - score / 100)}
                    style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }}
                />
            </svg>

            {/* Score number — below the arc, always visible */}
            <div style={{ textAlign: 'center', lineHeight: 1, marginTop: '-0.5rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color, display: 'block' }}>{score}</span>
                <span style={{ fontSize: '0.65rem', color: '#4a5568', display: 'block' }}>/100</span>
            </div>
        </div>
    );
};

export default ScoreGauge;
