import { cn } from "../../lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

export function Stat({
  label,
  value,
  delta,
  unit,
  emphasis = false,
  className,
  icon,
}: {
  label: string;
  value: string | number;
  delta?: { value: string; positive?: boolean };
  unit?: string;
  emphasis?: boolean;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
        {icon && <span className="text-violet-500">{icon}</span>}
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "num-display tabular-nums text-slate-900",
            emphasis ? "text-[40px]" : "text-[30px]"
          )}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[13px] text-slate-400 font-medium">{unit}</span>
        )}
      </div>
      {delta && (
        <div
          className={cn(
            "text-[12px] font-semibold flex items-center gap-1",
            delta.positive ? "text-emerald-600" : "text-rose-600"
          )}
        >
          {delta.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {delta.value}
        </div>
      )}
    </div>
  );
}
