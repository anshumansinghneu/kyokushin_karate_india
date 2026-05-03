# Seminar Lightbox Redesign

## Problem

The current seminar-page lightbox (`frontend/src/app/seminars/page.tsx`, lines 86-188) opens images poorly:

- Uses `z-50` without a React portal, so the site navbar competes for the same stacking layer and bleeds through.
- Image is constrained to `w-[90vw] h-[80vh]` with `object-contain`, leaving large black bars around portrait/square photos.
- Provides no seminar context (title, date, location) and no share/download affordances.
- Lacks swipe navigation and a thumbnail strip — only dot indicators and arrows.

The site's gallery page (`frontend/src/app/gallery/page.tsx`) already has a polished portaled lightbox at `z-[100]` with all of the above. The seminars page should reach the same bar, with one extra touch (a thumbnail strip) that fits the small per-seminar photo set well.

## Solution

Replace just the `Lightbox` component in `seminars/page.tsx`. The mosaic gallery components, section layouts, and data flow stay unchanged. Both `SeminarSection` (hardcoded showcase) and `DBSeminarSection` (DB-fetched) consume the same `Lightbox`, so both benefit.

### Component shape

```
<Lightbox
  images={string[]}
  index={number}
  title={string}
  date={string}
  location={string}
  onClose={() => void}
/>
```

`title`, `date`, `location` are new props. Both call sites already have these values in scope.

### Visual / behavior spec

- **Portal**: rendered via the existing `components/ui/portal.tsx` so it escapes any containing block and z-index context.
- **Backdrop**: cinematic — a blurred copy of the *current* image fills the viewport with `scale-110 blur-3xl opacity-50`, plus a `bg-black/85 backdrop-blur-xl` overlay on top. No black bars; image-aware mood.
- **Top bar** (glass card, `bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl`):
  - Left: seminar title (line-clamped), small row beneath with date + location pills.
  - Right: Share button (uses `navigator.share` when available, else clipboard), Close (X) button. Both use the same chip styling as the gallery lightbox.
- **Main image area**:
  - `max-h-[78vh] max-w-[90vw]` with `object-contain` and a soft `drop-shadow-2xl`.
  - Crossfade between images on navigation (Framer Motion `key={current}`, opacity + slight scale).
  - Click on the backdrop closes; click on the image itself does not.
- **Side arrows**: same chip styling as gallery (`p-3 sm:p-4 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-md`). Hidden when at first/last image.
- **Counter pill**: bottom-left, `2 / 6` style, in a small glass pill.
- **Thumbnail strip**: bottom-center, horizontally scrollable when overflowing. Each thumb is `h-14 w-20 rounded-lg`. Active thumb gets `ring-2 ring-red-500`. Inactive thumbs at `opacity-50`, hover `opacity-100`.
- **Swipe**: drag-x on the image area with `dragConstraints={{ left: 0, right: 0 }}` and `dragElastic={0.2}` — same threshold (80px) as gallery.
- **Keyboard**: Escape closes; ←/→ navigate (already present, kept).
- **Body scroll lock** on open (already present, kept).

### Out of scope

- The mosaic gallery layouts (`MosaicGallery6`, `MosaicGallery3`) — they look fine on the page; the issue is the *open* experience.
- Any DB or upload-flow changes.
- Changes to the gallery page lightbox.

### Files touched

- `frontend/src/app/seminars/page.tsx` — replace the `Lightbox` function body, add `title`/`date`/`location` props, update both call sites (`SeminarSection`, `DBSeminarSection`) to pass the new props.

## Acceptance check

- Open any seminar image in the browser; the lightbox covers the navbar (no bleed-through).
- Image fills the viewport area without large black bars; backdrop is the blurred image, not solid black.
- Title + date + location visible at the top.
- Thumbnail strip at the bottom is clickable and scrolls into view on the active image.
- Arrow keys, ←/→ on screen, swipe (touch), and clicking thumbnails all navigate.
- Escape and the X button close. Clicking the backdrop closes.
