import { cn } from "../../lib/utils";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "soft" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "btn-primary border-0 font-semibold text-white",
  secondary:
    "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 hover:shadow-sm font-medium transition-shadow",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 border border-transparent font-medium",
  danger:
    "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/80 font-medium",
  soft:
    "bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-100 font-medium",
  outline:
    "bg-transparent text-slate-700 hover:bg-slate-50 border border-slate-300 hover:border-slate-400 font-medium",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[12px] rounded-lg",
  md: "h-10 px-4 text-[13px] rounded-xl",
  lg: "h-12 px-6 text-[14px] rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", className, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center gap-2 tracking-tight transition-all duration-150",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 focus-visible:outline-offset-2",
        "disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap",
        "select-none",
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
