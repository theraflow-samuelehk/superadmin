/**
 * TheraFlow brand mark + lockup.
 *
 * Logo concept: 3 onde orizzontali fluenti dentro un quadrato gradient blu.
 * Le onde simboleggiano "flow" e l'energia ritmica di una pratica/terapia.
 */

import { useId } from "react";
import { cn } from "../../lib/utils";

interface BrandMarkProps {
  size?: number;
  className?: string;
  online?: boolean;
}

export function BrandMark({ size = 40, className, online = false }: BrandMarkProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `bm-wave-${uid}`;
  const radius = size * 0.22;
  const stroke = size / 14;
  return (
    <div
      className={cn("relative shrink-0 inline-flex items-center justify-center", className)}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background:
          "linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #6366f1 100%)",
        boxShadow:
          "0 0 0 1px rgba(255, 255, 255, 0.12) inset, 0 8px 24px -4px rgba(6, 182, 212, 0.45)",
      }}
    >
      {/* Inner highlight gloss */}
      <span
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: radius,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 50%)",
        }}
      />

      {/* Wave logo */}
      <svg
        viewBox="0 0 32 32"
        width={size * 0.74}
        height={size * 0.74}
        fill="none"
        aria-hidden
        className="relative"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <path
          d="M 4 11 Q 8 7, 12 11 T 20 11 T 28 11"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke} strokeLinecap="round" fill="none" opacity="1"
        />
        <path
          d="M 4 16 Q 8 12, 12 16 T 20 16 T 28 16"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke} strokeLinecap="round" fill="none" opacity="0.75"
        />
        <path
          d="M 4 21 Q 8 17, 12 21 T 20 21 T 28 21"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke} strokeLinecap="round" fill="none" opacity="0.5"
        />
      </svg>

      {online && (
        <span
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2"
          style={{ borderColor: "#0b0a1f", boxShadow: "0 0 0 2px #0b0a1f" }}
          aria-hidden
        />
      )}
    </div>
  );
}

interface BrandLockupProps {
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  online?: boolean;
  className?: string;
}

export function BrandLockup({
  variant = "dark",
  size = "md",
  showTagline = true,
  online = false,
  className,
}: BrandLockupProps) {
  const dims = { sm: 32, md: 40, lg: 52 }[size];
  const titleSize = { sm: "14px", md: "16px", lg: "20px" }[size];
  const taglineSize = { sm: "9px", md: "10px", lg: "11px" }[size];

  const titleColor = variant === "dark" ? "text-white" : "text-slate-900";
  const taglineGradient = "gradient-text";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <BrandMark size={dims} online={online} />
      <div className="leading-tight">
        <div className={cn("heading-md tracking-tight", titleColor)} style={{ fontSize: titleSize }}>
          TheraFlow
        </div>
        {showTagline && (
          <div
            className={cn("uppercase tracking-[0.18em] font-bold mt-px", taglineGradient)}
            style={{ fontSize: taglineSize }}
          >
            Studio Hub
          </div>
        )}
      </div>
    </div>
  );
}
