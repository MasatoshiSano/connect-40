# Hero Carousel Redesign — Luxury Brand Style

Date: 2026-02-21
Status: Approved

## Overview

Redesign the home hero carousel to match a high-end adult lifestyle brand aesthetic (Hoshino Resort / luxury hotel tier). Key goals: richer ambient feel via video, smoother transitions, more refined navigation.

## Slide Composition

| Slot | Type | Source |
|------|------|--------|
| Slide 1 | Looping ambient video | Pexels API (new) |
| Slides 2–5 | Static image + Ken Burns | Unsplash API (existing) |

### Video Queries (Pexels)
One video selected from these queries (first successful result):
- `"japanese mountain nature ambient"`
- `"sake japanese bar evening"`
- `"tokyo lifestyle adult"`

New env var required: `VITE_PEXELS_API_KEY`

### Ken Burns Variations (per image slide, assigned by index)
- **A**: pan right + slow zoom in — `translate(-2%, 0) scale(1.05)` → `translate(0, 0) scale(1.12)`
- **B**: pan left + slow zoom in — `translate(2%, 0) scale(1.05)` → `translate(0, 0) scale(1.12)`
- **C**: center zoom in — `scale(1.05)` → `scale(1.12)`

Duration: 12 seconds (longer than any single slide interval to avoid loop reset).

## Transitions

### Crossfade
- Duration: **1200ms** (up from 600ms)
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` — added as `ease-luxe` to tailwind config

### Text Staggered Reveal
Per-slide, triggered each time `currentIndex` changes:

| Element | Delay | Animation |
|---------|-------|-----------|
| Title | 0ms | fade-in + slide-up 8px |
| Subtitle | 300ms | fade-in + slide-up 8px |
| CTA buttons | 600ms | fade-in + slide-up 8px |

Uses `animation-fill-mode: both`. Replaces the current single `animate-fade-in` wrapper.

## Navigation

### Progress Bar (replaces dots)
- Position: absolute bottom, full-width
- Height: 1px, divided into N equal segments separated by small gaps
- Active segment: gold fill animated from 0% to 100% width over slide duration
- Inactive segments: `bg-white/20`
- On hover-pause: animation freezes in place (CSS `animation-play-state: paused`)

### Slide durations
- Video slide: **8000ms**
- Image slides: **6000ms**

### Arrow Buttons
- Default: `opacity-0`
- On `section:hover`: `opacity-30`
- On individual button hover: `opacity-80`
- Icon: `arrow_back_ios` / `arrow_forward_ios` (thinner than current chevron)

## Tailwind Config Additions

```ts
transitionDuration: {
  luxe: '1200ms',
}
transitionTimingFunction: {
  luxe: 'cubic-bezier(0.4, 0, 0.2, 1)',
}
animation: {
  'ken-burns-a': 'kenBurnsA 12s ease-in-out forwards',
  'ken-burns-b': 'kenBurnsB 12s ease-in-out forwards',
  'ken-burns-c': 'kenBurnsC 12s ease-in-out forwards',
  'stagger-title': 'staggerReveal 0.8s cubic-bezier(0.25, 0.1, 0.25, 1) both',
  'stagger-sub':   'staggerReveal 0.8s cubic-bezier(0.25, 0.1, 0.25, 1) 0.3s both',
  'stagger-cta':   'staggerReveal 0.8s cubic-bezier(0.25, 0.1, 0.25, 1) 0.6s both',
}
keyframes: {
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
    from: { opacity: '0', transform: 'translateY(8px)' },
    to:   { opacity: '1', transform: 'translateY(0)' },
  },
}
```

## Component Type Definitions

```typescript
interface VideoSlide {
  type: 'video';
  videoUrl: string;
  posterUrl: string;
  title: string;
  subtitle: string;
}

interface ImageSlide {
  type: 'image';
  imageUrl: string;
  title: string;
  subtitle: string;
  photographer?: string;
  photographerUrl?: string;
}

type Slide = VideoSlide | ImageSlide;
```

## Pexels API Integration

Endpoint: `https://api.pexels.com/videos/search?query=<q>&per_page=3&orientation=landscape`
Header: `Authorization: <VITE_PEXELS_API_KEY>`
Select: `video_files[0]` with `quality: 'hd'` and `file_type: 'video/mp4'`
Poster: `image` field from the Pexels video object

Fallback: if no API key or fetch fails, Slide 1 becomes a gradient (existing behavior).

## Fallback Strategy

1. Pexels key missing → video slide becomes gradient
2. Unsplash key missing → image slides become gradients
3. Either API error → graceful fallback to gradient, no crash

## Files to Modify

- `frontend/src/components/home/HeroCarousel.tsx` — full refactor
- `frontend/tailwind.config.ts` — add luxe duration/easing + Ken Burns + stagger keyframes
- `frontend/.env.example` — document `VITE_PEXELS_API_KEY`
