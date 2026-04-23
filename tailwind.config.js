/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          950: '#070812',
          900: '#090a10',
          800: '#101124',
          700: '#171331',
          600: '#24204a',
          500: '#373062',
          400: '#5d5792',
        },
        accent: {
          DEFAULT: '#18d7d4',
          hover: '#10bfc0',
          light: '#78f7f3',
        },
        violetglow: {
          DEFAULT: '#6d28d9',
          light: '#a855f7',
        },
        green: { midi: '#22c55e' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
