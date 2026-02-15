import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#19d4e6',
          50: '#f0fcfd',
          100: '#d6f7fa',
          200: '#b3eff5',
          300: '#19d4e6',
          400: '#16bcd0',
          500: '#13a5b8',
          600: '#108d9f',
          700: '#0d7687',
          800: '#0a5e6e',
          900: '#074756',
        },
        bg: {
          light: '#f6f8f8',
          dark: '#112021',
        },
        surface: {
          light: '#ffffff',
          dark: '#1a2c2e',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Noto Sans JP', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
      },
      zIndex: {
        dropdown: '1000',
        sticky: '1020',
        fixed: '1030',
        'modal-backdrop': '1040',
        modal: '1050',
        popover: '1060',
        tooltip: '1070',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        shimmer: 'shimmer 2s infinite',
      },
      keyframes: {
        slideInRight: {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
