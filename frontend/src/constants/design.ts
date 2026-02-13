/**
 * Connect40 Design System Constants
 */

export const COLORS = {
  primary: '#19d4e6',
  bgDark: '#112021',
  surfaceDark: '#1a2c2e',
  bgLight: '#f6f8f8',
} as const;

export const FONTS = {
  sans: ['Plus Jakarta Sans', 'Noto Sans JP', 'sans-serif'],
} as const;

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const SPACING = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
} as const;

export const BORDER_RADIUS = {
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  full: '9999px',
} as const;

export const TRANSITIONS = {
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
} as const;

export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;
