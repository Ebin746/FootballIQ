/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:           "#050d1a",
        "bg-elevated":"#0d1b2e",
        "bg-card":    "#111f35",
        "bg-glass":   "rgba(17,31,53,0.7)",
        gold:         "#f5c518",
        "gold-dim":   "#c89a12",
        "gold-soft":  "rgba(245,197,24,0.14)",
        ivory:        "#e8edf5",
        muted:        "#8ba3c2",
        coral:        "#e63946",
        "coral-soft": "rgba(230,57,70,0.15)",
        emerald:      "#00c896",
        "emerald-soft":"rgba(0,200,150,0.14)",
        line:         "rgba(245,197,24,0.13)",
      },
      fontFamily: {
        display: ["Oswald", "sans-serif"],
        body:    ["Inter", "sans-serif"],
        mono:    ['"Space Mono"', "monospace"],
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-400% center" },
          "100%": { backgroundPosition: "400% center" },
        },
        "float": {
          "0%,100%": { transform: "translateY(0px)" },
          "50%":     { transform: "translateY(-7px)" },
        },
        "pulse-gold": {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(245,197,24,0)" },
          "50%":     { boxShadow: "0 0 0 8px rgba(245,197,24,0.2)" },
        },
        "bounce-ball": {
          "0%,100%": { transform: "translateY(0) scaleY(1)" },
          "40%":     { transform: "translateY(-28px) scaleY(1.1)" },
          "60%":     { transform: "translateY(-22px) scaleY(1)" },
        },
        "reveal-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "bar-grow": {
          from: { width: "0%" },
          to:   { width: "var(--bar-w)" },
        },
        "champion-glow": {
          "0%,100%": { textShadow: "0 0 20px rgba(245,197,24,0.6)" },
          "50%":     { textShadow: "0 0 40px rgba(245,197,24,1), 0 0 80px rgba(245,197,24,0.5)" },
        },
      },
      animation: {
        shimmer:        "shimmer 3s linear infinite",
        float:          "float 3s ease-in-out infinite",
        "pulse-gold":   "pulse-gold 2s ease-in-out infinite",
        "bounce-ball":  "bounce-ball 0.9s ease-in-out infinite",
        "reveal-up":    "reveal-up 0.5s ease-out forwards",
        "champion-glow":"champion-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
