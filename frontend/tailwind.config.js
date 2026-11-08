/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#7563D9',
          hover: '#6552C5',
          cream: '#FFF8ED',
          lavender: '#E9E3FF',
          navy: '#303653',
          card: '#FFFCF7',
          peach: '#FFE5D6',
          mint: '#DDF3E7',
          sky: '#DFEDFF',
          coral: '#F28B82',
          border: '#EAE6E1',
          muted: '#85899B',
          success: '#42A879',
          warning: '#E8A447',
          danger: '#E87575',
          info: '#6398D6',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 20px rgba(48, 54, 83, 0.06)',
        'card-hover': '0 8px 30px rgba(48, 54, 83, 0.10)',
        'glow-indigo': '0 4px 16px rgba(117, 99, 217, 0.30)',
      },
    },
  },
  plugins: [],
}
