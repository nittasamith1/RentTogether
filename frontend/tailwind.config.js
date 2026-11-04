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
          navy: {
            DEFAULT: '#061C3D',
            950: '#061C3D',
            900: '#0A224A',
            800: '#0F2C5C',
          },
          yellow: {
            DEFAULT: '#FDBC1F',
            500: '#FDBC1F',
            600: '#E5A510',
            400: '#FED25B',
          },
          cream: {
            DEFAULT: '#FDFBF9',
            50: '#FDFBF9',
            100: '#FAF6F0',
          },
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.04)',
        'card': '0 6px 24px rgba(6, 28, 61, 0.05)',
        'card-hover': '0 12px 30px rgba(6, 28, 61, 0.09)',
        'glow-yellow': '0 4px 16px rgba(253, 188, 31, 0.35)',
      },
    },
  },
  plugins: [],
}
