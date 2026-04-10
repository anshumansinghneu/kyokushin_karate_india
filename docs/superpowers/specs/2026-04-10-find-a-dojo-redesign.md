# Find a Dojo Page Redesign - Design Spec

**Date:** 2026-04-10
**Direction:** Bold & Martial
**Status:** Approved

## Overview

Complete visual redesign of the Find a Dojo page from a split-grid layout to a full-width immersive map experience with floating glassmorphic panels, interactive pin previews, and a cinematic slide-in detail panel. Part of a page-by-page UI overhaul for the Kyokushin Karate India website.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Visual direction | Bold & Martial | Japanese-inspired aesthetics fit Kyokushin brand identity |
| Map style | Full Package (immersive) | Full-width map as hero, floating panels overlay, animated pins, hover previews |
| Detail view | Cinematic Slide-In | Keeps map visible, maintains spatial context, smooth flow |

## 1. Layout & Structure

The page is a single full-viewport canvas. The Leaflet map occupies the entire viewport below the navbar. All UI elements float on top of the map as absolutely-positioned layers:

- **Top-left**: Page title block — "FIND YOUR DOJO" in heavy uppercase, "Official Registry" red badge, kanji 極 watermark behind (rgba(220,38,38,0.03))
- **Right side**: Floating dojo list panel (~280px wide, full height minus padding)
- **Bottom-left**: Floating search bar with backdrop blur
- **Map pins**: Custom Kyokushin-styled markers with pulsing ring animations

No page scroll. The map is the page. The floating list panel scrolls independently.

## 2. Map Experience

### Tiles
- CartoDB dark_all (existing) — already matches the dark martial aesthetic

### Custom Pin Markers
- Shape: Red circle or rotated square with 極 kanji character
- Border: 2px solid white
- Shadow: `0 0 20px rgba(220,38,38,0.5)`
- Pulsing ring: CSS keyframe animation, 1px border rgba(220,38,38,0.2), scale 1→2.5 over 2.5s infinite

### Pin Hover Preview
When hovering a map pin, a floating card appears attached to the pin:
- Background: `rgba(0,0,0,0.92)`, backdrop-blur 16px
- Border: 1px solid rgba(220,38,38,0.25), rounded 12px
- Content: Branch badge, dojo name (bold), location, "View Dojo →" CTA button
- Arrow pointer at bottom connecting to pin
- AnimatePresence fade+scale entrance

### Hover Synchronization
- Hovering a pin highlights the corresponding card in the floating list (brighter bg, red glow)
- Hovering a list card highlights the corresponding pin on the map (scale up, deeper shadow)
- Uses existing hoveredDojoId state

### Initial View
- Center: [22.5, 78.9] (India center)
- Zoom: 4
- Fits all dojos in view

## 3. Floating Dojo List Panel

### Position & Style
- `position: absolute; top: 16px; right: 16px; bottom: 16px`
- `width: 280px`
- `background: rgba(0,0,0,0.8)`
- `backdrop-filter: blur(20px)`
- `border: 1px solid rgba(220,38,38,0.12)`
- `border-radius: 14px`
- `z-index: 20`

### Panel Content
1. **Search bar** (top): Red-tinted input, rgba(220,38,38,0.05) background, 1px red border, placeholder "Search dojos..."
2. **Section title**: "ACTIVE BRANCHES" — 9px, weight 800, uppercase, letter-spacing 3px, color #dc2626
3. **Dojo cards** (scrollable list):
   - Padding: 10px
   - Background: rgba(220,38,38,0.03)
   - Border: 1px solid rgba(220,38,38,0.06)
   - Left border: 3px solid #dc2626
   - Border-radius: 8px
   - Name: 11px, weight 700, uppercase
   - Location: 9px, color #888
   - Active state: brighter background (0.08), red glow shadow
4. **Count badge**: Near section title, red bg pill showing filtered count

## 4. Cinematic Slide-In Detail Panel

Triggered when a pin or list card is clicked.

### Animation Sequence
1. Map fly-to: `map.setView(coords, 14, { animate: true, duration: 1.5 })`
2. Pulsing concentric rings appear around active pin (2 rings, staggered animation)
3. Gradient dim: `linear-gradient(to left, rgba(0,0,0,0.6), transparent 60%)` fades in over the map
4. Panel slides in: Framer Motion `x: '100%' → 0`, spring physics

### Panel Structure
- `position: fixed; top: 0; right: 0; bottom: 0; width: 380px`
- `background: rgba(0,0,0,0.92); backdrop-filter: blur(24px)`
- `border-left: 1px solid rgba(220,38,38,0.2)`
- `box-shadow: -20px 0 60px rgba(0,0,0,0.6)`
- `z-index: 40`
- `padding: 24px`

