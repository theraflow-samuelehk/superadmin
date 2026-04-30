import { cn } from "../../lib/utils";
import { initials } from "../../lib/utils";

export function Avatar({
  name,
  color,
  size = "md",
  className,
}: {
  name: string;
  color: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    xs: "w-5 h-5 text-[9px]",
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-xs",
    lg: "w-12 h-12 text-sm",
  };
  return (
    <div
      className={cn(
        "rounded-md flex items-center justify-center font-display font-medium tracking-tight shrink-0",
        sizes[size],
        className
      )}
      style={{
        backgroundColor: `${color}1f`,
        color: shade(color),
        boxShadow: `inset 0 0 0 1px ${color}55`,
        fontVariationSettings: "'opsz' 144, 'SOFT' 30",
      }}
      title={name}
    >
      {initials(name)}
    </div>
  );
}

// Darken a hex color a touch so it reads on light bg
function shade(hex: string) {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 60);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 60);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 60);
  return `rgb(${r}, ${g}, ${b})`;
}

export function AvatarStack({
  members,
  max = 3,
}: {
  members: { name: string; color: string }[];
  max?: number;
}) {
  const visible = members.slice(0, max);
  const rest = Math.max(0, members.length - max);
  return (
    <div className="flex items-center -space-x-2">
      {visible.map((m, i) => (
        <Avatar
          key={i}
          name={m.name}
          color={m.color}
          size="sm"
          className="ring-2 ring-white"
        />
      ))}
      {rest > 0 && (
        <span className="w-7 h-7 rounded-md bg-paper-100 hairline text-ink-200 text-[10px] font-mono flex items-center justify-center ring-2 ring-white">
          +{rest}
        </span>
      )}
    </div>
  );
}
