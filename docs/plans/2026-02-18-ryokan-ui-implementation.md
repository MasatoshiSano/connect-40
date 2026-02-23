# Ryokan UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Connect40's UI from a warm-toned light web app into a refined, dark-based luxury ryokan experience with muted gold accents and generous whitespace.

**Architecture:** Update the design foundation (Tailwind config, CSS variables, design constants) first, then update layout components (Header/Footer), then UI primitives (Button, Cards, Inputs), and finally all page components. Tasks 2-6 can be parallelized after Task 1 completes.

**Tech Stack:** React, TailwindCSS, Noto Serif JP / Noto Sans JP

**Design Reference:** `docs/plans/2026-02-18-ryokan-ui-redesign.md`

---

## Dependency Graph

```
Task 1 (Foundation)
  ├── Task 2 (Layout: Header + Footer)
  ├── Task 3 (UI Components: Button, Card, Chat, Input)
  │     ├── Task 4 (Pages: Home, Auth)
  │     ├── Task 5 (Pages: Dashboard, Activities)
  │     └── Task 6 (Pages: Chat, Profile, Subscription, NotFound)
```

Tasks 2 & 3 can run in parallel after Task 1.
Tasks 4, 5 & 6 can run in parallel after Tasks 2 & 3.

---

### Task 1: Design Foundation — Tailwind, CSS Variables, Design Constants

**Files:**
- Modify: `frontend/tailwind.config.ts`
- Modify: `frontend/src/constants/design.ts`
- Modify: `frontend/src/index.css`

**Step 1: Update `frontend/tailwind.config.ts`**

Replace the entire color, borderRadius, animation, and transition config:

```typescript
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
        green: {
          subtle: '#5a7a6a',
        },
        text: {
          primary: '#2d2a26',
          secondary: '#6b6560',
          muted: '#9a948e',
          dark: {
            primary: '#e8e2db',
            secondary: '#9a948e',
            muted: '#6b6560',
          },
        },
        border: {
          light: '#d4cdc4',
          dark: '#3d3833',
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
        'ryokan': '64rem', // 1024px, narrower container
      },
      transitionDuration: {
        fast: '150ms',
        base: '400ms',
        slow: '600ms',
      },
      transitionTimingFunction: {
        elegant: 'cubic-bezier(0.25, 0.1, 0.25, 1.0)',
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
      },
    },
  },
  plugins: [],
} satisfies Config;
```

**Step 2: Update `frontend/src/constants/design.ts`**

```typescript
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
  textMuted: '#9a948e',
  textDarkPrimary: '#e8e2db',
  textDarkSecondary: '#9a948e',
  textDarkMuted: '#6b6560',
  borderLight: '#d4cdc4',
  borderDark: '#3d3833',
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
```

