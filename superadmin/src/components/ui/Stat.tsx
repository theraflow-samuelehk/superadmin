import { cn } from "../../lib/utils";

export function Stat({
  label,
  value,
  delta,
  unit,
  emphasis = false,
  className,
}: {
  label: string;
  value: string | number;
  delta?: { value: string; positive?: boolean };
  unit?: string;
  emphasis?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-ink-100 font-semibold">
        <span className="w-1 h-1 bg-accent rounded-full" />
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "font-display font-light tabular-nums tracking-monster text-ink-900",
            emphasis ? "text-[44px]" : "text-3xl"
          )}
          style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[11px] text-ink-100">{unit}</span>
        )}
      </div>
      {delta && (
        <div
          className={cn(
            "text-[10px] uppercase tracking-[0.1em] font-medium flex items-center gap-1",
            delta.positive ? "text-sage" : "text-lacquer"
          )}
        >
          <span>{delta.positive ? "↗" : "↘"}</span>
          {delta.value}
        </div>
      )}
    </div>
  );
}
