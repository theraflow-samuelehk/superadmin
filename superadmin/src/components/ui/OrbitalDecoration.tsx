/**
 * Decorative orbital SVG for hero sections.
 * Concentric circles + orbiting dots, animated via CSS transforms.
 */
export function OrbitalDecoration({
  className,
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  const stroke = variant === "dark" ? "rgba(255,255,255,0.12)" : "rgba(6, 182, 212, 0.18)";
  const dotColors = ["#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6"];

  return (
    <svg
      viewBox="0 0 600 600"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="orbital-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={variant === "dark" ? "#06b6d4" : "#06b6d4"} stopOpacity="0.18" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="orbital-arc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Glow center */}
      <circle cx="300" cy="300" r="200" fill="url(#orbital-glow)" />

      {/* Concentric circles */}
      {[80, 130, 190, 250].map((r, i) => (
        <circle
          key={r}
          cx="300"
          cy="300"
          r={r}
          stroke={stroke}
          strokeWidth="1"
          strokeDasharray={i % 2 ? "2 6" : "0"}
        />
      ))}

      {/* Highlight arc */}
      <circle
        cx="300"
        cy="300"
        r="190"
        stroke="url(#orbital-arc)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="280 1000"
        style={{
          transformOrigin: "300px 300px",
          animation: "orbit-rotate 20s linear infinite",
        }}
      />
      <circle
        cx="300"
        cy="300"
        r="250"
        stroke="url(#orbital-arc)"
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="180 1500"
        style={{
          transformOrigin: "300px 300px",
          animation: "orbit-rotate 35s linear infinite reverse",
        }}
      />

      {/* Orbiting dots */}
      {dotColors.map((color, i) => {
        const radius = 130 + i * 60;
        const duration = 12 + i * 4;
        const offset = i * (360 / dotColors.length);
        return (
          <g
            key={color}
            style={{
              transformOrigin: "300px 300px",
              animation: `orbit-rotate ${duration}s linear infinite`,
              transform: `rotate(${offset}deg)`,
            }}
          >
            <circle cx={300 + radius} cy="300" r="4" fill={color}>
              <animate attributeName="opacity" values="1;0.4;1" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx={300 + radius} cy="300" r="9" fill={color} opacity="0.2" />
          </g>
        );
      })}

      {/* Center node */}
      <circle cx="300" cy="300" r="6" fill="#06b6d4" />
      <circle cx="300" cy="300" r="14" fill="#06b6d4" opacity="0.18" />
    </svg>
  );
}
