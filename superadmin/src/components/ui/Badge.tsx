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
  | "accent"
  | "warn"
  | "bad";

const styles: Record<Variant, string> = {
  neutral: "bg-paper-100 text-ink-200 border-paper-200",
  live: "bg-sage/10 text-sage-deep border-sage/25",
  draft: "bg-paper-100 text-ink-200 border-paper-200",
  deploying: "bg-accent/8 text-accent border-accent/20 animate-pulse",
  archived: "bg-paper-100 text-ink-100 border-paper-200",
  trial: "bg-saffron/10 text-saffron border-saffron/25",
  paused: "bg-paper-100 text-ink-200 border-paper-300",
  suspended: "bg-lacquer/8 text-lacquer border-lacquer/25",
  accent: "bg-accent text-paper-50 border-accent-deep",
  warn: "bg-saffron/10 text-saffron border-saffron/25",
  bad: "bg-lacquer/8 text-lacquer border-lacquer/25",
};

const dotColor: Record<string, string> = {
  live: "bg-sage",
  deploying: "bg-accent",
  trial: "bg-saffron",
  suspended: "bg-lacquer",
  paused: "bg-ink-100",
  draft: "bg-ink-100",
  archived: "bg-ink-50",
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
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] border rounded-full",
        styles[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            dotColor[variant] || "bg-ink-100",
            variant === "live" && "animate-pulse"
          )}
        />
      )}
      {children}
    </span>
  );
}
