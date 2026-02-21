import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Ryokan-style palette
        base: {
          DEFAULT: '#121110',
          50: '#f5f0ea',
          100: '#ebe5dd',
          200: '#d4cdc4',
          800: '#1e1c1a',
          900: '#121110',
        },
        surface: {
          light: '#ffffff',
          dark: '#1e1c1a',
        },
        elevated: {
          light: '#ebe5dd',
          dark: '#2a2725',
        },
        gold: {
          DEFAULT: '#c4a56e',
          light: '#8a6d3b',
          muted: '#c4a56e40',
        },
        warm: '#a3785a',
        'green-subtle': '#5a7a6a',
        text: {
          primary: '#2d2a26',
          secondary: '#6b6560',
          muted: '#78726c',
          dark: {
            primary: '#e8e2db',
            secondary: '#bab4ac',
            muted: '#958e85',
          },
        },
        border: {
          light: '#d4cdc4',
          dark: '#4d4740',
        },
      },
      fontFamily: {
        serif: ['Noto Serif JP', 'serif'],
        sans: ['Noto Sans JP', 'sans-serif'],
      },
      letterSpacing: {
        ryokan: '0.12em',
        'ryokan-wide': '0.2em',
        'ryokan-brand': '0.3em',
      },
      borderRadius: {
        none: '0px',
        sm: '0px',
        DEFAULT: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '9999px',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      maxWidth: {
        ryokan: '64rem',
      },
      transitionDuration: {
        fast: '150ms',
        base: '400ms',
        slow: '600ms',
        luxe: '1200ms',
      },
      transitionTimingFunction: {
        elegant: 'cubic-bezier(0.25, 0.1, 0.25, 1.0)',
        luxe: 'cubic-bezier(0.4, 0, 0.2, 1)',
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
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.25, 0.1, 0.25, 1.0)',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.25, 0.1, 0.25, 1.0)',
        'stagger-in': 'fadeIn 0.6s cubic-bezier(0.25, 0.1, 0.25, 1.0) both',
        shimmer: 'shimmer 2s infinite',
        'ken-burns-a': 'kenBurnsA 12s ease-in-out forwards',
        'ken-burns-b': 'kenBurnsB 12s ease-in-out forwards',
        'ken-burns-c': 'kenBurnsC 12s ease-in-out forwards',
        'stagger-title': 'staggerReveal 0.9s cubic-bezier(0.25, 0.1, 0.25, 1) both',
        'stagger-sub': 'staggerReveal 0.9s cubic-bezier(0.25, 0.1, 0.25, 1) 0.3s both',
        'stagger-cta': 'staggerReveal 0.9s cubic-bezier(0.25, 0.1, 0.25, 1) 0.6s both',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        kenBurnsA: {
          from: { transform: 'translate(-2%, 0) scale(1.05)' },
          to:   { transform: 'translate(0, 0) scale(1.12)' },
        },
        kenBurnsB: {
          from: { transform: 'translate(2%, 0) scale(1.05)' },
          to:   { transform: 'translate(0, 0) scale(1.12)' },
        },
        kenBurnsC: {
          from: { transform: 'scale(1.05)' },
          to:   { transform: 'scale(1.12)' },
        },
        staggerReveal: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        progressFill: {
          from: { transform: 'scaleX(0)' },
          to:   { transform: 'scaleX(1)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
