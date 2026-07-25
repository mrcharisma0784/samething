/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Playfair Display", "serif"],
        sans: ["Figtree", "sans-serif"],
      },
      colors: {
        ink:    "#0A0A0A",
        cream:  "#F5F0E8",
        sand:   "#C8B89A",
        muted:  "#6B6560",
        raised: "#1A1A1A",
        line:    "#2A2A2A",
        surface: "#141414",
      },
    },
  },
  plugins: [],
};