### Panel Content (top to bottom)
1. **Close button**: Top-right, 32px circle, rgba bg, × icon
2. **Branch badge**: "OFFICIAL BRANCH XXX" — red bg, white text, 9px, uppercase, tracking 3px, red glow shadow
3. **Dojo name**: 26px, weight 900, uppercase, tight tracking
4. **Meta tags**: Flexbox row of pills — city/state, instructor name
5. **Info rows**: Stacked rows with label-value pairs:
   - Status: "Verified & Active" in green (#4ade80)
   - Address (if available)
   - Contact info (if available)
6. **Action buttons**:
   - "View Full Profile" — white bg, black text, full width, rounded 12px, weight 800, uppercase
   - "Get Directions" — ghost outline, rgba(255,255,255,0.04) bg, white border

### Dismiss
- Click close button or click outside panel
- Reverse animation: panel slides out, dim fades, map zooms back to previous view

## 5. Animations & Motion

All using Framer Motion (framer-motion 12.23.24, already installed).

| Element | Animation | Details |
|---------|-----------|---------|
| Page entry - title | Fade in + slide up | opacity 0→1, y -20→0 |
| Page entry - map | Scale in | scale 0.95→1 |
| Page entry - floating panel | Slide from right | x 40→0, delay 0.2s |
| Pin pulse rings | CSS keyframe | scale 1→2.5, opacity 1→0, 2.5s infinite |
| Pin hover preview | AnimatePresence | opacity 0→1, scale 0.9→1, spring |
| List card hover | CSS transition | scale(1.02), translateY(-2px), 0.2s |
| Detail panel in | Framer Motion | x '100%'→0, spring stiffness 300 damping 30 |
| Detail panel dim | Framer Motion | opacity 0→1, 0.3s |
| Map fly-to | Leaflet native | setView with animate:true, duration 1.5 |
| Detail panel out | Framer Motion | x 0→'100%', map zoom out |

## 6. Mobile Responsiveness

### Breakpoint: < 1024px (tablet)
- Floating list panel: width 240px, smaller card text

### Breakpoint: < 768px (mobile)
- **Floating list panel → Bottom sheet**: Collapsed at bottom showing 2-3 cards, draggable up to full height
- **Search bar**: Moves to top center, full width with 16px padding
- **Title block**: Smaller font (20px), stays top-left on map
- **Detail panel → Bottom sheet**: Slides up from bottom instead of right, max-height 70vh
- **Pin hover previews**: Disabled on touch — tap goes directly to detail panel
- **Kanji watermark**: Hidden on mobile to reduce clutter

## 7. Color & Typography

### Colors
- Background: #000000 (pure black via map tiles)
- Primary accent: #dc2626 (Kyokushin red)
- Red glow: rgba(220,38,38, 0.3-0.5) for shadows
- Red subtle: rgba(220,38,38, 0.03-0.15) for backgrounds/borders
- Text primary: #ffffff
- Text secondary: #a1a1aa (zinc-400)
- Text muted: #888888
- Success: #4ade80 (green for active status)
- Glass bg: rgba(0,0,0, 0.8-0.92)

### Typography
- Font: Montserrat (existing global font)
- Headings: weight 800-900, uppercase, letter-spacing -0.5px to -1px
- Labels/badges: weight 700-800, uppercase, letter-spacing 2-3px, 9-10px
- Body: weight 600, 11-13px
- Kanji watermark: 極, weight 900, rgba(220,38,38,0.03-0.04)

## 8. Technical Approach

### File Modified
- `frontend/src/app/find-a-dojo/page.tsx` — complete rewrite of the component

### Dependencies (all existing)
- framer-motion — animations
- leaflet — map
- lucide-react — icons
- tailwindcss — styling

### Key Components (within the single page file)
1. `FindADojoPage` — main page component, state management
2. `DojoPin` — custom Leaflet marker with hover preview
3. `FloatingDojoList` — right-side glassmorphic panel with search and cards
4. `DojoDetailPanel` — slide-in detail panel
5. `DojoListCard` — individual card in the floating list

### State
- `dojos` / `filteredDojos` — dojo data from API (existing)
- `searchQuery` — search filter (existing)
- `hoveredDojoId` — pin/card hover sync (existing)
- `selectedDojo` — triggers detail panel (existing)
- `isLoading` — loading state (existing)

No new state needed. The existing state model supports all interactions.
