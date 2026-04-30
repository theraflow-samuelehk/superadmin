import { cn } from "../../lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}>
      <EmptyIllustration className="w-[220px] h-[160px] mb-6" />
      <div className="heading-lg text-slate-900 mb-2" style={{ fontSize: "20px" }}>
        {title}
      </div>
      {description && (
        <p className="text-[14px] text-slate-500 max-w-md mb-5 leading-relaxed">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

export function EmptyIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 220"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="empty-card-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="empty-card-2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="empty-mag" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <radialGradient id="empty-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Soft glow */}
      <ellipse cx="160" cy="180" rx="130" ry="20" fill="url(#empty-glow)" />

      {/* Background card 1 (back) */}
      <g style={{ animation: "float 6s ease-in-out infinite" }}>
        <rect
          x="50"
          y="40"
          width="120"
          height="90"
          rx="14"
          fill="url(#empty-card-2)"
          stroke="#a78bfa"
          strokeOpacity="0.3"
          strokeWidth="1"
          transform="rotate(-8 110 85)"
        />
        <rect x="65" y="60" width="60" height="6" rx="3" fill="#a78bfa" opacity="0.45" transform="rotate(-8 110 85)" />
        <rect x="65" y="74" width="40" height="4" rx="2" fill="#a78bfa" opacity="0.3" transform="rotate(-8 110 85)" />
        <rect x="65" y="86" width="80" height="4" rx="2" fill="#a78bfa" opacity="0.25" transform="rotate(-8 110 85)" />
      </g>

      {/* Background card 2 (front-right) */}
      <g style={{ animation: "float 6s ease-in-out infinite", animationDelay: "-2s" }}>
        <rect
          x="160"
          y="50"
          width="120"
          height="90"
          rx="14"
          fill="url(#empty-card-1)"
          stroke="#67e8f9"
          strokeOpacity="0.4"
          strokeWidth="1"
          transform="rotate(6 220 95)"
        />
        <circle cx="184" cy="78" r="8" fill="#67e8f9" opacity="0.6" transform="rotate(6 220 95)" />
        <rect x="200" y="72" width="60" height="5" rx="2.5" fill="#0891b2" opacity="0.55" transform="rotate(6 220 95)" />
        <rect x="200" y="84" width="40" height="4" rx="2" fill="#0891b2" opacity="0.35" transform="rotate(6 220 95)" />
        <rect x="170" y="105" width="100" height="20" rx="8" fill="#67e8f9" opacity="0.25" transform="rotate(6 220 95)" />
      </g>

      {/* Magnifying glass — front and center */}
      <g style={{ animation: "float 5s ease-in-out infinite", animationDelay: "-1s" }}>
        {/* Outer ring */}
        <circle cx="160" cy="115" r="42" fill="white" stroke="url(#empty-mag)" strokeWidth="3" />
        {/* Inner depth */}
        <circle cx="160" cy="115" r="36" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        {/* Highlight */}
        <path
          d="M 138 95 Q 145 85 158 88"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.85"
        />
        {/* Question mark inside */}
        <path
          d="M 152 105 Q 152 100 160 100 Q 168 100 168 107 Q 168 112 162 116 Q 160 117 160 122 M 160 130 L 160 132"
          stroke="#94a3b8"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Handle */}
        <path
          d="M 192 147 L 220 175"
          stroke="url(#empty-mag)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M 192 147 L 220 175"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.4"
        />
      </g>

      {/* Decorative stars */}
      <g opacity="0.6">
        <circle cx="60" cy="20" r="2" fill="#06b6d4" />
        <circle cx="280" cy="30" r="2.5" fill="#a78bfa" />
        <circle cx="20" cy="160" r="2" fill="#67e8f9" />
        <circle cx="300" cy="170" r="2" fill="#c4b5fd" />
      </g>
    </svg>
  );
}
