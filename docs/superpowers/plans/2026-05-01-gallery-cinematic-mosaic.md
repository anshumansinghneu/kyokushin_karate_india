# Gallery Cinematic Mosaic Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the top half of `/gallery` with a 6-tile breathing media mosaic + horizontally-scrolling marquee, and move search/filters/albums to the bottom half.

**Architecture:** Three new components in `frontend/src/components/gallery/` — `MosaicTile`, `HeroMosaic`, `MarqueeStrip`. The page component fetches `/api/gallery?limit=24` once and shares the pool between hero and marquee (marquee filters out hero items). Lightbox is unchanged (already handles photos and videos). No backend changes, no schema changes.

**Tech Stack:** Next.js 14 App Router, React, TypeScript, framer-motion, Tailwind CSS, lucide-react icons. Existing API endpoints only.

**Spec:** `docs/superpowers/specs/2026-05-01-gallery-redesign-cinematic-mosaic-design.md`

**Test approach:** No Jest/Vitest in this repo. Verification is `npm run build` for type/lint correctness on each commit, then a manual Vercel-preview pass after the final task. UI behavior (breathing, cross-fade, marquee scroll) is visual-only and verified in-browser at the end.

---

### Task 1: `MosaicTile` component

**Files:**
- Create: `frontend/src/components/gallery/MosaicTile.tsx`

This is the leaf component — one tile that holds either a photo or a video, with the breathing animation built in. The HeroMosaic will use 6 of these.

- [ ] **Step 1: Create the component**

