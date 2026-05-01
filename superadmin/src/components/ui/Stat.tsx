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
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 font-bold uppercase tracking-[0.1em]">
        {icon && (
          <span className="w-5 h-5 rounded-md bg-violet-100 text-violet-600 flex items-center justify-center">
            {icon}
          </span>
        )}
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "num-display tabular-nums leading-none",
            emphasis ? "text-[38px] gradient-text-warm" : "text-[28px] text-slate-900"
          )}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[12px] text-slate-400 font-medium leading-none">{unit}</span>
        )}
      </div>
      {delta && (
        <div
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-semibold w-fit px-2 py-0.5 rounded-full",
            delta.positive
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          )}
        >
          {delta.positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {delta.value}
        </div>
      )}
    </div>
  );
}
