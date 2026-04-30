import { useMemo } from "react";

interface CountdownCircleProps {
  minutesLeft: number;
  size?: number;
  color?: string;
}

export default function CountdownCircle({ minutesLeft, size = 44, color }: CountdownCircleProps) {
  const { stroke, progress, label } = useMemo(() => {
    const max = 60; // countdown starts at 60 min
    const clamped = Math.min(Math.max(minutesLeft, 0), max);
    // Progress goes from 1 (full) to 0 (empty) as time runs out
    const pct = clamped / max;
    const resolvedColor = color || "hsl(var(--primary))";
    const mins = Math.ceil(minutesLeft);
    const text = mins >= 60 ? `${Math.floor(mins / 60)}h` : `${mins}m`;
    return { stroke: resolvedColor, progress: pct, label: text };
  }, [minutesLeft, color]);

  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg) scaleY(-1)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={3}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute font-bold text-[10px] text-foreground">
        {label}
      </span>
    </div>
  );
}
