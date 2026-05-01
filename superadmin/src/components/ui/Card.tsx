import { cn } from "../../lib/utils";

export function Card({
  children,
  className,
  interactive = false,
  flat = false,
  glow = false,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  flat?: boolean;
  glow?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        "relative",
        flat
          ? "bg-white rounded-2xl border border-slate-200/80"
          : "card-3d",
        interactive && "card-3d-interactive cursor-pointer group",
        glow && "shadow-glow",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

export function CardCorner() {
  return null;
}
