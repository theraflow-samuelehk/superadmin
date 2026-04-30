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
        "rounded-sm flex items-center justify-center font-mono font-semibold tracking-tight shrink-0",
        sizes[size],
        className
      )}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        boxShadow: `inset 0 0 0 1px ${color}40`,
      }}
      title={name}
    >
      {initials(name)}
    </div>
  );
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
          className="ring-2 ring-ink-900"
        />
      ))}
      {rest > 0 && (
        <span className="w-7 h-7 rounded-sm bg-ink-700 hairline text-ink-200 text-[10px] font-mono flex items-center justify-center ring-2 ring-ink-900">
          +{rest}
        </span>
      )}
    </div>
  );
}
