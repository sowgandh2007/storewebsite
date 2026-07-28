module.exports = {
  content: [
    "./index.html",
    "./js/customer.js"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#10b981', // emerald-500
          600: '#059669', // emerald-600
          700: '#047857', // emerald-700
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        dark: {
          800: '#1e293b',
          850: '#1b2330',
          900: '#0f172a',
          950: '#080d1a',
        }
      },
      zIndex: {
        '45': '45',
        '50': '50',
        '60': '60',
      }
    },
  },
  plugins: [],
}
