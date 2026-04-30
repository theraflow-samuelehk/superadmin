import { cn } from "../../lib/utils";

export function Card({
  children,
  className,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative bg-ink-900 hairline rounded-sm",
        interactive &&
          "transition-all duration-200 hover:border-acid/40 hover:bg-ink-850 cursor-pointer group",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardCorner() {
  return (
    <>
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-acid/60 -translate-x-px -translate-y-px opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-acid/60 translate-x-px -translate-y-px opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-acid/60 -translate-x-px translate-y-px opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-acid/60 translate-x-px translate-y-px opacity-0 group-hover:opacity-100 transition-opacity" />
    </>
  );
}
