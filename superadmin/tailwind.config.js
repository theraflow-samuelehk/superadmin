/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', "serif"],
        sans: ['"Inter Tight"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      colors: {
        // Paper: warm off-white scale for backgrounds (NEW)
        paper: {
          50:  "#fbf9f4",  // body bg, warm cream
          100: "#f6f2ea",  // sunken panels
          150: "#f0eadf",
          200: "#e9e2d2",  // hairlines, soft chips
          300: "#dcd2bd",
          400: "#c2b594",
          500: "#a59676",
        },
        // Ink: text scale (semantic: dark text)
        ink: {
          50:  "#9a9489",   // very dim metadata
          100: "#7a7468",   // metadata
          200: "#5e5848",   // body secondary
          300: "#473f30",
          400: "#2e2820",   // body strong
          500: "#1f1a14",
          600: "#15110c",
          700: "#0e0b08",
          800: "#070504",
          900: "#0a0805",   // pure title
          950: "#000000",
        },
        // Accent: Mont Blanc deep ink blue (premium primary)
        accent: {
          DEFAULT: "#1a2548",
          dim: "#262f54",
          bright: "#2c3870",
          deep: "#0f1830",
        },
        // Lacquer: Chinese red — used VERY sparingly for primary CTAs
        lacquer: {
          DEFAULT: "#a62b1f",
          bright: "#c43a2c",
          deep: "#7a1f17",
        },
        // Sage: muted green for positive status
        sage: {
          DEFAULT: "#5a6f4a",
          bright: "#6e8559",
          deep: "#3f4f33",
        },
        // Saffron: warm gold for warnings (replaces harsh orange)
        saffron: {
          DEFAULT: "#b8842a",
          bright: "#d09a3b",
        },
        // status legacy aliases
        good: "#5a6f4a",
        warn: "#b8842a",
        bad: "#a62b1f",
      },
      letterSpacing: {
        "ultra-tight": "-0.025em",
        "monster": "-0.04em",
      },
      boxShadow: {
        soft: "0 1px 0 0 rgba(20, 18, 13, 0.04), 0 4px 12px -4px rgba(20, 18, 13, 0.06)",
        lift: "0 2px 0 0 rgba(20, 18, 13, 0.05), 0 12px 32px -12px rgba(20, 18, 13, 0.18)",
        accent: "0 1px 0 0 rgba(26, 37, 72, 0.12), 0 8px 24px -8px rgba(26, 37, 72, 0.28)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "blink": "blink 1.4s steps(2) infinite",
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
      },
    },
  },
  plugins: [],
};
