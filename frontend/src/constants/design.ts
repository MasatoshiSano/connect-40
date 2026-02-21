/**
 * Connect40 Design System Constants
 * Theme: モダン旅館 — 強羅花壇 × 翠嵐 inspired
 */

export const COLORS = {
  base: '#121110',
  baseSurface: '#1e1c1a',
  baseElevated: '#2a2725',
  gold: '#c4a56e',
  goldLight: '#8a6d3b',
  goldMuted: '#c4a56e40',
  warm: '#a3785a',
  greenSubtle: '#5a7a6a',
  bgLight: '#f5f0ea',
  surfaceLight: '#ffffff',
  elevatedLight: '#ebe5dd',
  textPrimary: '#2d2a26',
  textSecondary: '#6b6560',
  textMuted: '#78726c',
  textDarkPrimary: '#e8e2db',
  textDarkSecondary: '#bab4ac',
  textDarkMuted: '#958e85',
  borderLight: '#d4cdc4',
  borderDark: '#4d4740',
} as const;

export const FONTS = {
  serif: ['Noto Serif JP', 'serif'],
  sans: ['Noto Sans JP', 'sans-serif'],
} as const;

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const SPACING = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
  '4xl': '6rem',
} as const;

export const TRANSITIONS = {
  fast: '150ms',
  base: '400ms',
  slow: '600ms',
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
