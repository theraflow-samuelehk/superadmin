import { cn } from "../../lib/utils";

export function SectionLabel({
  index,
  title,
  subtitle,
  action,
  className,
}: {
  index?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4 hairline-b pb-3", className)}>
      <div className="flex items-baseline gap-4">
        {index && (
          <span className="font-mono text-[10px] tracking-[0.18em] text-acid uppercase pt-1">
            {index}
          </span>
        )}
        <div>
          <h2
            className="font-display text-2xl text-ink-50 tracking-ultra-tight font-light leading-none"
            style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs font-mono uppercase tracking-[0.12em] text-ink-400 mt-2">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
