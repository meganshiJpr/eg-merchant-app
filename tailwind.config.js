/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        page: "var(--page)",
        surface: { DEFAULT: "var(--surface)", 2: "var(--surface-2)" },
        border: "var(--border)",
        text: { 1: "var(--text-1)", 2: "var(--text-2)", 3: "var(--text-3)" },
        primary: { DEFAULT: "var(--primary)", soft: "var(--primary-soft)" },
        accent: { DEFAULT: "var(--accent)", soft: "var(--accent-soft)" },
        teal: { DEFAULT: "var(--teal)", soft: "var(--teal-soft)" },
        orange: { DEFAULT: "var(--orange)", soft: "var(--orange-soft)" },
        violet: { DEFAULT: "var(--violet)", soft: "var(--violet-soft)" },
      },
      fontFamily: {
        display: ["var(--font-sora)"],
        body: ["var(--font-plex)"],
        mono: ["var(--font-plex-mono)"],
      },
      maxWidth: { app: "420px" },
    },
  },
  plugins: [],
};

export default config;
