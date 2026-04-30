import { cn } from "../../lib/utils";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "lacquer";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-paper-50 hover:bg-accent-bright border-accent-deep shadow-accent font-medium",
  secondary:
    "bg-white text-ink-400 hover:bg-paper-100 border-paper-200 hover:border-paper-300 shadow-soft",
  ghost:
    "bg-transparent text-ink-200 hover:bg-paper-100 hover:text-ink-500 border-transparent",
  danger:
    "bg-paper-50 text-lacquer hover:bg-lacquer/5 border-lacquer/30",
  lacquer:
    "bg-lacquer text-paper-50 hover:bg-lacquer-bright border-lacquer-deep shadow-soft font-medium",
};

const sizes: Record<Size, string> = {
  sm: "h-7 px-2.5 text-[11px]",
  md: "h-9 px-3.5 text-[12px]",
  lg: "h-11 px-5 text-[13px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", className, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center gap-2 border rounded-md tracking-tight transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-1 focus:ring-offset-paper-50 disabled:opacity-40 disabled:cursor-not-allowed",
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
