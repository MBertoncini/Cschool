/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        chess: {
          dark: '#769656',
          light: '#eeeed2',
          surface: '#262421',
          surfaceLight: '#302e2b',
          card: '#1e1c18',
          accent: '#81b64c',
          gold: '#f0c040',
        }
      }
    },
  },
  plugins: [],
}
