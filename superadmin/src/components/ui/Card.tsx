import { cn } from "../../lib/utils";

export function Card({
  children,
  className,
  interactive = false,
  flat = false,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  flat?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative rounded-2xl bg-white",
        flat
          ? "border border-slate-200"
          : "shadow-card border border-slate-100",
        interactive &&
          "transition-all duration-200 hover:shadow-lift hover:border-violet-200 cursor-pointer group",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardCorner() {
  return null;
}
