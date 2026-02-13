import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#19d4e6',
        'bg-dark': '#112021',
        'surface-dark': '#1a2c2e',
        'bg-light': '#f6f8f8',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Noto Sans JP', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
