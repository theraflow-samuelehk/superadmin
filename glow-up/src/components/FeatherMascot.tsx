import { motion } from "framer-motion";

/**
 * Cute blob/droplet AI guide mascot with big eyes.
 * Replaces the old feather while keeping the same component API.
 */
export function FeatherMascot({ size = 48, blinking = true }: { size?: number; blinking?: boolean }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
      animate={{ y: [0, -2, 0, 2, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <ellipse cx="32" cy="36" rx="22" ry="20" fill="hsl(var(--primary))" opacity={0.92} />
      <circle cx="32" cy="18" r="14" fill="hsl(var(--primary))" opacity={0.92} />
      <ellipse cx="26" cy="14" rx="5" ry="3.5" fill="hsl(var(--background))" opacity={0.35} />

      <circle cx="19" cy="30" r="4" fill="hsl(var(--primary))" opacity={0.35} />
      <circle cx="45" cy="30" r="4" fill="hsl(var(--primary))" opacity={0.35} />

      <g>
        <circle cx="25" cy="26" r="5" fill="hsl(var(--background))" />
        <circle cx="25" cy="26" r="3.5" fill="hsl(var(--foreground))" />
        <circle cx="26.5" cy="24.5" r="1.3" fill="hsl(var(--background))" />
        {blinking && (
          <motion.ellipse
            cx="25"
            cy="26"
            rx="5"
            ry="5"
            fill="hsl(var(--primary))"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: [0, 1, 0] }}
            transition={{ duration: 0.18, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }}
            style={{ transformOrigin: "25px 26px" }}
          />
        )}
      </g>

      <g>
        <circle cx="39" cy="26" r="5" fill="hsl(var(--background))" />
        <circle cx="39" cy="26" r="3.5" fill="hsl(var(--foreground))" />
        <circle cx="40.5" cy="24.5" r="1.3" fill="hsl(var(--background))" />
        {blinking && (
          <motion.ellipse
            cx="39"
            cy="26"
            rx="5"
            ry="5"
            fill="hsl(var(--primary))"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: [0, 1, 0] }}
            transition={{ duration: 0.18, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut", delay: 0.04 }}
            style={{ transformOrigin: "39px 26px" }}
          />
        )}
      </g>

      <path
        d="M27 33Q32 38 37 33"
        stroke="hsl(var(--foreground))"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />

      <g opacity={0.7}>
        <motion.path
          d="M50 10L51 13L54 14L51 15L50 18L49 15L46 14L49 13Z"
          fill="hsl(var(--background))"
          animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "50px 14px" }}
        />
      </g>
    </motion.svg>
  );
}
