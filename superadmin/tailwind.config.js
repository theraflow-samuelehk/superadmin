/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', "sans-serif"],
        sans: ['"Geist"', "sans-serif"],
        mono: ['"Geist Mono"', "monospace"],
      },
      colors: {
        // Slate scale — main neutral
        slate: {
          25: "#fcfcfd",
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        // Violet — primary accent
        violet: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        // Fuchsia/Pink — gradient partner
        fuchsia: {
          400: "#e879f9",
          500: "#d946ef",
          600: "#c026d3",
        },
        pink: {
          400: "#f472b6",
          500: "#ec4899",
          600: "#db2777",
        },
        // Status colors
        emerald: {
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
        },
        amber: {
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        rose: {
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
        },
        sky: {
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
        },
      },
      letterSpacing: {
        "ultra-tight": "-0.025em",
        "monster": "-0.045em",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "20px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(15, 23, 42, 0.04)",
        card: "0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03)",
        lift: "0 4px 24px -6px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.04)",
        glow: "0 8px 32px -8px rgba(139, 92, 246, 0.35)",
        pop: "0 1px 0 rgba(255,255,255,0.5) inset, 0 1px 2px rgba(15,23,42,0.08), 0 8px 24px -8px rgba(139, 92, 246, 0.45)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
        "brand-gradient-hover": "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)",
        "brand-soft": "linear-gradient(135deg, #ede9fe 0%, #fce7f3 100%)",
        "mesh-bg": `
          radial-gradient(at 0% 0%, rgba(196, 181, 253, 0.25) 0px, transparent 50%),
          radial-gradient(at 100% 0%, rgba(244, 114, 182, 0.18) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(125, 211, 252, 0.18) 0px, transparent 50%),
          radial-gradient(at 0% 100%, rgba(167, 139, 250, 0.15) 0px, transparent 50%)
        `,
      },
      animation: {
        "fade-up": "fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "blink": "blink 1.4s steps(2) infinite",
        "shimmer": "shimmer 2.5s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
