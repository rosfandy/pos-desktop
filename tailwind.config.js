/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          foreground: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
