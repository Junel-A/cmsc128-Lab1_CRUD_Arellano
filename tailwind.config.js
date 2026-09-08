/** @type {import('tailwindcss').Config} */
export default {
  // Tells Tailwind to only apply styles to actual code files
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}