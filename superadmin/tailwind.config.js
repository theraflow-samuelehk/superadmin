/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', "serif"],
        sans: ['"Manrope"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      colors: {
        ink: {
          950: "#050505",
          900: "#0a0a0a",
          850: "#0f0f10",
          800: "#141416",
          700: "#1d1d20",
          600: "#26262a",
          500: "#3a3a40",
          400: "#56565d",
          300: "#7a7a82",
          200: "#a0a0a8",
          100: "#cfcfd4",
          50:  "#f5f5f7",
        },
        acid: {
          DEFAULT: "#d4ff4f",
          dim: "#a8cc3f",
          bright: "#e6ff7a",
          deep: "#7d9b25",
        },
        warn: "#ffb347",
        bad: "#ff5d5d",
        good: "#7ee787",
      },
      letterSpacing: {
        "ultra-tight": "-0.04em",
        "monster": "-0.06em",
      },
      animation: {
        "fade-up": "fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "scan": "scan 4s linear infinite",
        "blink": "blink 1.2s steps(2) infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.2" },
        },
      },
    },
  },
  plugins: [],
};
