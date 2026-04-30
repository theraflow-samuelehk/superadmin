import { cn } from "../../lib/utils";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "soft";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: "btn-primary border-0 font-semibold",
  secondary:
    "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-soft font-medium",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-transparent",
  danger:
    "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 font-medium",
  soft:
    "bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-100 font-medium",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[12px]",
  md: "h-10 px-4 text-[13px]",
  lg: "h-12 px-6 text-[14px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", className, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl tracking-tight transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-violet-300/60 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap",
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
