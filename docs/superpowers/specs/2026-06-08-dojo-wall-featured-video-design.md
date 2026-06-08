# Dojo Wall — Featured-Video Masonry

**Date:** 2026-06-08
**Status:** Approved design
**Surface:** `frontend/src/app/gallery/page.tsx` (the public "THE DOJO WALL" gallery page)

## Goal

Replace the random-swap `HeroMosaic` at the top of the gallery page with a
content-ordered masonry wall: the most recent video is an autoplaying featured
centerpiece, every other cell is a click-to-play thumbnail (photo or video), and
the ordering is time-gated so first-load shows only recent uploads while older
items mix in after the visitor has been on the site for 10 minutes.

## Key constraint discovered during brainstorming

Videos are **not self-hosted files**. They are YouTube/Vimeo embeds described by
`videoProvider` (`"youtube" | "vimeo"`), `videoId`, `videoUrl`, and `duration`
on the `GalleryPhoto` type. The original request assumed HTML5 `<video>` with
`poster`, `preload="none"`, and `<source>` (webm/mp4). None of those attributes
apply. The spec is therefore adapted to iframes while preserving the *intent* of
every requirement:

| Original (file-based) intent | Iframe adaptation |
|---|---|
| Featured `<video autoPlay muted loop playsInline>` | Featured iframe with `autoplay=1&mute=1&loop=1&playsinline=1` (existing `buildLoopedEmbedUrl`) |
| `poster` while loading | Thumbnail `<img>` (`imageUrl`) painted under the iframe |
| Small unmute button overlay | Unmute toggle that `postMessage`s the player |
| IntersectionObserver pauses featured off-screen | IO sends `postMessage` pause/play (no unmount, so no re-buffer) |
| Other videos click-to-play, `preload="none"` | Other videos are static thumbnails; iframe only mounts on click (in the lightbox) |
| Never autoplay more than one video | Only the featured iframe is ever mounted on the wall; click-to-play opens one lightbox video at a time |
| Lazy-load all video files; compressed/CDN/webm+mp4 | N/A — YouTube/Vimeo already serve adaptive, CDN-backed streams; only the featured embed loads on page load |

## Decisions (locked)

- **Target page:** Replace `HeroMosaic` on the main `/gallery` page. `MarqueeStrip`
  ("LATEST UPLOADS"), the search/filter dock, albums grid, and the lightbox are
  unchanged.
- **Layout:** Mixed — videos and photos interleaved in one wall, sorted newest-first.
- **Video mechanics:** Adapt to YouTube/Vimeo iframes (above).
- **Initial count:** `RECENT_COUNT = 12` newest items shown before the time gate opens.
- **Non-featured video interaction:** Opens the existing lightbox (`VideoPlayer`)
  rather than swapping to inline play — reuses polished UI and guarantees one
  video at a time.

## Architecture

Four new units, plus edits to `gallery/page.tsx`.

```
gallery/page.tsx
  └─ <DojoWall pool={photos} onTileClick={openLightboxById}
               onTileIdsChange={handleHeroTileIdsChange} />   ← replaces <HeroMosaic>
       ├─ useDojoWallOrder(pool)        ← ordering + time gate
       ├─ <FeaturedVideo photo=.. />    ← autoplay iframe, unmute, IO pause
       └─ <WallTile photo=.. /> × N     ← thumbnail + play badge, click → lightbox
```

### 1. `useDojoWallOrder(pool)` hook

File: `frontend/src/components/gallery/useDojoWallOrder.ts`

Owns all ordering and the 10-minute gate. Pure of rendering.

Returns:
```ts
{
  featured: GalleryPhoto | null;   // newest VIDEO, else newest item (photo)
  tiles: GalleryPhoto[];           // ordered items to render as WallTiles (excludes featured)
}
```

Logic:
1. `sorted = [...pool].sort(desc by uploadedAt)`.
2. `featured = sorted.find(mediaType === 'VIDEO') ?? sorted[0] ?? null`.
3. `rest = sorted without featured`.
4. First-visit timestamp:
   - `KEY = "dojowall:first-visit"`. On mount, read it; if absent, write `Date.now()`.
   - Guard for SSR / `localStorage` unavailable (try/catch, treat as "just visited").
5. Gate:
   - `GATE_MS = 10 * 60 * 1000`, `RECENT_COUNT = 12`.
   - `elapsed = Date.now() - firstVisit`.
   - State `gateOpen` initialized to `elapsed >= GATE_MS`.
   - If not yet open, `setTimeout(() => setGateOpen(true), GATE_MS - elapsed)` (cleared on unmount).
6. Output ordering:
   - `recent = rest.slice(0, RECENT_COUNT)` (already newest-first).
   - `older = rest.slice(RECENT_COUNT)`.
   - When `gateOpen`: `tiles = [...recent, ...shuffledOlder]`; else `tiles = recent`.
   - **Shuffle once:** `shuffledOlder` is computed once when the gate opens and stored
     in a `useRef`, so subsequent renders reuse the same order (Fisher–Yates). Re-derive
     only if the `older` set identity changes (e.g. new page of photos loads — see
     Edge cases).

### 2. `FeaturedVideo` component

File: `frontend/src/components/gallery/FeaturedVideo.tsx`

Props: `{ photo: GalleryPhoto; onClick: () => void }`.

- If `photo.mediaType !== 'VIDEO'` (no videos in pool): render the thumbnail image
  only (acts as a large hero photo, click → lightbox). No iframe.
