import { cn } from "../../lib/utils";

type Variant =
  | "neutral"
  | "live"
  | "draft"
  | "deploying"
  | "archived"
  | "trial"
  | "paused"
  | "suspended"
  | "violet"
  | "warn"
  | "bad"
  | "info";

const styles: Record<Variant, string> = {
  neutral:   "bg-slate-100 text-slate-600 border-slate-200/80",
  live:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft:     "bg-slate-100 text-slate-500 border-slate-200/80",
  deploying: "bg-violet-50 text-violet-700 border-violet-200 animate-pulse",
  archived:  "bg-slate-50 text-slate-400 border-slate-200/60",
  trial:     "bg-amber-50 text-amber-700 border-amber-200",
  paused:    "bg-slate-100 text-slate-500 border-slate-200/80",
  suspended: "bg-rose-50 text-rose-700 border-rose-200",
  violet:    "bg-violet-100 text-violet-800 border-violet-200",
  warn:      "bg-amber-50 text-amber-700 border-amber-200",
  bad:       "bg-rose-50 text-rose-700 border-rose-200",
  info:      "bg-sky-50 text-sky-700 border-sky-200",
};

const dotColor: Record<string, string> = {
  live:      "bg-emerald-500",
  deploying: "bg-violet-500",
  trial:     "bg-amber-500",
  suspended: "bg-rose-500",
  paused:    "bg-slate-400",
  draft:     "bg-slate-400",
  archived:  "bg-slate-300",
  info:      "bg-sky-500",
  violet:    "bg-violet-500",
  warn:      "bg-amber-500",
  bad:       "bg-rose-500",
};

export function Badge({
  variant = "neutral",
  children,
  className,
  dot = false,
}: {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-[3px] text-[10.5px] font-semibold uppercase tracking-[0.06em] border rounded-full leading-none",
        styles[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full flex-shrink-0",
            dotColor[variant] || "bg-slate-400",
            variant === "live" && "animate-pulse"
          )}
        />
      )}
      {children}
    </span>
  );
}
