# Gallery Redesign: Cinematic Mosaic — Design

**Date:** 2026-05-01
**Status:** Approved (pending implementation plan)
**Scope:** Restructure the public `/gallery` page so the top of the page is a cinematic auto-animating media wall, the middle is a horizontally-scrolling marquee of recent uploads, and the existing album grid moves to the bottom as the "browse" section.

---

## Goals

1. The first thing a visitor sees is moving, mixed media — not a static empty grid.
2. Photos and videos share the same surfaces, with videos auto-playing in the hero (muted) and showing as thumbnails-with-play-badge elsewhere.
3. Browsing controls (search, filters, albums) move to the bottom half — they're for the visitor who wants to dig in.
4. Reuse existing components where they already work (`AlbumCard3D`, lightbox with `<VideoPlayer>` branch, `GET /api/gallery`).

## Non-Goals

- No new backend endpoints. The hero and marquee both consume `GET /api/gallery?limit=24` (already deployed).
- No admin curation surface for "featured for hero". The hero pulls a randomized slice of recent uploads.
- No new animation library. Continue using framer-motion + CSS animations.
- No mobile-only redesign — desktop and mobile share the same component, just with smaller dimensions and fewer tiles.
- The fabricated subline "5,000+ memories" idea was rejected in brainstorming; the hero shows only the title overlay (no count).

---

## Architecture

### Page section order (top → bottom)

```
HERO MOSAIC      (~80vh tall, full viewport width)
MARQUEE STRIP    (~22vh tall on desktop, ~16vh on mobile)
BROWSE BAR       (search input + filter dock)
ALBUMS GRID      (existing AlbumCard3D layout, "BROWSE BY EVENT")
```

The existing "Latest Global Uploads" masonry section is **removed**. The marquee replaces it.

### Component breakdown

```
gallery/page.tsx
├── HeroMosaic            (NEW)
│    └── MosaicTile[]     (NEW — handles photo OR video, breathing, swap)
├── MarqueeStrip          (NEW)
│    └── MarqueeTile[]    (NEW — thumbnail + play badge for videos)
├── (search input, filter dock — extracted from current page)
├── AlbumCard3D[]         (EXISTING, unchanged)
└── Lightbox              (EXISTING, unchanged — already supports both)
```

`HeroMosaic` and `MarqueeStrip` live in `frontend/src/components/gallery/` alongside the existing `VideoPlayer.tsx`.

---

## Hero Mosaic — visual rules

### Layout (desktop)

6 tiles in an irregular CSS-grid layout. Aspect ratios are fixed by grid so the mosaic doesn't reflow when content changes:

```
┌────────────────────┬──────────┐
│                    │  TILE 2  │
│      TILE 1        ├──────────┤
│  (col 1-2, row 1-2)│  TILE 3  │
│                    ├──────────┤
├──────────┬─────────┤  TILE 4  │
│  TILE 5  │  TILE 6 │          │
└──────────┴─────────┴──────────┘
```

CSS Grid template:
```css
grid-template-columns: 2fr 2fr 1.4fr;
grid-template-rows: 1fr 1fr 1fr;
gap: 12px;
height: 80vh;
```

- Tile 1: `grid-column: 1 / span 2; grid-row: 1 / span 2;`
- Tile 2: `grid-column: 3; grid-row: 1;`
- Tile 3: `grid-column: 3; grid-row: 2;`
- Tile 4: `grid-column: 3; grid-row: 3;`
- Tile 5: `grid-column: 1; grid-row: 3;`
- Tile 6: `grid-column: 2; grid-row: 3;`

### Layout (mobile, < 768px)

Drops to a 2×2 grid (4 tiles total). Tile 1 spans the top row at full width; Tiles 2–4 fill the bottom three quarters in a row of three. Height: 60vh.

### Content sourcing

- Initial fetch: `GET /api/gallery?limit=24` on mount.
- Pool: all 24 returned items are eligible. The first render picks 6 (4 on mobile) at random, weighted ~3:1 toward photos so videos don't dominate the wall.
- The marquee receives the SAME 24-item pool minus the items currently rendered in the hero (so no duplication on first paint).

### Breathing animation

Each tile scales between 1.0 and 1.03 on a 7-second cycle, plus a faint opacity oscillation (0.96 ↔ 1.0). Each tile starts at a randomly-offset phase so the wall doesn't pulse in unison. Implemented as a CSS `@keyframes` animation; per-tile phase set via inline `animation-delay`.

### Cross-fade swap

Every 5 seconds:
1. Pick 2 random tile indices (must be different).
2. For each, fade the current item out (300ms), swap to the next unused item from the pool, fade the new item in (300ms).
3. Track recently-shown items per tile so the same item doesn't immediately re-appear.

When the lightbox is open, swaps pause (otherwise the user might lose their place).

### Videos in the hero

- Only **ONE** video plays at a time in the hero. The first video tile to be rendered gets the active iframe; subsequent video tiles render as a thumbnail with a small play badge until they rotate into the active slot.
- Active video uses YouTube/Vimeo embed URLs with these params:
  - YouTube: `autoplay=1&mute=1&loop=1&playlist=<ID>&controls=0&modestbranding=1&playsinline=1&rel=0`
  - Vimeo: `autoplay=1&muted=1&loop=1&controls=0&playsinline=1`
- The active video iframe is `pointer-events: none` so the tile's click handler still fires (open in lightbox) without intercepting the click.

### Title overlay

- Text: `THE DOJO WALL`
- Position: bottom-left of the mosaic, with comfortable 32px padding (16px on mobile)
- Style: matches existing hero treatment — "THE" and "WALL" in white, "DOJO" in red gradient (`linear-gradient(180deg, #ef4444, #991b1b)`)
- Font size: `clamp(2.5rem, 8vw, 5rem)` to match current
- Drop shadow + a thin radial vignette behind the title so it stays readable over any tile content
- No subline. The visuals carry the page; we don't claim counts that don't exist.

