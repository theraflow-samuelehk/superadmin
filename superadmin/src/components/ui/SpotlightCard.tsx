import { useRef } from "react";
import { cn } from "../../lib/utils";

export function SpotlightCard({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty("--x", `${x}px`);
    el.style.setProperty("--y", `${y}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={cn(
        "spotlight relative bg-white rounded-2xl border border-slate-100 shadow-card transition-all duration-300 hover:shadow-lift hover:border-violet-200",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
