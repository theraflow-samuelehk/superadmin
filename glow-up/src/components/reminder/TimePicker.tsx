import { useRef } from "react";

interface TimePickerProps {
  hour: number;
  minute: number;
  onChangeHour: (h: number) => void;
  onChangeMinute: (m: number) => void;
  className?: string;
  size?: "sm" | "md";
}

/**
 * Compact HH:MM time picker with native-style inputs.
 * Mobile-friendly: uses large tap targets and scrollable number inputs.
 */
export default function TimePicker({
  hour,
  minute,
  onChangeHour,
  onChangeMinute,
  className = "",
  size = "md",
}: TimePickerProps) {
  const hRef = useRef<HTMLSelectElement>(null);
  const mRef = useRef<HTMLSelectElement>(null);

  const h = size === "sm" ? "h-8" : "h-9";
  const text = size === "sm" ? "text-sm" : "text-base";
  const selectClass = `${h} ${text} font-medium tabular-nums bg-background border border-input rounded-lg px-1.5 text-center appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors hover:border-primary/40`;

  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`}>
      <select
        ref={hRef}
        value={hour}
        onChange={e => onChangeHour(parseInt(e.target.value))}
        className={`${selectClass} w-[52px]`}
      >
        {Array.from({ length: 24 }, (_, i) => (
          <option key={i} value={i}>
            {String(i).padStart(2, "0")}
          </option>
        ))}
      </select>
      <span className={`${text} font-bold text-muted-foreground select-none`}>:</span>
      <select
        ref={mRef}
        value={minute}
        onChange={e => onChangeMinute(parseInt(e.target.value))}
        className={`${selectClass} w-[52px]`}
      >
        {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
          <option key={m} value={m}>
            {String(m).padStart(2, "0")}
          </option>
        ))}
      </select>
    </div>
  );
}
