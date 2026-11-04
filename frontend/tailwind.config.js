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
            50: '#F4F6FB',
            100: '#E8ECF7',
            200: '#C5D0EB',
            700: '#1B2544',
            800: '#121A33',
            900: '#0C1327',
            950: '#080D1D',
            DEFAULT: '#0C1327',
          },
          yellow: {
            50: '#FFFBEB',
            100: '#FEF3C7',
            200: '#FDE68A',
            300: '#FCD34D',
            400: '#FBBF24',
            500: '#F59E0B',
            600: '#D97706',
            DEFAULT: '#FBBF24',
          },
          amber: {
            DEFAULT: '#FFB703',
            glow: '#F59E0B',
          },
          red: {
            50: '#FEF2F2',
            500: '#EF4444',
            600: '#DC2626',
            DEFAULT: '#EF4444',
          },
          cream: {
            50: '#FAF8F4',
            100: '#F5F1E8',
            200: '#EDE6D6',
            DEFAULT: '#FAF8F4',
          },
          surface: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02)',
        'card': '0 6px 24px -4px rgba(12, 19, 39, 0.06), 0 2px 8px -2px rgba(12, 19, 39, 0.03)',
        'card-hover': '0 16px 36px -6px rgba(12, 19, 39, 0.10), 0 4px 12px -2px rgba(12, 19, 39, 0.04)',
        'glow-yellow': '0 8px 24px -4px rgba(251, 191, 36, 0.35)',
        'glow-sm': '0 2px 10px rgba(251, 191, 36, 0.25)',
      },
      borderRadius: {
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
      },
    },
  },
  plugins: [],
}
