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
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-ink-300">
        <span className="w-1 h-1 bg-acid"></span>
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "font-display font-light tabular-nums tracking-monster",
            emphasis ? "text-5xl text-ink-50" : "text-3xl text-ink-100"
          )}
          style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 0" }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs font-mono text-ink-300 uppercase">{unit}</span>
        )}
      </div>
      {delta && (
        <div
          className={cn(
            "text-[10px] font-mono uppercase tracking-[0.12em] flex items-center gap-1",
            delta.positive ? "text-good" : "text-bad"
          )}
        >
          <span>{delta.positive ? "↗" : "↘"}</span>
          {delta.value}
        </div>
      )}
    </div>
  );
}
