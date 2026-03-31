import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
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
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out forwards",
        "fade-up-slow": "fade-up 0.8s ease-out forwards",
        shimmer: "shimmer 2s infinite linear",
        "blur-fade": "blur-fade 0.5s cubic-bezier(0.25,0.46,0.45,0.94) forwards",
        "fade-in-slow": "blur-fade 0.9s cubic-bezier(0.25,0.46,0.45,0.94) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
