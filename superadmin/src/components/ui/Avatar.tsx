import { cn } from "../../lib/utils";
import { initials } from "../../lib/utils";

const GRADIENTS: Record<string, string> = {
  "#d4ff4f": "linear-gradient(135deg, #fde047 0%, #84cc16 100%)",
  "#ff6b9d": "linear-gradient(135deg, #fb7185 0%, #ec4899 100%)",
  "#4fd4ff": "linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)",
  "#ffb347": "linear-gradient(135deg, #fbbf24 0%, #f97316 100%)",
  "#b794f6": "linear-gradient(135deg, #c4b5fd 0%, #8b5cf6 100%)",
  "#7ee787": "linear-gradient(135deg, #6ee7b7 0%, #10b981 100%)",
  "#f97583": "linear-gradient(135deg, #fb7185 0%, #e11d48 100%)",
  "#ffd166": "linear-gradient(135deg, #fde047 0%, #f59e0b 100%)",
};

const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)",
  "linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)",
  "linear-gradient(135deg, #fb7185 0%, #f97316 100%)",
  "linear-gradient(135deg, #34d399 0%, #06b6d4 100%)",
  "linear-gradient(135deg, #fbbf24 0%, #ef4444 100%)",
];

export function gradientFor(seed: string): string {
  if (GRADIENTS[seed]) return GRADIENTS[seed];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 1024;
  return FALLBACK_GRADIENTS[hash % FALLBACK_GRADIENTS.length];
}

export function Avatar({
  name,
  color,
  size = "md",
  className,
}: {
  name: string;
  color: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    xs: "w-5 h-5 text-[9px]",
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-[12px]",
    lg: "w-12 h-12 text-[14px]",
    xl: "w-16 h-16 text-[18px]",
  };
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-display font-bold tracking-tight shrink-0 text-white",
        sizes[size],
        className
      )}
      style={{
        backgroundImage: gradientFor(color),
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.2)",
      }}
      title={name}
    >
      {initials(name)}
    </div>
  );
}

export function AvatarStack({
  members,
  max = 3,
}: {
  members: { name: string; color: string }[];
  max?: number;
}) {
  const visible = members.slice(0, max);
  const rest = Math.max(0, members.length - max);
  return (
    <div className="flex items-center -space-x-2">
      {visible.map((m, i) => (
        <Avatar
          key={i}
          name={m.name}
          color={m.color}
          size="sm"
          className="ring-2 ring-white"
        />
      ))}
      {rest > 0 && (
        <span className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-semibold flex items-center justify-center ring-2 ring-white">
          +{rest}
        </span>
      )}
    </div>
  );
}
