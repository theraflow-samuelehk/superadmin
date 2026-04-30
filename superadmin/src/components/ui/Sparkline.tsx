import { useMemo } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  showDot?: boolean;
}

export function Sparkline({
  data,
  width = 80,
  height = 28,
  stroke = "#8b5cf6",
  fill = "rgba(139, 92, 246, 0.15)",
  strokeWidth = 1.5,
  showDot = true,
}: SparklineProps) {
  const { path, areaPath, lastX, lastY } = useMemo(() => {
    if (!data.length) return { path: "", areaPath: "", lastX: 0, lastY: 0 };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = strokeWidth * 2;
    const w = width - padding * 2;
    const h = height - padding * 2;

    const points = data.map((v, i) => {
      const x = padding + (i / (data.length - 1 || 1)) * w;
      const y = padding + h - ((v - min) / range) * h;
      return [x, y];
    });

    const path = points.reduce((acc, [x, y], i) => {
      if (i === 0) return `M ${x},${y}`;
      const [px, py] = points[i - 1];
      const cx = (px + x) / 2;
      return `${acc} Q ${cx},${py} ${x},${y}`;
    }, "");

    const areaPath = `${path} L ${points[points.length - 1][0]},${height - padding} L ${points[0][0]},${height - padding} Z`;
    const last = points[points.length - 1];

    return { path, areaPath, lastX: last[0], lastY: last[1] };
  }, [data, width, height, strokeWidth]);

  if (!data.length) return null;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${stroke.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        d={areaPath}
        fill={`url(#spark-${stroke.replace(/[^a-z0-9]/gi, "")})`}
      />
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDot && (
        <circle
          cx={lastX}
          cy={lastY}
          r={2.5}
          fill={stroke}
          stroke="white"
          strokeWidth={1.5}
        />
      )}
    </svg>
  );
}

// Generate fake but realistic-looking trend data
export function generateTrend(seed: string, points = 10, trend: "up" | "down" | "flat" = "up"): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 10000;
  const base = 40 + (hash % 30);
  const result: number[] = [];
  let val = base;
  for (let i = 0; i < points; i++) {
    const noise = ((hash * (i + 1)) % 17) - 8;
    const direction = trend === "up" ? 3 + (i / points) * 5 : trend === "down" ? -2 - (i / points) * 4 : 0;
    val += direction + noise;
    val = Math.max(10, Math.min(110, val));
    result.push(val);
    hash = (hash * 7919) % 10000;
  }
  return result;
}
