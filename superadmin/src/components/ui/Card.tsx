import { cn } from "../../lib/utils";

export function Card({
  children,
  className,
  interactive = false,
  soft = false,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  soft?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative rounded-lg",
        soft ? "bg-paper-100 hairline" : "bg-white hairline shadow-soft",
        interactive &&
          "transition-all duration-200 hover:border-accent/30 hover:shadow-lift cursor-pointer group",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardCorner() {
  return null; // dropped — too "ops console" for premium light look
}
