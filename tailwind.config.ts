import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "430px",
      },
      colors: {
        gold: "#D4AF37",
        /**
         * Encre / texte fort — noir neutre (plus de bleu marine #1A1A2E).
         * Les classes `text-navy`, `bg-navy`, etc. restent valides.
         */
        navy: "#0A0A0A",
        offwhite: "#FAFAFA",
        cream: "#F5F0E8",
        champagne: "#F0E6CE",
        sand: "#DDD5C4",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "blur-fade": {
          "0%":   { opacity: "0", filter: "blur(8px)" },
          "100%": { opacity: "1", filter: "blur(0)"   },
        },
        "line-draw": {
          "0%":   { transform: "scaleX(0)", transformOrigin: "left" },
          "100%": { transform: "scaleX(1)", transformOrigin: "left" },
        },
        "stagger-fade": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "gold-shimmer": {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          "0%":   { opacity: "0", transform: "translateX(32px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%":   { opacity: "0", transform: "translateX(-32px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%":       { transform: "translateX(-5px)" },
          "40%":       { transform: "translateX(5px)" },
          "60%":       { transform: "translateX(-3px)" },
          "80%":       { transform: "translateX(3px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out forwards",
        "fade-up-slow": "fade-up 0.8s ease-out forwards",
        shimmer: "shimmer 2s infinite linear",
        "blur-fade": "blur-fade 0.5s cubic-bezier(0.25,0.46,0.45,0.94) forwards",
        "fade-in-slow": "blur-fade 0.9s cubic-bezier(0.25,0.46,0.45,0.94) forwards",
        "line-draw": "line-draw 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
        "stagger-fade": "stagger-fade 0.5s ease-out forwards",
        "gold-shimmer": "gold-shimmer 2.5s linear infinite",
        "scale-in": "scale-in 0.3s ease-out forwards",
        "slide-in-right": "slide-in-right 0.28s cubic-bezier(0.25,0.46,0.45,0.94) forwards",
        "slide-in-left": "slide-in-left 0.28s cubic-bezier(0.25,0.46,0.45,0.94) forwards",
        shake: "shake 0.35s ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
