module.exports = {
  content: [
    "./index.html",
    "./js/customer.js"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fffbe6',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          450: '#d97706',
          500: '#d97706', // warm amber-600
          600: '#b45309', // warm amber-700
          700: '#92400e', // warm amber-800
          800: '#78350f',
          850: '#78350f',
          900: '#451a03',
          950: '#290f02',
        },
        dark: {
          800: '#e2d6c0',
          850: '#eae0cf',
          900: '#f3ebdd',
          950: '#faf6ee',
        },
        slate: {
          850: '#eae0cf', // warm border color matching --border-light
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