### Click behavior

Tile click → existing lightbox opens at that item's index. Lightbox already supports the photo/video branch from the prior task. While the lightbox is open, breathing + swap animations pause to preserve state on dismissal.

---

## Marquee Strip — visual rules

### Layout

- Section label `LATEST UPLOADS` left-aligned above the strip, with a thin red accent bar to its left (matches existing section-divider style).
- Single row of tiles, full viewport width.
- Height: 22vh desktop / 16vh mobile.
- Tiles preserve natural aspect ratio at the row's fixed height — so widths are variable.
- Gap between tiles: 12px.

### Auto-scroll

- The tile array is **rendered twice** in the DOM (`tiles.concat(tiles)`).
- A CSS keyframe animation translates the inner container from `translateX(0)` to `translateX(-50%)` over ~30 seconds, `infinite linear`. When it loops, the second copy is now in the original first copy's position — seamless.
- `animation-play-state: paused` on `:hover`.
- `prefers-reduced-motion: reduce` halts the animation entirely (accessibility); user can still manually scroll horizontally.

### Content sourcing

- The same 24-item pool from `GET /api/gallery?limit=24`.
- Filters out items currently in the hero (track them in a shared `Set<string>` of IDs).
- If fewer than ~6 items remain after the hero subtract, just use the full pool — the marquee should never be empty.

### Videos in the marquee

- Render the thumbnail (`imageUrl` field, which holds the oEmbed thumbnail for video rows).
- Overlay a small play badge (red circle, white triangle, ~32px) bottom-right of the tile.
- Click → lightbox.
- **No iframe** in the marquee — keeps DOM/CPU light.

---

## Browse Bar + Albums Section

### Browse bar

- A wrapper `<section>` with a header reading `BROWSE BY EVENT` (centered, with hairline gradient bars on each side — same divider style as `LATEST GLOBAL UPLOADS` currently uses).
- Below the header: search input + filter dock, BOTH preserved from the current implementation. Same styles, same handlers, same debounced search.

### Albums grid

- The existing `AlbumCard3D` component renders unchanged (3D tilt, glow, etc.).
- The grid container uses the existing CSS:
  ```tsx
  <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
  ```
- The empty state ("No Albums Found in the Vault") is preserved.
- Pagination, loading state, animation behaviors all preserved.

---

## Data Flow

```
Mount
  └─ fetch /api/gallery?limit=24  → pool (24 items)
                                     │
                                     ├─ HeroMosaic: random 6 (4 mobile)
                                     │   └─ rotates within pool every 5s
                                     │
                                     └─ MarqueeStrip: pool minus hero items
                                         └─ static set, scrolls infinitely

Mount (separate)
  └─ fetch /api/albums?... (existing) → albums grid
        └─ filtered by search + filter dock (existing logic preserved)
```

The pool is fetched once and shared between hero and marquee via a `useState` in the page component. There's no need to re-fetch — even if the user is on the page for hours, the swap animation cycles through the existing 24 items, which is fine; this isn't a real-time feed.

---

## Files Affected

**Created:**
- `frontend/src/components/gallery/HeroMosaic.tsx` — the 6-tile breathing mosaic with cross-fade swap
- `frontend/src/components/gallery/MosaicTile.tsx` — single tile (photo or video, with the active-video logic)
- `frontend/src/components/gallery/MarqueeStrip.tsx` — auto-scrolling band with seamless loop

**Modified:**
- `frontend/src/app/gallery/page.tsx` — restructure: replace top half (heading + filter dock) with `HeroMosaic`; insert `MarqueeStrip`; move search + filter dock down above the album grid; rename the divider above the album grid to "BROWSE BY EVENT"; **delete** the existing "Latest Global Uploads" masonry section (replaced by marquee).

**Unchanged:**
- `AlbumCard3D` (still rendered as-is)
- Lightbox (already supports both photos and videos)
- Backend (`/api/gallery`, `/api/albums` already return everything needed)

---

## Error Handling

- If `/api/gallery?limit=24` returns 0 items: hero falls back to a single full-mosaic-area placeholder card (`No memories yet — be the first to upload.`) and the marquee is hidden entirely.
- If a video iframe fails to load (provider error, network): tile reverts to thumbnail + play badge automatically (the same code path as inactive video tiles).
- If `prefers-reduced-motion` is set: breathing + cross-fade + marquee scroll are all disabled; mosaic shows static images, marquee becomes a regular horizontal scroller (still mounted, just not auto-scrolling).

## Testing

Manual browser verification on the deployed Vercel preview:

- [ ] Hero loads with 6 tiles, each containing a real photo or video thumbnail
- [ ] Tiles breathe (subtle scale + opacity) at staggered phases
- [ ] Every ~5 seconds, two tiles swap content
- [ ] Exactly one video iframe is mounted in the hero at any time; the rest are thumbnails
- [ ] Click any tile → lightbox opens at that item
- [ ] Lightbox open → mosaic animations pause
- [ ] Marquee scrolls smoothly, loops without visible seam
- [ ] Hover marquee → scroll pauses
- [ ] Marquee video tiles show play badge, click opens lightbox iframe
- [ ] Search + filters above album grid still filter the album list
- [ ] No "Latest Global Uploads" masonry below album grid (was removed)
- [ ] Empty gallery state: hero shows fallback card, marquee hidden, album grid keeps its empty state
- [ ] Mobile: hero drops to 4 tiles, marquee fits viewport, no horizontal overflow
- [ ] `prefers-reduced-motion`: animations disabled, page still functional
