/**
 * Custom category SVG icons + color theme per category.
 * Disegni semplici con gradient brand-aware.
 */

interface CategoryStyle {
  bg: string;
  ring: string;
  text: string;
  gradFrom: string;
  gradTo: string;
}

const styles: Record<string, CategoryStyle> = {
  "ecommerce":          { bg: "bg-fuchsia-50", ring: "ring-fuchsia-200/60", text: "text-fuchsia-700", gradFrom: "#ec4899", gradTo: "#a21caf" },
  "saas":               { bg: "bg-cyan-50", ring: "ring-cyan-200/60", text: "text-cyan-700", gradFrom: "#06b6d4", gradTo: "#3b82f6" },
  "funnel & landing":   { bg: "bg-amber-50", ring: "ring-amber-200/60", text: "text-amber-700", gradFrom: "#f59e0b", gradTo: "#ea580c" },
  "corsi":              { bg: "bg-violet-50", ring: "ring-violet-200/60", text: "text-violet-700", gradFrom: "#8b5cf6", gradTo: "#6366f1" },
  "vetrina":            { bg: "bg-emerald-50", ring: "ring-emerald-200/60", text: "text-emerald-700", gradFrom: "#10b981", gradTo: "#0891b2" },
  "tool interni":       { bg: "bg-slate-50", ring: "ring-slate-200/60", text: "text-slate-700", gradFrom: "#64748b", gradTo: "#334155" },
  "microservice":       { bg: "bg-rose-50", ring: "ring-rose-200/60", text: "text-rose-700", gradFrom: "#f43f5e", gradTo: "#be123c" },
};

const defaultStyle: CategoryStyle = {
  bg: "bg-slate-50", ring: "ring-slate-200/60", text: "text-slate-700",
  gradFrom: "#64748b", gradTo: "#334155",
};

export function getCategoryStyle(category: string): CategoryStyle {
  return styles[category.toLowerCase()] || defaultStyle;
}

export function CategoryIcon({
  category,
  size = 18,
  className,
}: {
  category: string;
  size?: number;
  className?: string;
}) {
  const s = getCategoryStyle(category);
  const id = category.replace(/[^a-z0-9]/gi, "");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`cat-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={s.gradFrom} />
          <stop offset="100%" stopColor={s.gradTo} />
        </linearGradient>
      </defs>
      {iconPath(category, `url(#cat-${id})`)}
    </svg>
  );
}

function iconPath(category: string, fill: string) {
  const c = category.toLowerCase();

  if (c === "ecommerce") {
    // Shopping bag with handle
    return (
      <>
        <path
          d="M 6 7 L 6 5.5 C 6 3 8 1.5 12 1.5 C 16 1.5 18 3 18 5.5 L 18 7"
          stroke={fill}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 4 7 L 20 7 L 19 21 C 19 21.5 18.5 22 18 22 L 6 22 C 5.5 22 5 21.5 5 21 Z"
          fill={fill}
        />
      </>
    );
  }
  if (c === "saas") {
    // Layered cube / blocks
    return (
      <>
        <rect x="3" y="3" width="8" height="8" rx="2" fill={fill} opacity="0.5" />
        <rect x="13" y="3" width="8" height="8" rx="2" fill={fill} opacity="0.85" />
        <rect x="3" y="13" width="8" height="8" rx="2" fill={fill} />
        <rect x="13" y="13" width="8" height="8" rx="2" fill={fill} opacity="0.4" />
      </>
    );
  }
  if (c === "funnel & landing") {
    // Funnel shape
    return (
      <>
        <path
          d="M 3 4 L 21 4 L 14 13 L 14 21 L 10 19 L 10 13 Z"
          fill={fill}
        />
      </>
    );
  }
  if (c === "corsi") {
    // Graduation cap
    return (
      <>
        <path
          d="M 12 2 L 22 7 L 12 12 L 2 7 Z"
          fill={fill}
        />
        <path
          d="M 6 9.5 L 6 14 C 6 15.5 9 17 12 17 C 15 17 18 15.5 18 14 L 18 9.5"
          stroke={fill}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <line x1="22" y1="7" x2="22" y2="13" stroke={fill} strokeWidth="2" strokeLinecap="round" />
      </>
    );
  }
  if (c === "vetrina") {
    // Browser window
    return (
      <>
        <rect x="2" y="4" width="20" height="16" rx="3" fill={fill} opacity="0.4" />
        <rect x="2" y="4" width="20" height="5" rx="3" fill={fill} />
        <circle cx="5" cy="6.5" r="0.8" fill="white" />
        <circle cx="7.5" cy="6.5" r="0.8" fill="white" />
        <circle cx="10" cy="6.5" r="0.8" fill="white" />
      </>
    );
  }
  if (c === "tool interni") {
    // Wrench / settings
    return (
      <>
        <circle cx="12" cy="12" r="3" fill="none" stroke={fill} strokeWidth="2" />
        <path
          d="M 12 2 L 12 5 M 12 19 L 12 22 M 5 12 L 2 12 M 22 12 L 19 12 M 17 7 L 19 5 M 7 17 L 5 19 M 17 17 L 19 19 M 7 7 L 5 5"
          stroke={fill}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    );
  }
  if (c === "microservice") {
    // Hexagon node
    return (
      <>
        <path
          d="M 12 2 L 21 7 L 21 17 L 12 22 L 3 17 L 3 7 Z"
          fill={fill}
        />
        <circle cx="12" cy="12" r="3" fill="white" opacity="0.85" />
      </>
    );
  }

  // Default: dot pattern
  return (
    <>
      <circle cx="6" cy="6" r="2" fill={fill} />
      <circle cx="12" cy="6" r="2" fill={fill} opacity="0.6" />
      <circle cx="18" cy="6" r="2" fill={fill} opacity="0.3" />
      <circle cx="6" cy="12" r="2" fill={fill} opacity="0.6" />
      <circle cx="12" cy="12" r="2" fill={fill} />
      <circle cx="18" cy="12" r="2" fill={fill} opacity="0.6" />
      <circle cx="6" cy="18" r="2" fill={fill} opacity="0.3" />
      <circle cx="12" cy="18" r="2" fill={fill} opacity="0.6" />
      <circle cx="18" cy="18" r="2" fill={fill} />
    </>
  );
}

export function CategoryBadge({
  category,
  size = "md",
}: {
  category: string;
  size?: "sm" | "md";
}) {
  const s = getCategoryStyle(category);
  const sizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
  };
  const iconSize = size === "sm" ? 14 : 18;
  return (
    <div
      className={`${sizes[size]} ${s.bg} rounded-lg flex items-center justify-center ring-1 ${s.ring} shrink-0`}
    >
      <CategoryIcon category={category} size={iconSize} />
    </div>
  );
}
