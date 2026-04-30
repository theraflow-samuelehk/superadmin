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
        "relative",
        flat ? "bg-white rounded-2xl border border-slate-200" : "card-3d",
        interactive && "card-3d-interactive cursor-pointer group",
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
