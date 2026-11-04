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
          // Deep Navy Blue (Primary)
          navy: {
            50: '#F0F4F8',
            100: '#D9E2EC',
            800: '#102A43',
            900: '#0F172A',
            950: '#0A1128',
            DEFAULT: '#0A1128',
          },
          // Warm Yellow / Amber (Secondary)
          yellow: {
            50: '#FEF9C3',
            100: '#FEF08A',
            400: '#FACC15',
            500: '#FBBF24',
            600: '#F59E0B',
            DEFAULT: '#FBBF24',
          },
          // Accent Red
          red: {
            50: '#FEF2F2',
            500: '#EF4444',
            600: '#DC2626',
            DEFAULT: '#EF4444',
          },
          // Soft Cream / Warm Canvas
          cream: {
            50: '#FDFBF7',
            100: '#FBF9F5',
            200: '#F3EFE6',
            DEFAULT: '#FBF9F5',
          },
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
        'card': '0 4px 20px -2px rgba(10, 17, 40, 0.06)',
      },
    },
  },
  plugins: [],
}
