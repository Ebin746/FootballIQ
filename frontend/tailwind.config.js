/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0c2b22",
        "bg-elevated": "#123c2e",
        "bg-card": "#163f31",
        gold: "#d8b14c",
        "gold-soft": "rgba(216,177,76,0.16)",
        ivory: "#f4f1e8",
        muted: "#a9c2b6",
        coral: "#d1492f",
        "coral-soft": "rgba(209,73,47,0.16)",
        line: "rgba(244,241,232,0.12)",
      },
      fontFamily: {
        display: ["Oswald", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ['"Space Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
