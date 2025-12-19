/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/components/**/*.{js,vue,ts}",
    "./app/layouts/**/*.vue",
    "./app/pages/**/*.vue",
    "./app/plugins/**/*.{js,ts}",
    "./app/app.vue",
    "./app/error.vue"
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Noto Sans", "Ubuntu", "Cantarell", "Helvetica Neue", "Arial", "sans-serif"],
      },
      colors: {
        zaccGold: "#d4af37",
        zaccBlack: "#111111",
        zaccGreen: "#209341",
        zaccYellow: "#f9c61b",
        zaccYellow2: "#fac724",
      },
      boxShadow: {
        glow: "0 10px 30px -10px rgba(212,175,55,0.35)",
        card: "0 10px 25px -10px rgba(0,0,0,0.4)",
      },
      backgroundImage: {
        heroGrid: "radial-gradient(ellipse at top, rgba(32,147,65,0.08), transparent 60%), radial-gradient(ellipse at bottom, rgba(212,175,55,0.10), transparent 60%)",
      },
    },
  },
  plugins: [],
}
