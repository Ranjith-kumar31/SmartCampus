/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./frontend/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1",
        secondary: "#9333ea",
        accent: "#f59e0b",
        background: "#080b14",
        surface: "#0f1328",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
