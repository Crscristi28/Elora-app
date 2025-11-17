/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        elora: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#bae2ff',
          300: '#7cc9ff',
          400: '#36abff',
          500: '#0c8ce8',
          600: '#0071d1',
          700: '#005ba1',
          800: '#004d85',
          900: '#003d6b',
        },
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}