Create `frontend/src/components/gallery/MosaicTile.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { getImageUrl } from "@/lib/imageUtils";
import { buildEmbedUrl } from "./VideoPlayer";
import type { GalleryPhoto } from "@/app/gallery/page";

interface MosaicTileProps {
    photo: GalleryPhoto;
    /** When true and photo is a video, render the iframe (auto-play muted loop). When false, render thumbnail with play badge. */
    isActiveVideo: boolean;
    /** Used to stagger breathing-animation phase per tile so they don't pulse in sync. 0..5 */
    phaseIndex: number;
    onClick: () => void;
}

export default function MosaicTile({ photo, isActiveVideo, phaseIndex, onClick }: MosaicTileProps) {
    const isVideo = photo.mediaType === 'VIDEO';
    const thumb = getImageUrl(photo.imageUrl) || "";
    const [thumbLoaded, setThumbLoaded] = useState(false);

    // Cross-fade key: change when photo.id changes so framer-motion / CSS can re-trigger fade
    const key = photo.id;

    return (
        <div
            key={key}
            onClick={onClick}
            className="relative w-full h-full overflow-hidden rounded-2xl border border-white/10 cursor-pointer group bg-zinc-900"
            style={{
                animation: `mosaic-breathe 7s ease-in-out infinite`,
                animationDelay: `${phaseIndex * 0.9}s`,
            }}
        >
            {/* Thumbnail layer (always rendered for fast paint and as a fallback). */}
            <img
                src={thumb}
                alt={photo.caption || (isVideo ? 'Video' : 'Photo')}
                onLoad={() => setThumbLoaded(true)}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${thumbLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading="eager"
                draggable={false}
            />

            {/* Active video iframe (mounted only when this tile is the chosen active video). */}
            {isVideo && isActiveVideo && photo.videoProvider && photo.videoId && (
                <iframe
                    src={buildLoopedEmbedUrl(photo.videoProvider, photo.videoId)}
                    title={photo.caption || 'Video'}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                />
            )}

            {/* Play badge for inactive video tiles (and as a hint when active video is loading). */}
            {isVideo && !isActiveVideo && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-md border border-white/30 shadow-2xl flex items-center justify-center">
                        <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
                    </div>
                </div>
            )}

            {/* Hover scrim — slight lift on interaction. */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300" />
        </div>
    );
}

/** Looped, muted, autoplay embed URL — different from the lightbox VideoPlayer's URL builder. */
function buildLoopedEmbedUrl(provider: string, videoId: string): string {
    if (provider === 'youtube') {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&playsinline=1&rel=0`;
    }
    if (provider === 'vimeo') {
        return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&controls=0&playsinline=1`;
    }
    return '';
}
```

- [ ] **Step 2: Add the breathing keyframes to global CSS**

Open `frontend/src/app/globals.css` and append at the end:

```css
@keyframes mosaic-breathe {
    0%, 100% { transform: scale(1); opacity: 0.96; }
    50% { transform: scale(1.03); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
    [class*="mosaic-tile"] { animation: none !important; }
}
```

- [ ] **Step 3: Build**

```bash
cd /Users/anshumansingh/kyokushin_karate/frontend
npm run build
```

Expected: build succeeds (the new component is unused so far — Task 2 imports it).

- [ ] **Step 4: Commit**

```bash
cd /Users/anshumansingh/kyokushin_karate
git add frontend/src/components/gallery/MosaicTile.tsx frontend/src/app/globals.css
git commit -m "feat(gallery): add MosaicTile component with breathing animation"
```

---

### Task 2: `HeroMosaic` component

**Files:**
- Create: `frontend/src/components/gallery/HeroMosaic.tsx`

This composes 6 (or 4 on mobile) `MosaicTile`s with a fixed asymmetric grid layout, manages the cross-fade swap timer, ensures only one video tile is "active" (iframe-mounted) at a time, and pauses animations when the lightbox opens.

- [ ] **Step 1: Create the component**

Create `frontend/src/components/gallery/HeroMosaic.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MosaicTile from "./MosaicTile";
import type { GalleryPhoto } from "@/app/gallery/page";

interface HeroMosaicProps {
    pool: GalleryPhoto[];
    /** Pause swap timer when true (e.g., lightbox open). */
    paused: boolean;
    onTileClick: (photoId: string) => void;
}

const DESKTOP_TILE_COUNT = 6;
const MOBILE_TILE_COUNT = 4;
const SWAP_INTERVAL_MS = 5000;

/** Layout: 3 columns × 3 rows. Tile 1 is large (col 1-2, row 1-2). */
const DESKTOP_GRID_AREAS: Array<{ col: string; row: string }> = [
    { col: '1 / span 2', row: '1 / span 2' }, // tile 1 (large)
    { col: '3', row: '1' },                   // tile 2
    { col: '3', row: '2' },                   // tile 3
    { col: '3', row: '3' },                   // tile 4
    { col: '1', row: '3' },                   // tile 5
    { col: '2', row: '3' },                   // tile 6
];

/** Mobile layout: 3 columns × 2 rows. Tile 1 spans top row; tiles 2-4 fill bottom row. */
const MOBILE_GRID_AREAS: Array<{ col: string; row: string }> = [
    { col: '1 / span 3', row: '1' }, // tile 1 (large)
    { col: '1', row: '2' },          // tile 2
    { col: '2', row: '2' },          // tile 3
    { col: '3', row: '2' },          // tile 4
];

function shuffle<T>(arr: T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/** Pick `count` items from pool, weighted ~3:1 toward photos. */
function pickWeighted(pool: GalleryPhoto[], count: number): GalleryPhoto[] {
    const photos = shuffle(pool.filter(p => p.mediaType === 'IMAGE'));
    const videos = shuffle(pool.filter(p => p.mediaType === 'VIDEO'));
    const targetVideos = Math.min(videos.length, Math.max(1, Math.floor(count / 4)));
    const targetPhotos = count - targetVideos;
    const chosen = [...photos.slice(0, targetPhotos), ...videos.slice(0, targetVideos)];
    return shuffle(chosen).slice(0, count);
}

export default function HeroMosaic({ pool, paused, onTileClick }: HeroMosaicProps) {
    const [isMobile, setIsMobile] = useState(false);
    const tileCount = isMobile ? MOBILE_TILE_COUNT : DESKTOP_TILE_COUNT;
    const gridAreas = isMobile ? MOBILE_GRID_AREAS : DESKTOP_GRID_AREAS;

    // Track viewport — listen to media query
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(max-width: 767px)');
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    const [tiles, setTiles] = useState<GalleryPhoto[]>([]);
    const usedIdsRef = useRef<Set<string>>(new Set());

    // Initialize tiles when pool changes or tileCount changes
    useEffect(() => {
        if (pool.length === 0) { setTiles([]); usedIdsRef.current.clear(); return; }
        const initial = pickWeighted(pool, tileCount);
        setTiles(initial);
        usedIdsRef.current = new Set(initial.map(t => t.id));
    }, [pool, tileCount]);

    // Swap timer
    useEffect(() => {
        if (paused || tiles.length === 0 || pool.length <= tiles.length) return;
        const interval = setInterval(() => {
            setTiles(current => {
                if (current.length === 0) return current;
                // Pick 2 distinct tile indices to swap
                const i1 = Math.floor(Math.random() * current.length);
                let i2 = Math.floor(Math.random() * current.length);
                if (current.length > 1) while (i2 === i1) i2 = Math.floor(Math.random() * current.length);

                // Find an unused (or least-recently-used) item from pool
                const inUse = new Set(current.map(t => t.id));
                const candidates = pool.filter(p => !inUse.has(p.id));
                if (candidates.length === 0) return current;

                const next = current.slice();
                next[i1] = candidates[Math.floor(Math.random() * candidates.length)];
                if (i1 !== i2) {
                    const remaining = candidates.filter(c => c.id !== next[i1].id);
                    if (remaining.length > 0) {
                        next[i2] = remaining[Math.floor(Math.random() * remaining.length)];
                    }
                }
                return next;
            });
        }, SWAP_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [pool, tiles.length, paused]);

    // Pick exactly one tile to be the active video (the first VIDEO-mediaType tile in current selection)
    const activeVideoId = useMemo(() => {
        const firstVideo = tiles.find(t => t.mediaType === 'VIDEO');
        return firstVideo?.id ?? null;
    }, [tiles]);

    if (tiles.length === 0) {
        return (
            <div className="w-full h-[80vh] md:h-[80vh] flex items-center justify-center bg-zinc-950 border-y border-white/5">
                <p className="text-zinc-500 text-sm">No memories yet — be the first to upload.</p>
            </div>
        );
    }

    return (
        <div className="relative w-full">
            <div
                className="grid w-full"
                style={{
                    gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : '2fr 2fr 1.4fr',
                    gridTemplateRows: isMobile ? '2fr 1fr' : 'repeat(3, 1fr)',
                    gap: '12px',
                    height: isMobile ? '60vh' : '80vh',
                    padding: '12px',
                }}
            >
                {tiles.map((photo, i) => (
                    <div key={`slot-${i}`} style={{ gridColumn: gridAreas[i].col, gridRow: gridAreas[i].row }}>
                        <MosaicTile
                            photo={photo}
                            isActiveVideo={photo.id === activeVideoId}
                            phaseIndex={i}
                            onClick={() => onTileClick(photo.id)}
                        />
                    </div>
                ))}
            </div>

            {/* Title overlay */}
            <div className="pointer-events-none absolute bottom-0 left-0 p-4 md:p-8 lg:p-12 max-w-4xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent rounded-tr-[100px] pointer-events-none" />
                <h1
                    className="relative font-black tracking-tighter uppercase leading-[0.9] drop-shadow-2xl"
                    style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)' }}
                >
                    <span className="text-white">THE </span>
                    <span
                        className="drop-shadow-[0_4px_25px_rgba(220,38,38,0.4)]"
                        style={{
                            background: 'linear-gradient(180deg, #ef4444, #991b1b)',
                            WebkitBackgroundClip: 'text',
                            backgroundClip: 'text',
                            color: 'transparent',
                        }}
                    >DOJO</span>
                    <span className="text-white"> WALL</span>
                </h1>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Build**

```bash
cd /Users/anshumansingh/kyokushin_karate/frontend
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /Users/anshumansingh/kyokushin_karate
git add frontend/src/components/gallery/HeroMosaic.tsx
git commit -m "feat(gallery): add HeroMosaic with asymmetric grid and cross-fade swap"
```

---

### Task 3: `MarqueeStrip` component

**Files:**
- Create: `frontend/src/components/gallery/MarqueeStrip.tsx`

Auto-scrolling band of tiles (photos as thumbnails, videos as thumbnails + play badge). Renders the array twice and animates `translateX(0) → translateX(-50%)` for a seamless loop.

- [ ] **Step 1: Create the component**

Create `frontend/src/components/gallery/MarqueeStrip.tsx`:

```tsx
"use client";

import { Play } from "lucide-react";
import { getImageUrl } from "@/lib/imageUtils";
import type { GalleryPhoto } from "@/app/gallery/page";

interface MarqueeStripProps {
    items: GalleryPhoto[];
    onTileClick: (photoId: string) => void;
}

export default function MarqueeStrip({ items, onTileClick }: MarqueeStripProps) {
    if (items.length === 0) return null;

    // Render the array twice so the keyframe loop is seamless
    const doubled = [...items, ...items];

    return (
        <section className="w-full mt-6 md:mt-8">
            {/* Section label */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-5 bg-red-500 rounded-full" />
                    <span className="text-xs font-black text-white uppercase tracking-[0.25em]">
                        Latest Uploads
                    </span>
                </div>
            </div>

            {/* Strip */}
            <div className="relative w-full overflow-hidden h-[22vh] md:h-[22vh]" style={{ height: 'clamp(140px, 22vh, 240px)' }}>
                <div
                    className="flex h-full gap-3 marquee-track"
                    style={{ width: 'max-content' }}
                >
                    {doubled.map((photo, i) => {
                        const isVideo = photo.mediaType === 'VIDEO';
                        const thumb = getImageUrl(photo.imageUrl) || "";
                        return (
                            <div
                                key={`${photo.id}-${i}`}
                                onClick={() => onTileClick(photo.id)}
                                className="relative h-full aspect-[4/3] flex-shrink-0 rounded-xl overflow-hidden border border-white/10 cursor-pointer group"
                            >
                                <img
                                    src={thumb}
                                    alt={photo.caption || (isVideo ? 'Video' : 'Photo')}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    loading="lazy"
                                    draggable={false}
                                />
                                {isVideo && (
                                    <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-red-600/90 backdrop-blur-md flex items-center justify-center shadow-lg pointer-events-none">
                                        <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
```

- [ ] **Step 2: Add the marquee keyframes to global CSS**

Append to `frontend/src/app/globals.css`:

```css
@keyframes marquee-scroll {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
}

.marquee-track {
    animation: marquee-scroll 30s linear infinite;
}

.marquee-track:hover {
    animation-play-state: paused;
}

@media (prefers-reduced-motion: reduce) {
    .marquee-track {
        animation: none;
        overflow-x: auto;
    }
}
```

- [ ] **Step 3: Build**

```bash
cd /Users/anshumansingh/kyokushin_karate/frontend
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Users/anshumansingh/kyokushin_karate
git add frontend/src/components/gallery/MarqueeStrip.tsx frontend/src/app/globals.css
git commit -m "feat(gallery): add MarqueeStrip with seamless auto-scroll loop"
```

---

### Task 4: Restructure `gallery/page.tsx`

**Files:**
- Modify: `frontend/src/app/gallery/page.tsx`

This is the most invasive task. We:
1. Import `HeroMosaic` and `MarqueeStrip`
2. Replace the existing hero `<div className="relative w-full overflow-hidden text-center flex flex-col items-center justify-center pt-40 pb-32 sm:pt-48 sm:pb-40">` (the title block) with `<HeroMosaic />`
3. Insert `<MarqueeStrip />` directly after the hero
4. **Move** the search input + filter dock down to sit just above the album grid
5. Change the album-grid section divider text from `Latest Global Uploads` to `Browse by Event`
6. **Delete** the existing `Latest Global Uploads` masonry section (the `<div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 ...">` block we replaced with CSS Grid in the prior feature, plus the `Load More Memories` button)
7. Compute the marquee items as `pool.filter(item => !heroIds.has(item.id))`

- [ ] **Step 1: Read the current state of `gallery/page.tsx`**

Identify the regions to change:
- Hero block: roughly the `<div className="relative w-full overflow-hidden text-center ...">` containing the H1 + sub-paragraph
- Search/filter dock: the sticky-ish section with `<div className="sticky top-6 z-40 mb-20 ...">` containing the input + filter chips
- Latest Global Uploads section: the block guarded by `{photos.length > 0 && (` containing the masonry grid

We will reorder all three.

- [ ] **Step 2: Add new imports**

At the top of `frontend/src/app/gallery/page.tsx`, add to the existing imports:

```tsx
import HeroMosaic from "@/components/gallery/HeroMosaic";
import MarqueeStrip from "@/components/gallery/MarqueeStrip";
```

- [ ] **Step 3: Add a helper to open the lightbox by photo ID**

Inside the `GalleryPage` component, near where `lightboxIndex` is declared, add:

```tsx
const openLightboxById = (photoId: string) => {
    const idx = photos.findIndex(p => p.id === photoId);
    if (idx >= 0) setLightboxIndex(idx);
};
```

- [ ] **Step 4: Compute the hero/marquee partition**

Add after the `photos` state hook:

```tsx
const HERO_DESKTOP = 6;
const heroIds = new Set(photos.slice(0, HERO_DESKTOP).map(p => p.id));
const marqueeItems = photos.filter(p => !heroIds.has(p.id));
```

(The `slice(0, HERO_DESKTOP)` is just used to compute which IDs the hero is *likely* to use for the initial marquee partition. The actual hero internally re-randomizes. Marquee filtering on a stable subset prevents flicker.)

- [ ] **Step 5: Replace the hero section**

Find the existing block:

```tsx
<div className="relative w-full overflow-hidden text-center flex flex-col items-center justify-center pt-40 pb-32 sm:pt-48 sm:pb-40">
    {/* Advanced Cinematic Lights */}
    <div className="absolute top-0 inset-x-0 mx-auto w-[600px] h-[600px] bg-red-600 opacity-[0.03] blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
    ...
    <div className="relative z-20 max-w-5xl mx-auto px-4 pointer-events-none">
        <motion.div ...>
            <h1 ...>THE DOJO WALL</h1>
            <p ...>Training, grading, ...</p>
        </motion.div>
    </div>
</div>
```

Replace the entire block with:

```tsx
<HeroMosaic
    pool={photos}
    paused={lightboxIndex !== null}
    onTileClick={openLightboxById}
/>
<MarqueeStrip
    items={marqueeItems}
    onTileClick={openLightboxById}
/>
```

- [ ] **Step 6: Move the search + filter dock**

Find the existing block:

```tsx
<div className="sticky top-6 z-40 mb-20 flex flex-col items-center gap-6">
    ...
    <motion.div ... className="relative w-full max-w-2xl shadow-2xl group">
        <Search ... />
        <input ... />
    </motion.div>

    <motion.div ... className="flex overflow-x-auto w-full justify-start md:justify-center pb-4 hide-scrollbar">
        <div className="flex bg-[#050505]/80 ... rounded-full p-2 ...">
            {filters.map(...)}
        </div>
    </motion.div>
</div>
```

Cut this block from its current position and paste it inside the same parent container (`<div className="max-w-[1400px] mx-auto ...">`) just **above** the Albums Grid `<div className="min-h-[400px]">` block. Remove the `sticky top-6 z-40` classes (no longer needed since this is no longer at the top).

- [ ] **Step 7: Add the "Browse by Event" divider above the albums grid**

Just before the albums grid `<div className="min-h-[400px]">`, insert:

```tsx
<div className="flex items-center justify-center gap-4 mb-10">
    <div className="h-px w-32 bg-gradient-to-r from-transparent to-white/10" />
    <span className="text-xs font-black text-white uppercase tracking-[0.2em] px-4 py-2 bg-white/5 border border-white/10 rounded-full">
        Browse by Event
    </span>
    <div className="h-px w-32 bg-gradient-to-l from-transparent to-white/10" />
</div>
```

- [ ] **Step 8: Delete the old "Latest Global Uploads" masonry section**

Find and delete the entire block guarded by `{photos.length > 0 && (` that contains:
- The `<div className="flex items-center justify-center gap-4 mb-16">` with `Latest Global Uploads`
- The `<div className="grid gap-5 pb-16" style={{ gridTemplateColumns: ... gridAutoFlow: 'dense' }}>` masonry
- The `<button>...Load More Memories</button>` block

This entire `{photos.length > 0 && ( ... )}` block goes away. The marquee at the top now serves this purpose.

After deletion, the structure inside `<div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-20 relative z-30">` should be (in order):
1. Search + filter dock (moved here)
2. "Browse by Event" divider
3. Albums grid `{isLoading ? ... : albums.length > 0 ? ... : empty state}`
4. (Lightbox AnimatePresence — unchanged, still portaled)

- [ ] **Step 9: Remove unused imports**

After the changes, `motion` may still be used elsewhere — DO NOT remove it. But if `useMotionValue, useSpring, useTransform` are now unused (they were used by `AlbumCard3D` which is unchanged — keep them). Check by running:

```bash
cd /Users/anshumansingh/kyokushin_karate/frontend
npm run build
```

If the build complains about unused imports, remove only the specific ones flagged. Most likely all imports remain used.

- [ ] **Step 10: Build**

```bash
cd /Users/anshumansingh/kyokushin_karate/frontend
npm run build
```

Expected: build succeeds, all 50 routes generated.

- [ ] **Step 11: Commit**

```bash
cd /Users/anshumansingh/kyokushin_karate
git add frontend/src/app/gallery/page.tsx
git commit -m "feat(gallery): restructure /gallery — hero mosaic + marquee on top, browse below"
```

---

### Task 5: End-to-end manual verification + deploy

**Files:** none

- [ ] **Step 1: Push to main and watch the Vercel deploy**

```bash
cd /Users/anshumansingh/kyokushin_karate
git push origin main
```

Wait ~2 minutes for Vercel to build.

- [ ] **Step 2: Browser verification matrix**

Open https://kyokushinfoundation.com/gallery (hard-refresh with Cmd+Shift+R):

- [ ] Hero mosaic shows 6 tiles in an asymmetric grid (1 large + 4 right-column + 2 below-left)
- [ ] Each tile contains a real photo or video thumbnail (no broken images)
- [ ] Tiles "breathe" — subtle scale/opacity pulse, with phases staggered
- [ ] If a video is in the pool, exactly ONE iframe is mounted and auto-plays muted+looped; other video tiles show thumbnail + play badge
- [ ] Every ~5 seconds, two tiles cross-fade to different content
- [ ] Click any tile → lightbox opens at that item, photo OR video plays correctly
- [ ] When lightbox is open, the mosaic doesn't keep swapping (paused)
- [ ] Below the mosaic: "LATEST UPLOADS" red-bar label, then a horizontally-scrolling band
- [ ] Marquee scrolls smoothly leftward, no visible seam at the loop point
- [ ] Hover over the marquee → scroll pauses
- [ ] Marquee video tiles show a small red play badge bottom-right
- [ ] Click a marquee tile → lightbox opens
- [ ] Below the marquee: search input + filter dock (ALL/CAMPS/SEMINARS/etc.) — search still filters albums when typing
- [ ] Filter chips still toggle the active album category
- [ ] Below filters: "BROWSE BY EVENT" centered divider, then album grid (or empty state)
- [ ] Album cards have the same 3D tilt effect as before
- [ ] No "Latest Global Uploads" masonry below the albums (was removed)
- [ ] Mobile (DevTools at 375px width): mosaic shows 4 tiles in 2 rows; marquee fits viewport, no horizontal page overflow; album grid stacks to 1 column

- [ ] **Step 3: If anything misbehaves, file a follow-up commit**

Common things that may need tweaking:
- Mosaic height too tall on short laptops → adjust `60vh` / `80vh` clamps
- Marquee scrolling too fast / slow → adjust the `30s` keyframe duration in globals.css
- Cross-fade too aggressive at 5s → slow to 7s by changing `SWAP_INTERVAL_MS`
- Title overlay illegible against bright tile backgrounds → strengthen the `from-black/60` gradient mask in `HeroMosaic`

If a fix is needed, commit with `fix(gallery):` prefix and push.

---

## Self-Review

**Spec coverage:**
- Hero mosaic with breathing + cross-fade + active-video → Tasks 1, 2 ✓
- Marquee strip with seamless loop + hover pause → Task 3 ✓
- Page restructure (move search/filters down, rename divider, delete old masonry) → Task 4 ✓
- Mobile breakpoints → Task 2 (HeroMosaic), Task 3 (MarqueeStrip CSS) ✓
- prefers-reduced-motion fallback → Task 1 (mosaic) + Task 3 (marquee) CSS ✓
- Empty-state fallback (no items) → Task 2 (HeroMosaic returns the "No memories yet" card; MarqueeStrip returns null) ✓
- Manual verification → Task 5 ✓

**Placeholder scan:** No "TBD"/"TODO". All steps include exact code or exact commands.

**Type consistency:** `MosaicTile` props match `HeroMosaic`'s usage (`photo, isActiveVideo, phaseIndex, onClick`). `GalleryPhoto` interface is imported from `@/app/gallery/page` in both new components, matching the existing exported interface. `MediaType` literal `'VIDEO'`/`'IMAGE'` consistent throughout. `buildLoopedEmbedUrl` is local to MosaicTile (not the same as VideoPlayer's `buildEmbedUrl` — they have different param sets, looped vs lightbox).

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-01-gallery-cinematic-mosaic.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
