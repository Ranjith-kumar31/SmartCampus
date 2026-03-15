/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./frontend/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1A3A5A", // Deep Navy Blue
        secondary: "#00AEEF", // Cyan/Sky Blue
        accent: "#00AEEF",
        background: "#FFFFFF",
        surface: "#F8FAFC",
        dark: "#0F172A",
      },
      fontFamily: {
        sans: ['Montserrat', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
