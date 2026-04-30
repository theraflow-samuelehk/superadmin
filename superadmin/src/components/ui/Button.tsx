import { cn } from "../../lib/utils";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "acid";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: "bg-ink-100 text-ink-950 hover:bg-white border-ink-100",
  secondary: "bg-ink-800 text-ink-100 hover:bg-ink-700 border-ink-700",
  ghost: "bg-transparent text-ink-200 hover:bg-ink-800 hover:text-ink-50 border-transparent",
  danger: "bg-bad/10 text-bad hover:bg-bad/20 border-bad/30",
  acid: "bg-acid text-ink-950 hover:bg-acid-bright border-acid font-semibold glow-acid",
};

const sizes: Record<Size, string> = {
  sm: "h-7 px-2.5 text-[11px]",
  md: "h-9 px-3.5 text-xs",
  lg: "h-11 px-5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", className, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center gap-2 border rounded-sm uppercase tracking-[0.08em] font-mono transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-acid/60 focus:ring-offset-0 disabled:opacity-40 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
