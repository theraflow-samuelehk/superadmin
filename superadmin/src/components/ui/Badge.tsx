import { cn } from "../../lib/utils";

type Variant = "neutral" | "live" | "draft" | "deploying" | "archived" | "trial" | "paused" | "suspended" | "acid" | "warn" | "bad";

const styles: Record<Variant, string> = {
  neutral: "bg-ink-700 text-ink-200 border-ink-600",
  live: "bg-good/10 text-good border-good/20",
  draft: "bg-ink-700 text-ink-200 border-ink-600",
  deploying: "bg-acid/15 text-acid border-acid/30 animate-pulse",
  archived: "bg-ink-800 text-ink-400 border-ink-700",
  trial: "bg-warn/10 text-warn border-warn/20",
  paused: "bg-ink-700 text-ink-300 border-ink-500",
  suspended: "bg-bad/10 text-bad border-bad/20",
  acid: "bg-acid text-ink-950 border-acid",
  warn: "bg-warn/10 text-warn border-warn/20",
  bad: "bg-bad/10 text-bad border-bad/20",
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
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.12em] border rounded-sm",
        styles[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            variant === "live" && "bg-good animate-pulse",
            variant === "deploying" && "bg-acid",
            variant === "trial" && "bg-warn",
            variant === "suspended" && "bg-bad",
            variant === "paused" && "bg-ink-400",
            variant === "draft" && "bg-ink-400",
            variant === "archived" && "bg-ink-500"
          )}
        />
      )}
      {children}
    </span>
  );
}
