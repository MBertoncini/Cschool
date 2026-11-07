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
        wood: {
          950: '#130e0b', // Deepest dark timber
          900: '#1a130f', // Base background
          850: '#211813', // Recessed wells / trays
          800: '#291e17', // Surface / Card base
          750: '#32251d', // Raised card surface
          700: '#3e2e23', // Border / Muted rim
          650: '#4c392c', // Active / Highlighted rim
          600: '#5a4435', // Accent timber
          500: '#735743', // Warm timber midtone
          400: '#94745b', // Subdued timber text
          300: '#b8987d', // Secondary parchment text
          200: '#d9c2aa', // Primary parchment text
          100: '#ede0d2', // Crisp ivory
          50: '#fbf7f2',
        },
        brass: {
          light: '#f5d68d',
          DEFAULT: '#cf9b48',
          dark: '#9c6f27',
          glow: '#e8bd63',
          border: '#b88435',
        },
        board: {
          light: '#e6d6b8',
          dark: '#8b5229',
          border: '#352419',
          frame: '#26180f',
          highlight: '#cfa244',
          check: '#992222',
        },
        chess: {
          dark: '#8b5229',
          light: '#e6d6b8',
          surface: '#1a130f',
          surfaceLight: '#291e17',
          card: '#211813',
          accent: '#cf9b48',
          gold: '#dfa84f',
        }
      },
      fontFamily: {
        serif: ['"Cinzel"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'wood-raised': '4px 5px 12px rgba(8, 6, 4, 0.75), -2px -2px 6px rgba(255, 240, 220, 0.04)',
        'wood-raised-lg': '8px 10px 24px rgba(8, 6, 4, 0.8), -3px -3px 10px rgba(255, 240, 220, 0.05)',
        'wood-inset': 'inset 3px 3px 6px rgba(5, 4, 3, 0.85), inset -2px -2px 5px rgba(255, 240, 220, 0.035)',
        'wood-inset-deep': 'inset 4px 4px 10px rgba(4, 3, 2, 0.95), inset -2px -2px 6px rgba(255, 240, 220, 0.03)',
        'wood-pill': '2px 3px 6px rgba(8, 6, 4, 0.65), -1px -1px 3px rgba(255, 240, 220, 0.05)',
        'wood-pill-inset': 'inset 2px 2px 4px rgba(5, 4, 3, 0.75), inset -1px -1px 3px rgba(255, 240, 220, 0.03)',
        'brass-raised': '2px 3px 8px rgba(8, 6, 4, 0.6), -1px -1px 4px rgba(255, 240, 200, 0.28)',
      }
    },
  },
  plugins: [],
}
