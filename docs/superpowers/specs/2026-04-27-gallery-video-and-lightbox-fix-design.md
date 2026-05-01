# Gallery: Video Embeds + Lightbox Fix — Design

**Date:** 2026-04-27
**Status:** Approved (pending implementation plan)
**Scope:** Add YouTube/Vimeo video embeds to the existing gallery, give them a distinct visual treatment in the masonry feed, fix the lightbox image-distortion bug, and allow videos in albums.

---

## Goals

1. Admins and instructors can post YouTube or Vimeo links to the gallery; the system extracts the embed metadata and stores a thumbnail.
2. Videos appear inline in the same gallery feed as photos, but with a "spotlight" treatment that makes them visually distinct.
3. Clicking a video opens it in the existing lightbox with a working embedded player and keyboard / swipe navigation between neighbors.
4. The lightbox renders images with their true aspect ratio — no distortion across square, portrait, landscape, and panoramic photos.
5. Albums can contain both photos and videos.

## Non-Goals

- Direct video file uploads to Supabase Storage. (Considered and rejected: bandwidth/storage cost, no streaming optimization. Videos are external embeds only.)
- A separate "Videos" tab on the gallery page. (Mixed feed only.)
- Letting non-instructor users submit videos. (Admin and instructor only.)
- Editing video metadata after the fact (out of scope; delete + re-post if needed).
- Hover-to-autoplay cinemagraph previews on the masonry tiles (deferred — possible follow-up).

---

## Architecture

### Data model

Extend the existing `Gallery` model rather than creating a separate `Video` model. The gallery feed is unified, ordering is shared, and the existing `AlbumPhoto` join table already references `Gallery` records, so albums work for both with no schema changes.

```prisma
enum MediaType {
  IMAGE
  VIDEO
}

model Gallery {
  // ... existing fields unchanged ...
  imageUrl       String      // For VIDEO rows: stores the thumbnail URL (not the embed)
  mediaType      MediaType   @default(IMAGE)
  videoUrl       String?     // The original YouTube/Vimeo URL admin pasted (null for images)
  videoProvider  String?     // "youtube" | "vimeo" (null for images)
  videoId        String?     // Extracted ID, used for embed (null for images)
  duration       Int?        // Seconds, optional, surfaced as a duration pill
}
```

**Why `imageUrl` doubles as the video thumbnail:** the masonry grid already renders `imageUrl`. Reusing the field means every existing tile-rendering path works unchanged — no `if (mediaType === VIDEO)` branches just to decide which URL to show. The "is this a video?" branch is only needed where behavior actually differs (badge overlay, click handler, lightbox content).

### Backend: video upload endpoint

New route: `POST /api/gallery/video`, protected by `restrictTo('ADMIN', 'INSTRUCTOR')`.

Request body:
```json
{
  "videoUrl": "https://www.youtube.com/watch?v=...",
  "caption": "...",
  "eventId": "...",   // optional
  "dojoId": "...",    // optional
  "albumId": "..."    // optional, links to album like the existing photo flow
}
```

Server logic:
1. Parse `videoUrl` with regex covering YouTube (`youtube.com/watch`, `youtu.be/`, `youtube.com/embed/`, `youtube.com/shorts/`) and Vimeo (`vimeo.com/<id>`). Extract `provider` and `id`. Return 400 with a clear message if unparseable.
2. Fetch oEmbed metadata (no API key required for either provider):
   - YouTube: `https://www.youtube.com/oembed?url=<videoUrl>&format=json`
   - Vimeo: `https://vimeo.com/api/oembed.json?url=<videoUrl>`
3. From the oEmbed response, extract `thumbnail_url` and (for Vimeo) `duration`. YouTube oEmbed doesn't return duration, so for YouTube `duration` stays null and the duration pill is hidden on those tiles.
4. Auto-approve since the submitter is admin or instructor. Insert the `Gallery` row with `mediaType=VIDEO`, `imageUrl=<thumbnail_url>`, `videoUrl`, `videoProvider`, `videoId`, `duration`.
5. If `albumId` is supplied, link via `AlbumPhoto` exactly like the existing photo flow.

The existing `POST /api/gallery` (image upload) is unchanged. Listing endpoint `GET /api/gallery` already returns all approved rows; the new fields ride along automatically.

### Frontend: dashboard upload UI

In `AlbumManager` (and wherever instructors currently upload photos), add a sibling control: an "Add video" button that opens a small modal with a single text input ("Paste YouTube or Vimeo URL"), an optional caption, and a Save button. On submit, POST to `/api/gallery/video`. Errors from the parsing step display inline.

### Frontend: spotlight tile in the masonry

Modify `FloatingPhoto` (or extract a sibling `FloatingVideo` if the conditional grows hairy) so a video tile:

- **Spans 2 columns** in the masonry. CSS columns don't natively support per-item span; we'll achieve this by giving video tiles `column-span: all` is too aggressive — instead, wrap each video tile in a container that uses `width: calc(2 * 100% + var(--gap))` with `margin-right: -100%` style trick, or more cleanly: switch the masonry to a CSS Grid with `grid-auto-flow: dense` and `grid-column: span 2` for videos. **Decision: switch to CSS Grid masonry** (using `grid-template-rows: masonry` where supported, falling back to a packed CSS Grid). Cleaner, supports per-item spans natively.
- Has a soft red glow ring (box-shadow with `rgba(220,38,38,0.25)` blur 30, intensifies on hover).
- Has a centered 60 px play button: semi-transparent white circle, red `Play` lucide icon. Pulses on hover.
- Has a duration pill bottom-right (only when `duration != null`): `5:42` format, `bg-black/70 backdrop-blur-md text-white`.
- Click opens the lightbox at this item's index, same as photos.

