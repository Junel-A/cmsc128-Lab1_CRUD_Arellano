/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'up-maroon': '#7B1113',
        'up-green': '#014421',
        'up-maroon-dark': '#5a0c0e', // deeper shade for hover effects
        'up-green-dark': '#013318',  
      }
    },
  },
  plugins: [],
}