**Step 3: Update `frontend/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --gold: #c4a56e;
    --gold-light: #8a6d3b;
    --gold-muted: #c4a56e40;
    --base: #121110;
    --base-surface: #1e1c1a;
    --base-elevated: #2a2725;
    --warm: #a3785a;
    --green-subtle: #5a7a6a;
    --bg-light: #f5f0ea;
    --surface-light: #ffffff;
    --elevated-light: #ebe5dd;
    --text-primary: #2d2a26;
    --text-secondary: #6b6560;
    --border-light: #d4cdc4;
    --border-dark: #3d3833;
  }

  * {
    @apply border-border-light dark:border-border-dark;
  }

  body {
    @apply bg-base-50 dark:bg-base text-text-primary dark:text-text-dark-primary;
    @apply font-sans antialiased;
    letter-spacing: 0.04em;
    line-height: 1.9;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-serif font-light;
    letter-spacing: 0.12em;
    line-height: 1.6;
  }

  /* Elegant scrollbar */
  ::-webkit-scrollbar {
    width: 4px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: #3d3833;
    border-radius: 0;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #504a44;
  }

  .dark ::-webkit-scrollbar-thumb {
    background: #3d3833;
  }

  .dark ::-webkit-scrollbar-thumb:hover {
    background: #504a44;
  }
}

@layer components {
  /* Ryokan card style */
  .card {
    @apply bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark;
    @apply transition-all duration-base ease-elegant;
  }

  .card-hover {
    @apply hover:border-gold/40 dark:hover:border-gold/40;
    @apply hover:-translate-y-0.5;
  }

  /* Ryokan input style - bottom border only */
  .input {
    @apply w-full py-3 bg-transparent;
    @apply border-b border-border-light dark:border-border-dark border-t-0 border-l-0 border-r-0;
    @apply focus:border-b-gold focus:outline-none;
    @apply text-text-primary dark:text-text-dark-primary;
    @apply placeholder:text-text-muted dark:placeholder:text-text-dark-muted;
    @apply transition-all duration-fast;
  }

  /* Ryokan primary button - gold outline */
  .btn-primary {
    @apply px-8 py-3 bg-transparent text-gold border border-gold;
    @apply hover:bg-gold/10 active:bg-gold/20;
    @apply transition-all duration-base ease-elegant;
    @apply font-light tracking-ryokan;
  }

  /* Ghost/text button */
  .btn-ghost {
    @apply px-4 py-2 text-text-secondary dark:text-text-dark-secondary;
    @apply hover:text-text-primary dark:hover:text-text-dark-primary;
    @apply transition-all duration-base ease-elegant;
    @apply font-light tracking-wide underline-offset-4;
  }

  /* Section divider */
  .divider {
    @apply border-t border-border-light dark:border-border-dark;
  }

  /* Section label (CONCEPT, FEATURES, etc.) */
  .section-label {
    @apply text-xs tracking-ryokan-wide text-gold uppercase font-light;
  }

  /* Page title */
  .page-title {
    @apply font-serif font-light text-3xl md:text-4xl tracking-ryokan;
    @apply text-text-primary dark:text-text-dark-primary;
  }

  /* Scroll fade-in animation helper */
  .scroll-fade-in {
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.6s cubic-bezier(0.25, 0.1, 0.25, 1.0),
                transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1.0);
  }

  .scroll-fade-in.visible {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Step 4: Verify build compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No type errors

**Step 5: Commit**

```bash
git add frontend/tailwind.config.ts frontend/src/constants/design.ts frontend/src/index.css
git commit -m "feat: update design foundation for ryokan UI redesign"
```

---

### Task 2: Layout Components — Header & Footer

**Files:**
- Modify: `frontend/src/components/layout/Header.tsx`
- Modify: `frontend/src/components/layout/Footer.tsx`

**Depends on:** Task 1

**Step 1: Rewrite Header with transparent-to-blur effect**

Key changes:
- Background: transparent → on scroll, `bg-[#121110]/90 backdrop-blur-md`
- Height: 72px → 80px
- Logo: white → gold color, wider tracking
- Nav links: lighter weight, wider tracking, `tracking-ryokan-wide`
- Login button: gold outline instead of white outline
- Dropdown: `bg-[#1e1c1a]` background, gold hover accents
- Add `useEffect` with scroll listener to toggle `isScrolled` state
- Mobile menu: same dark styling but with gold accents

**Step 2: Rewrite Footer as single-column centered**

Key changes:
- Remove 4-column grid
- Single column, centered text
- Logo at top: `font-serif text-gold tracking-ryokan-brand`
- Minimal links in a horizontal row
- Copyright at bottom
- More vertical spacing

**Step 3: Verify build and visual check**

Run: `cd frontend && npx tsc --noEmit`

**Step 4: Commit**

```bash
git add frontend/src/components/layout/Header.tsx frontend/src/components/layout/Footer.tsx
git commit -m "feat: redesign Header and Footer for ryokan style"
```

---

### Task 3: UI Components — Button, ActivityCard, MessageBubble, MessageInput

**Files:**
- Modify: `frontend/src/components/ui/Button.tsx`
- Modify: `frontend/src/components/activities/ActivityCard.tsx`
- Modify: `frontend/src/components/chat/MessageBubble.tsx`
- Modify: `frontend/src/components/chat/MessageInput.tsx`

**Depends on:** Task 1

**Step 1: Update Button component**

New variant classes:
```typescript
const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-transparent border border-gold text-gold hover:bg-gold/10 active:bg-gold/20',
  secondary: 'text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary underline underline-offset-4',
  outline: 'border border-border-light dark:border-border-dark text-text-primary dark:text-text-dark-primary hover:border-gold/40',
  ghost: 'text-text-secondary dark:text-text-dark-secondary hover:text-gold transition-opacity',
  danger: 'text-warm hover:text-warm/80',
};
```

Remove `rounded` from the base className (since all borderRadius is now 0).
Change `font-medium` to `font-light`.
Add `tracking-ryokan` to base className.
Change `transition` to `transition-all duration-base ease-elegant`.

**Step 2: Update ActivityCard**

Key changes:
- Remove `rounded` (now 0px globally)
- Hover: `hover:border-gold/40 hover:-translate-y-0.5`
- Category badge: remove `rounded-full`, use border style instead: `border border-gold/30 text-gold text-xs px-3 py-1`
- Title: change `font-semibold` → `font-light text-xl tracking-wide font-serif`
- Padding: `p-6` → `p-8`
- Host avatar: use gold accent instead of primary
- Tags: dark subtle styling with border

**Step 3: Update MessageBubble**

Key changes:
- Own messages: `bg-elevated-dark text-text-dark-primary` (no more primary color fill)
- Other messages: `bg-transparent border border-border-dark`
- Remove all `rounded-2xl`, use minimal rounding
- System message: remove `rounded-full`, use `border-b` divider style

**Step 4: Update MessageInput**

Key changes:
- Container: `bg-surface-dark` → `bg-base` with top border
- Textarea: transparent background, `border-b` only, gold focus
- Send button: gold outline style instead of filled primary
- Remove `rounded-lg` from all elements

**Step 5: Verify build**

Run: `cd frontend && npx tsc --noEmit`

**Step 6: Commit**

```bash
git add frontend/src/components/ui/Button.tsx frontend/src/components/activities/ActivityCard.tsx frontend/src/components/chat/MessageBubble.tsx frontend/src/components/chat/MessageInput.tsx
git commit -m "feat: redesign UI components for ryokan style"
```

---

### Task 4: Pages — Home & Auth (Login, SignUp, VerifyEmail)

**Files:**
- Modify: `frontend/src/pages/Home.tsx`
- Modify: `frontend/src/pages/auth/Login.tsx`
- Modify: `frontend/src/pages/auth/SignUp.tsx`
- Modify: `frontend/src/pages/auth/VerifyEmail.tsx`

**Depends on:** Tasks 1, 2, 3

**Step 1: Redesign Home.tsx**

Key changes:
- Hero: full-screen `bg-base` (pure dark), remove gradient. Huge serif text with `tracking-ryokan`. Gold divider line below title.
- CTA buttons: gold outline style (primary: gold border, secondary: white/30 border)
- Concept section: `bg-base` dark background, gold `section-label`, wider spacing
- Features section: `bg-surface-dark` background, gold icons instead of primary, much wider gaps
- Steps section: numbers in `text-gold/20` instead of `text-primary/20`
- CTA section: full dark with gold outline button
- Add scroll-fade-in animations to each section using Intersection Observer
- Remove `text-primary` references, replace with `text-gold`

**Step 2: Redesign Login.tsx**

Key changes:
- Background: `bg-base dark:bg-base` (always dark, no light mode variation on this page)
- Card: `bg-surface-dark border border-border-dark` (dark card)
- Logo: `text-gold tracking-ryokan-brand`
- Inputs: bottom-border-only style (`border-b border-border-dark` + `focus:border-b-gold`)
- Submit button: gold outline
- Links: `text-gold` instead of `text-primary`
- Remove `rounded-xl` from card

**Step 3: Redesign SignUp.tsx (same pattern as Login)**

Apply identical styling pattern as Login.

**Step 4: Redesign VerifyEmail.tsx**

Apply dark base styling. Gold accents for the verification icon and message.

**Step 5: Verify build**

Run: `cd frontend && npx tsc --noEmit`

**Step 6: Commit**

```bash
git add frontend/src/pages/Home.tsx frontend/src/pages/auth/Login.tsx frontend/src/pages/auth/SignUp.tsx frontend/src/pages/auth/VerifyEmail.tsx
git commit -m "feat: redesign Home and Auth pages for ryokan style"
```

---

### Task 5: Pages — Dashboard & Activities

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx`
- Modify: `frontend/src/pages/activities/Activities.tsx`
- Modify: `frontend/src/pages/activities/ActivityDetail.tsx`
- Modify: `frontend/src/pages/activities/CreateActivity.tsx`

**Depends on:** Tasks 1, 2, 3

**Step 1: Redesign Dashboard.tsx**

Key changes:
- Container: `max-w-5xl` (narrower)
- Page title: `page-title` class + gold greeting
- Stats cards: `bg-surface-dark border-border-dark`, icon circles use `bg-gold/10` with gold icons
- Numbers: `text-gold` for stat values
- "新規作成" button: gold outline
- Empty states: gold icon + gold outline CTA
- Overall padding increased: `py-12` → `py-20`

**Step 2: Redesign Activities.tsx (list page)**

Key changes:
- `max-w-5xl` container
- Search input: bottom-border style
- Filter buttons/dropdowns: minimal border style with gold active state
- Grid: `md:grid-cols-2` (reduced from 3)
- Wider gaps between cards
- "アクティビティを作成" button: gold outline

**Step 3: Redesign ActivityDetail.tsx**

Key changes:
- Dark surface background
- Title in `font-serif font-light tracking-ryokan`
- Metadata with gold icons
- "参加する" button: gold outline prominent
- Tags: `border border-gold/20 text-gold`

**Step 4: Redesign CreateActivity.tsx**

Key changes:
- All inputs: bottom-border style
- Labels: `text-xs tracking-ryokan-wide uppercase text-text-dark-secondary`
- Submit button: gold outline
- Card/form container: `bg-surface-dark`

**Step 5: Verify build**

Run: `cd frontend && npx tsc --noEmit`

**Step 6: Commit**

```bash
git add frontend/src/pages/Dashboard.tsx frontend/src/pages/activities/
git commit -m "feat: redesign Dashboard and Activity pages for ryokan style"
```

---

### Task 6: Pages — Chat, Profile, Subscription, NotFound

**Files:**
- Modify: `frontend/src/pages/chat/ChatList.tsx`
- Modify: `frontend/src/pages/chat/ChatRoom.tsx`
- Modify: `frontend/src/pages/profile/CreateProfileStep1.tsx`
- Modify: `frontend/src/pages/profile/CreateProfileStep2.tsx`
- Modify: `frontend/src/pages/profile/CreateProfileStep3.tsx`
- Modify: `frontend/src/pages/profile/CreateProfileSuccess.tsx`
- Modify: `frontend/src/pages/profile/EditProfile.tsx`
- Modify: `frontend/src/components/profile/ProfileCreationLayout.tsx`
- Modify: `frontend/src/pages/subscription/Plans.tsx`
- Modify: `frontend/src/pages/subscription/Success.tsx`
- Modify: `frontend/src/pages/NotFound.tsx`

**Depends on:** Tasks 1, 2, 3

**Step 1: Redesign ChatList.tsx**

Key changes:
- `bg-base` background
- Chat room items: `bg-surface-dark border-border-dark`, hover with gold accent
- Last message preview: `text-text-dark-secondary`
- Timestamp: `text-text-dark-muted`

**Step 2: Redesign ChatRoom.tsx**

Key changes:
- Header bar: `bg-surface-dark border-b border-border-dark`
- Messages area: `bg-base`
- Input area: already handled by MessageInput component

**Step 3: Redesign Profile pages (5 files + layout)**

Key changes for ProfileCreationLayout:
- Progress bar: gold fill instead of primary
- Step indicators: gold active color
- Container: dark background

Apply to all 3 steps + success page:
- All inputs: bottom-border style
- Labels: tracking-wide, uppercase, small
- Buttons: gold outline
- Success page: gold checkmark icon

**Step 4: Redesign EditProfile.tsx**

Same pattern as profile creation but in edit mode.

**Step 5: Redesign subscription/Plans.tsx**

Key changes:
- Plan cards: `bg-surface-dark border-border-dark`
- Recommended plan: `border-gold`
- Price numbers: `text-gold text-4xl font-serif font-light`
- CTA buttons: gold outline

**Step 6: Redesign subscription/Success.tsx**

Gold checkmark, dark background, minimal text.

**Step 7: Redesign NotFound.tsx**

Minimal dark page with "404" in large serif gold text.

**Step 8: Verify build**

Run: `cd frontend && npx tsc --noEmit`

**Step 9: Commit**

```bash
git add frontend/src/pages/chat/ frontend/src/pages/profile/ frontend/src/components/profile/ frontend/src/pages/subscription/ frontend/src/pages/NotFound.tsx
git commit -m "feat: redesign Chat, Profile, Subscription, and NotFound pages for ryokan style"
```

---

## Parallel Execution Strategy

For team-based execution:

```
Agent 1: Task 1 (Foundation) → Task 4 (Home & Auth pages)
Agent 2: (waits for Task 1) → Task 2 (Header/Footer) + Task 5 (Dashboard & Activities)
Agent 3: (waits for Task 1) → Task 3 (UI Components) + Task 6 (Chat, Profile, etc.)
```

After all agents complete, run full build verification:
```bash
cd frontend && npx tsc --noEmit && npm run build
```
