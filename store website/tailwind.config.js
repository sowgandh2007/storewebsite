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
          50:  '#faf6ee',
          100: '#f3ebdd',
          200: '#eae0cf',
          300: '#e2d6c0',
          400: '#a3907c',
          500: '#786854', // --text-muted
          550: '#665643',
          600: '#544737', // --text-secondary
          700: '#42372a',
          800: '#292219', // --text-primary
          850: '#eae0cf', // --border-light / warm cream border
          900: '#1c1610', // deep warm espresso
          950: '#120e0a',
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
