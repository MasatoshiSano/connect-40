# UI Redesign: Modern Ryokan Style

**Date**: 2026-02-18
**Status**: Approved
**Approach**: B. Modern Ryokan (Gora Kadan × Suiran inspired)

## Design Philosophy

Transform Connect40's UI from a warm-toned web app into a refined, dark-based experience inspired by luxury Japanese ryokan websites. Prioritize visual elegance with generous whitespace, muted gold accents, and light-weight serif typography — while maintaining app usability.

## Reference Sites

- **Hoshinoya (星のや)**: Cinematic minimalism, full-screen dark heroes
- **Gora Kadan (強羅花壇)**: Refined minimalism, centered composition, ultra-clean navigation
- **Suiran (翠嵐)**: Elegant structure, vertical Japanese text, floating reservation bars
- **Hiiragiya (柊家)**: Warm tones through photography, calligraphic logo
- **Asaba (あさば)**: Dramatic night photography, vertical branding

## Color Palette

### Dark Mode (Default)

| Token | Value | Usage |
|-------|-------|-------|
| `bg-base` | `#121110` | Page background |
| `bg-surface` | `#1e1c1a` | Cards, surfaces |
| `bg-elevated` | `#2a2725` | Hover states, modals |
| `border` | `#3d3833` | Subtle borders |
| `border-accent` | `#c4a56e40` | Gold semi-transparent border |
| `text-primary` | `#e8e2db` | Primary text |
| `text-secondary` | `#9a948e` | Secondary text |
| `text-muted` | `#6b6560` | Muted text |
| `accent-gold` | `#c4a56e` | Primary accent (brand color) |
| `accent-warm` | `#a3785a` | Warm accent (terracotta) |
| `accent-green` | `#5a7a6a` | Subtle green (legacy teal) |

### Light Mode

| Token | Value | Usage |
|-------|-------|-------|
| `bg-base` | `#f5f0ea` | Page background |
| `bg-surface` | `#ffffff` | Cards, surfaces |
| `bg-elevated` | `#ebe5dd` | Hover states |
| `border` | `#d4cdc4` | Borders |
| `text-primary` | `#1e1c1a` | Primary text |
| `text-secondary` | `#6b6560` | Secondary text |
| `accent-gold` | `#8a6d3b` | Darker gold for contrast |

## Typography

### Headings — Noto Serif JP
- Weight: 300 (light)
- Letter-spacing: 0.12em (3x wider than current 0.04em)
- Line-height: 1.6
- English headings: uppercase + tracking-[0.2em]

### Body — Noto Sans JP
- Weight: 300-400
- Letter-spacing: 0.04em
- Line-height: 1.9

### Logo / Brand
- Noto Serif JP, tracking-[0.3em], font-light

### Special
- Section labels: uppercase, tracking-[0.25em], text-xs, gold color
- Page titles: text-3xl md:text-4xl, font-light, tracking-[0.12em]

## Layout & Spacing

### Container
- Max width: `max-w-5xl` (reduced from max-w-6xl)
- Section padding: `py-20 md:py-28`
- Page top padding: `pt-32` (header 80px + generous space)

### Grid
- Activity list: 1col (mobile) / 2col (tablet+) — reduced from 3col
- Card internal padding: `p-6 md:p-8`
- Gap: `gap-6 md:gap-8`

### Header
- Height: 80px
- Background: transparent → scroll to `bg-[#121110]/90 backdrop-blur-md`
- Logo: left-aligned, gold color
- Nav: right-aligned, minimal text, tracking-widest

### Footer
- Single column centered layout (simplified from 4-column)
- Minimal links only

## Component Design

### Buttons
- **Primary**: `bg-transparent border border-gold text-gold` → hover: `bg-gold/10`
- **Secondary**: text link style with underline-offset
- **Danger**: text-accent-warm only
- Border-radius: `rounded-none` (completely sharp)

### Cards
- Background: `bg-surface`
- Border: `border border-border`
- Hover: `border-gold/40`, `translateY(-2px)`
- Border-radius: `rounded-none`
- Shadow: none
- Padding: `p-8`

### Form Inputs
- Background: `bg-transparent`
- Border: bottom-only `border-b border-border`
- Focus: `border-b-gold`
- Border-radius: none
- Padding: `py-3`

### Chat Bubbles
- Own: `bg-[#2a2725] text-primary rounded-sm`
- Other: `bg-transparent border border-border rounded-sm`

## Animation & Transitions

### Base
- Duration: 400ms (slowed from 250ms)
- Timing: `cubic-bezier(0.25, 0.1, 0.25, 1.0)` — elegant ease

### Page Entry
- Fade-in: opacity 0→1, translateY(8px)→0, 0.6s
- Stagger: children at 0.08s intervals

### Scroll
- Intersection Observer based fade-in
- Threshold: 0.1

### Hover
- Cards: border-color 400ms, transform 400ms
- Buttons: background-color 300ms
- Links: opacity 0.6 → 1.0, 300ms

## Summary of Changes

| Element | Before | After |
|---------|--------|-------|
| Base color | Warm off-white (#f5efe9) | Dark charcoal (#121110) |
| Accent | Teal + terracotta | Muted gold (#c4a56e) |
| Border-radius | 2px | 0px (completely sharp) |
| Letter-spacing | 0.04em | 0.12em (headings) |
| Font weight | 300-700 mixed | 300 primary (light) |
| Navigation | Standard header | Transparent → blur on scroll |
| Card grid | 3 columns | 2 columns (whitespace priority) |
| Buttons | Filled | Outline (gold) |
| Inputs | Full border | Bottom border only |
| Animation speed | 250ms | 400ms |
| Footer | 4-column grid | Single column centered |
