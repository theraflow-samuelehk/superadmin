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
    <div className={cn("flex items-end justify-between gap-4 hairline-b pb-4", className)}>
      <div className="flex items-baseline gap-4">
        {index && (
          <span className="text-[10px] tracking-[0.18em] text-accent uppercase pt-1 font-semibold">
            {index}
          </span>
        )}
        <div>
          <h2
            className="font-display text-[28px] text-ink-900 tracking-ultra-tight font-normal leading-none"
            style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-[12px] text-ink-200 mt-2">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