### Frontend: lightbox player

The existing lightbox (`gallery/page.tsx` lines 532–647) is conditionally rendered by `lightboxIndex`. Currently it always renders `<motion.img>`. Change to:

```tsx
{photos[lightboxIndex].mediaType === 'VIDEO' ? (
  <VideoPlayer photo={photos[lightboxIndex]} />
) : (
  <LightboxImage photo={photos[lightboxIndex]} />
)}
```

`VideoPlayer` renders an `<iframe>` with the provider-appropriate embed URL:
- YouTube: `https://www.youtube.com/embed/<id>?autoplay=1&mute=1&rel=0`
- Vimeo: `https://player.vimeo.com/video/<id>?autoplay=1&muted=1`

Sized at 16:9 within a `max-w-full max-h-[85vh]` box (use `aspect-video` plus `max-h` so the box shrinks to fit short viewports).

Top-bar controls swap when current item is a video:
- Share button copies the original `videoUrl` instead of the page URL.
- Download button is replaced with "Watch on YouTube/Vimeo" — same styling, external link icon, opens `videoUrl` in a new tab.

Keyboard arrows and swipe navigation continue to work — they just change `lightboxIndex`, and the renderer picks image-vs-video based on the new item.

### Frontend: lightbox image distortion fix

Two changes to the existing lightbox image render:

1. **Wrap the image in a sized box** to defeat flex-child max-width edge cases:
   ```tsx
   <div className="relative flex items-center justify-center max-w-full max-h-[85vh]">
     <img
       src={...}
       className="w-auto h-auto max-w-full max-h-full object-contain ..."
     />
   </div>
   ```
   This guarantees the image's intrinsic aspect ratio is preserved regardless of how the flex parent computes child constraints.

2. **Drop the scale animation, keep opacity only.** The current `initial={{ scale: 0.9 }} animate={{ scale: 1 }}` re-runs each time `key` changes, and during fast navigation can render mid-spring at a non-1 scale, which combined with non-square containers can read as distortion. Replace with a plain opacity fade using a CSS transition, no transform. (If a subtle scale-in is wanted later, it can be done with `transform-origin: center` and a settle duration shorter than the typical click cadence.)

After this, manually verify in the browser with four test photos at: square 1:1, portrait 3:4, landscape 16:9, panoramic 3:1. Each must render at its true aspect ratio with no compression on either axis.

---

## Components & Files Affected

**Backend:**
- `backend/prisma/schema.prisma` — add `MediaType` enum + new fields on `Gallery`
- New migration
- `backend/src/controllers/galleryController.ts` — new `uploadGalleryVideo` handler; update `getGalleryItems` to include new fields (Prisma will include them by default once added)
- `backend/src/routes/galleryRoutes.ts` — register `POST /video` with `restrictTo('ADMIN', 'INSTRUCTOR')`
- New utility `backend/src/utils/videoEmbed.ts` — URL parsing + oEmbed fetch

**Frontend:**
- `frontend/src/app/gallery/page.tsx` — split masonry into a CSS Grid layout; add video tile spotlight rendering; lightbox player branch; image-distortion fix
- `frontend/src/components/dashboard/AlbumManager.tsx` (or sibling) — "Add video" modal
- `frontend/src/components/gallery/VideoPlayer.tsx` (new) — iframe wrapper
- `frontend/src/components/gallery/SpotlightVideoTile.tsx` (new, if conditional grows complex)
- `GalleryPhoto` interface in `gallery/page.tsx` — extend with `mediaType`, `videoUrl`, `videoProvider`, `videoId`, `duration`

**Album detail page** (`frontend/src/app/gallery/albums/[id]/page.tsx`) needs the same video tile + lightbox treatment for consistency.

---

## Error Handling

- Unparseable video URL → 400 with `"Could not parse video URL. Supported: YouTube and Vimeo links."`
- oEmbed request fails (provider down, video private/deleted) → 502 with `"Video metadata could not be fetched. Verify the video is public and try again."`
- Duplicate video (same `videoUrl` already in gallery, optional) → no de-dup constraint enforced; admin can delete dupes manually.
- iframe fails to load in lightbox → fallback to a "Watch on YouTube/Vimeo" link inside the lightbox box.

## Testing

**Backend:**
- Unit tests on `videoEmbed.ts` parser: each YouTube URL form, each Vimeo URL form, and rejection cases.
- Integration test: `POST /api/gallery/video` succeeds for instructor, 403 for student, 400 for malformed URL.

**Frontend (manual, in-browser, on a deployed preview):**
- Spotlight tile renders 2 columns wide and visually distinct on desktop and mobile breakpoints.
- Click video → lightbox opens with iframe player, autoplays muted.
- Arrow keys / swipe navigate between mixed photo and video items without remounting wrong renderer.
- Image distortion fix: square, portrait, landscape, panoramic photos all render at correct aspect.
- Album detail page: videos display correctly alongside photos.
- Dashboard: instructor can add a video; student cannot see the "Add video" button.