- If video:
  - Thumbnail `<img src={getImageUrl(photo.imageUrl)}>` fills the cell (poster layer).
  - `<iframe>` with looped/muted/autoplay URL, **plus `enablejsapi=1`** (YouTube) so
    `postMessage` works. Vimeo already accepts `postMessage` with no extra flag.
  - **Unmute button** overlay (bottom-right). Toggles muted state and posts:
    - YouTube: `{"event":"command","func":"unMute"|"mute","args":[]}`
    - Vimeo: `{"method":"setVolume","value":1|0}`
  - **IntersectionObserver** on the container (`threshold ~0.25`):
    - leaving view → post pause (`pauseVideo` / `{"method":"pause"}`)
    - entering view → post play (`playVideo` / `{"method":"play"}`)
  - The iframe is `pointer-events-none`; a transparent overlay captures the click →
    `onClick()` opens the lightbox for full controls.
- Helper `buildFeaturedEmbedUrl(provider, videoId)` — like `buildLoopedEmbedUrl`
  but adds `enablejsapi=1`. Keep `buildLoopedEmbedUrl` for reference or refactor
  `MosaicTile` is not needed (MosaicTile is being removed from this page).

### 3. `WallTile` component

File: `frontend/src/components/gallery/WallTile.tsx`

Props: `{ photo: GalleryPhoto; onClick: () => void }`.

- Thumbnail `<img loading="lazy">` (poster).
- Video → play-badge overlay + duration label (`formatDuration`, reused/extracted).
- Photo → hover scrim / maximize affordance (port the look from `FloatingPhoto`).
- Red-glow border treatment for videos (port from existing `FloatingPhoto` styling).
- Click → `onClick()` (opens lightbox). No iframe ever mounts here.
- Lazy reveal with IntersectionObserver (port existing `inView` pattern) for the
  fade-in, consistent with the rest of the page.

### 4. `DojoWall` component

File: `frontend/src/components/gallery/DojoWall.tsx`

Props mirror what `gallery/page.tsx` passed `HeroMosaic`:
`{ pool: GalleryPhoto[]; onTileClick: (id: string) => void; onTileIdsChange?: (ids: string[]) => void }`
(`paused` is no longer needed — there is no swap timer.)

- Calls `useDojoWallOrder(pool)`.
- Notifies parent of visible IDs via `onTileIdsChange` (so `MarqueeStrip` keeps
  de-duplicating) — report `[featured.id, ...tiles.map(id)]`.
- Renders the title overlay "THE DOJO WALL" (port markup from `HeroMosaic`).
- **Desktop grid** (`md:` and up): CSS grid, `grid-template-columns: repeat(5, 1fr)`,
  `grid-auto-rows` sized for ~square tiles, `gap`. Featured cell:
  `md:col-span-3 md:row-span-2` (~60–62% width, two rows tall). Tiles flow into the
  remaining cells in order.
- **Mobile** (`< md`): `grid-cols-1`. Featured renders full-width at the top, tiles
  stacked below. No forced spanning.
- Empty state (`pool.length === 0`): keep HeroMosaic's "No memories yet" message.

### Edits to `gallery/page.tsx`

- Replace the `<HeroMosaic ... />` element with `<DojoWall ... />` (drop `paused`).
- Remove the `HeroMosaic` import; add `DojoWall`.
- Everything else (state, fetch, marquee, lightbox, albums) unchanged.
- `MosaicTile.tsx` and `HeroMosaic.tsx` become unused by this page. Leave the files
  in place for now (out of scope to delete; no other consumers verified), or delete
  if confirmed unused — implementation plan will check for other imports.

## Data flow

`fetchPhotos()` → `photos` state (newest-first from `/gallery`, `limit=24`) →
`DojoWall` → `useDojoWallOrder` derives `featured` + `tiles` → render. Clicks bubble
up through `onTileClick` → `openLightboxById` → existing lightbox. The lightbox is
the only place a non-featured video iframe ever mounts.

## Performance

- Exactly **one** iframe (the featured video) on initial paint.
- All other media are `<img loading="lazy">`.
- Non-featured video iframes mount only on click, inside the lightbox, one at a time.
- This is the iframe-world equivalent of `preload="none"` + click-to-play, and is
  the core protection for mobile load time and data.

## Edge cases

- **No videos in pool:** featured cell shows the newest photo (large hero), no iframe.
- **Pool smaller than `RECENT_COUNT`:** `older` is empty; gate has no visible effect.
- **More photos load (pagination, `photoPage++`):** `pool` grows; `useDojoWallOrder`
  re-derives. The shuffled-older order is keyed off the older-set contents so it stays
  stable unless the set actually changes; document that paginating may re-stabilize a
  new shuffle for newly arrived older items (acceptable — newest items up top are
  always stable and in date order).
- **`localStorage` blocked/unavailable:** treat as a fresh visit (gate closed); never throw.
- **SSR:** hook is client-only (`"use client"` already on these components); read
  `localStorage` inside `useEffect`, not during render.
- **postMessage origin:** target `"*"` is acceptable for these public players; include
  the documented message shapes per provider.

## Testing

- `useDojoWallOrder` is the unit with logic worth testing in isolation:
  - newest video chosen as featured; newest photo when no videos.
  - before gate: only `RECENT_COUNT` tiles; after gate: recent + older.
  - older batch shuffled once and stable across re-renders.
  - first-visit timestamp persists (reload does not reset the gate).
  - `localStorage` failure path does not throw.
- Components (`FeaturedVideo`, `WallTile`, `DojoWall`) verified by running the app:
  featured autoplays muted, unmute works, scrolling away pauses it, thumbnails are
  click-to-play, mobile stacks single-column. (Manual/visual — matches how the rest
  of this gallery is verified.)

## Out of scope

- `/gallery/all` browse page (unchanged).
- Backend/`/gallery` API ordering (already `uploadedAt` desc).
- Self-hosting videos / webm+mp4 transcoding pipeline.
- Album management and `AlbumManager.tsx`.
