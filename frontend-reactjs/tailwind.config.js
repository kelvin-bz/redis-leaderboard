/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'highlight': 'highlight 1s ease-in-out',
      },
      keyframes: {
        highlight: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: '#fde68a' },
        }
      }
    },
  },
  plugins: [],
}