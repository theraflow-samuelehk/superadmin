/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FBF8F3",
          100: "#F5F0E8",
          200: "#EDE5D6",
          300: "#E2D5BC",
        },
        sand: {
          400: "#C9B89A",
          500: "#A89678",
          600: "#7E6E54",
          700: "#5C4F3B",
        },
        rosegold: {
          DEFAULT: "#B7855E",
          light: "#D4A582",
          dark: "#8E6240",
        },
        mint: {
          DEFAULT: "#A9C4A8",
          light: "#C8DCC7",
          dark: "#7FA37D",
        },
        ink: {
          DEFAULT: "#2A2520",
          soft: "#4A413A",
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
      },
      letterSpacing: {
        widest: "0.25em",
      },
      animation: {
        "fade-up": "fadeUp 0.8s ease-out forwards",
        "fade-in": "fadeIn 1s ease-out forwards",
        "vapor": "vapor 4s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        vapor: {
          "0%, 100%": { opacity: 0.3, transform: "translateY(0) scale(1)" },
          "50%": { opacity: 0.6, transform: "translateY(-10px) scale(1.05)" },
        },
      },
    },
  },
  plugins: [],
};
