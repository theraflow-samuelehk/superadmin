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
    <div className={cn("flex items-end justify-between gap-4 mb-6", className)}>
      <div className="flex items-baseline gap-3">
        {index && (
          <span className="text-[11px] tracking-wider text-violet-600 font-bold uppercase pt-1">
            {index}
          </span>
        )}
        <div>
          <h2 className="font-display text-[28px] text-slate-900 tracking-ultra-tight font-bold leading-none">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[13.5px] text-slate-500 mt-2">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
