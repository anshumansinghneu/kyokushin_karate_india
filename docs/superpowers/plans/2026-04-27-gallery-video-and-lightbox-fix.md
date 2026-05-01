# Gallery Video Embeds + Lightbox Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add YouTube/Vimeo video embeds to the existing gallery with admin/instructor-only upload, render videos with a "spotlight" treatment in the masonry feed, fix a lightbox image-distortion bug, and allow videos in albums.

**Architecture:** Extend the existing `Gallery` Prisma model with `mediaType` + video fields rather than introducing a separate model — the gallery feed is unified and `AlbumPhoto` join already references `Gallery`. Backend adds one new endpoint that parses the URL, fetches oEmbed metadata, and stores a row. Frontend switches the masonry from CSS columns to CSS Grid (so video tiles can `grid-column: span 2`), branches the lightbox renderer between `<img>` and `<iframe>`, and rewrites the lightbox image wrapper to defeat a flex-child max-width bug that distorts aspect ratios.

**Tech Stack:** Prisma, Express/TypeScript, Next.js 14 App Router, React, framer-motion, Tailwind, lucide-react, Supabase Storage (unaffected — videos are external embeds), YouTube + Vimeo public oEmbed APIs.

**Test approach:** This codebase has no Jest/Vitest setup. Following the existing convention in `backend/scripts/`, backend logic is verified via standalone TypeScript scripts run with `ts-node`. Frontend changes are verified manually in the browser at the end. Each backend script step exits with code 0 on pass, non-zero on fail.

**Spec:** `docs/superpowers/specs/2026-04-27-gallery-video-and-lightbox-fix-design.md`

---

### Task 1: Add `MediaType` enum and video fields to `Gallery` model

**Files:**
- Modify: `backend/prisma/schema.prisma` (Gallery model around line 438)

- [ ] **Step 1: Edit schema**

In `backend/prisma/schema.prisma`, add this enum near the other enums (search for `enum Role` or similar to find the enum cluster):

```prisma
enum MediaType {
  IMAGE
  VIDEO
}
```

Then in the `Gallery` model (currently around line 438), add the new fields. The full updated model should read:

```prisma
model Gallery {
  id                String    @id @default(uuid())
  uploadedBy        String
  uploader          User      @relation("GalleryUploader", fields: [uploadedBy], references: [id])
  imageUrl          String

  eventId           String?
  event             Event?    @relation(fields: [eventId], references: [id])
  dojoId            String?
  dojo              Dojo?     @relation("DojoGallery", fields: [dojoId], references: [id])

  isApproved        Boolean   @default(false)
  isPublicFeatured  Boolean   @default(false)
  approvedBy        String?
  approver          User?     @relation("GalleryApprover", fields: [approvedBy], references: [id])
  approvedAt        DateTime?

  caption           String?
  uploadedAt        DateTime  @default(now())

  mediaType         MediaType @default(IMAGE)
  videoUrl          String?
  videoProvider     String?
  videoId           String?
  duration          Int?

  albums            AlbumPhoto[]
}
```

- [ ] **Step 2: Generate and run the migration**

Run from `backend/`:

```bash
cd backend
npx prisma migrate dev --name add_gallery_media_type
```

Expected: prisma generates `prisma/migrations/<timestamp>_add_gallery_media_type/migration.sql` and applies it. Check the generated SQL contains `ADD COLUMN "mediaType" "MediaType" NOT NULL DEFAULT 'IMAGE'` (or similar) and `CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO')`.

- [ ] **Step 3: Regenerate Prisma client**

```bash
cd backend
npx prisma generate
```

Expected: `✔ Generated Prisma Client`.

- [ ] **Step 4: Commit**

```bash
cd /Users/anshumansingh/kyokushin_karate
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat(gallery): add MediaType enum and video fields to Gallery model"
```

---

### Task 2: Video URL parser utility

**Files:**
- Create: `backend/src/utils/videoEmbed.ts`
- Create: `backend/scripts/verify_video_embed_parser.ts`

- [ ] **Step 1: Write the verification script first**

Create `backend/scripts/verify_video_embed_parser.ts`:

```typescript
import { parseVideoUrl } from '../src/utils/videoEmbed';

type Case = { url: string; expected: { provider: string; id: string } | null; label: string };

const cases: Case[] = [
  { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expected: { provider: 'youtube', id: 'dQw4w9WgXcQ' }, label: 'youtube watch' },
  { url: 'https://youtu.be/dQw4w9WgXcQ', expected: { provider: 'youtube', id: 'dQw4w9WgXcQ' }, label: 'youtu.be short' },
  { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', expected: { provider: 'youtube', id: 'dQw4w9WgXcQ' }, label: 'youtube embed' },
  { url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ', expected: { provider: 'youtube', id: 'dQw4w9WgXcQ' }, label: 'youtube shorts' },
  { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s', expected: { provider: 'youtube', id: 'dQw4w9WgXcQ' }, label: 'youtube with timestamp' },
  { url: 'https://vimeo.com/123456789', expected: { provider: 'vimeo', id: '123456789' }, label: 'vimeo basic' },
  { url: 'https://player.vimeo.com/video/123456789', expected: { provider: 'vimeo', id: '123456789' }, label: 'vimeo player' },
  { url: 'https://example.com/video.mp4', expected: null, label: 'random url rejected' },
  { url: 'not a url', expected: null, label: 'garbage rejected' },
  { url: '', expected: null, label: 'empty rejected' },
];

let failed = 0;
for (const c of cases) {
  const got = parseVideoUrl(c.url);
  const ok = JSON.stringify(got) === JSON.stringify(c.expected);
  console.log(`${ok ? '✅' : '❌'} ${c.label}: got=${JSON.stringify(got)} expected=${JSON.stringify(c.expected)}`);
  if (!ok) failed++;
}

console.log(`\n${cases.length - failed}/${cases.length} passed`);
process.exit(failed === 0 ? 0 : 1);
```

- [ ] **Step 2: Run the verifier — confirm it fails**

```bash
cd backend
npx ts-node scripts/verify_video_embed_parser.ts
```

Expected: fails with `Cannot find module '../src/utils/videoEmbed'`.

- [ ] **Step 3: Implement the parser**

Create `backend/src/utils/videoEmbed.ts`:

```typescript
export interface ParsedVideo {
  provider: 'youtube' | 'vimeo';
  id: string;
}

const YOUTUBE_REGEXES: RegExp[] = [
  /(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/,
  /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
];

const VIMEO_REGEXES: RegExp[] = [
  /(?:vimeo\.com\/)(\d+)/,
  /(?:player\.vimeo\.com\/video\/)(\d+)/,
];

export function parseVideoUrl(url: string): ParsedVideo | null {
  if (!url || typeof url !== 'string') return null;

  for (const re of YOUTUBE_REGEXES) {
    const m = url.match(re);
    if (m) return { provider: 'youtube', id: m[1] };
  }

  for (const re of VIMEO_REGEXES) {
    const m = url.match(re);
    if (m) return { provider: 'vimeo', id: m[1] };
  }

  return null;
}
```

- [ ] **Step 4: Re-run the verifier — confirm pass**

```bash
cd backend
npx ts-node scripts/verify_video_embed_parser.ts
```

Expected: `10/10 passed`, exit code 0.

- [ ] **Step 5: Commit**

```bash
cd /Users/anshumansingh/kyokushin_karate
git add backend/src/utils/videoEmbed.ts backend/scripts/verify_video_embed_parser.ts
git commit -m "feat(gallery): add video URL parser for YouTube and Vimeo"
```

---

### Task 3: oEmbed metadata fetcher

**Files:**
- Modify: `backend/src/utils/videoEmbed.ts`
- Create: `backend/scripts/verify_video_embed_oembed.ts`

This task hits real network; the verify script is for manual confirmation, not regression-style automation.

- [ ] **Step 1: Add the oEmbed fetcher to `videoEmbed.ts`**

Append to `backend/src/utils/videoEmbed.ts`:

```typescript
export interface VideoMetadata {
  provider: 'youtube' | 'vimeo';
  id: string;
  thumbnailUrl: string;
  duration: number | null;
  title: string;
}

export async function fetchVideoMetadata(url: string): Promise<VideoMetadata> {
  const parsed = parseVideoUrl(url);
  if (!parsed) {
    throw new Error('Could not parse video URL. Supported: YouTube and Vimeo links.');
  }

  const oembedUrl =
    parsed.provider === 'youtube'
      ? `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
      : `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;

  const res = await fetch(oembedUrl);
  if (!res.ok) {
    throw new Error('Video metadata could not be fetched. Verify the video is public and try again.');
  }
  const data = (await res.json()) as { thumbnail_url?: string; duration?: number; title?: string };

  if (!data.thumbnail_url) {
    throw new Error('Video metadata missing thumbnail. Provider may have rejected the request.');
  }

  return {
    provider: parsed.provider,
    id: parsed.id,
    thumbnailUrl: data.thumbnail_url,
    duration: typeof data.duration === 'number' ? data.duration : null,
    title: data.title ?? '',
  };
}
```

Note: Node 18+ has global `fetch`. If `tsc` complains about missing types, add `@types/node` is already in dependencies — no change needed.

- [ ] **Step 2: Create the manual verify script**

Create `backend/scripts/verify_video_embed_oembed.ts`:

```typescript
import { fetchVideoMetadata } from '../src/utils/videoEmbed';

async function main() {
  const urls = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://vimeo.com/76979871',
  ];

  let failed = 0;
  for (const url of urls) {
    try {
      const meta = await fetchVideoMetadata(url);
      console.log(`✅ ${url}`);
      console.log(`   provider=${meta.provider} id=${meta.id}`);
      console.log(`   title="${meta.title}"`);
      console.log(`   thumbnail=${meta.thumbnailUrl}`);
      console.log(`   duration=${meta.duration ?? 'n/a'}`);
    } catch (e: any) {
      console.error(`❌ ${url}: ${e.message}`);
      failed++;
    }
  }

  // Bad URL must throw
  try {
    await fetchVideoMetadata('https://example.com/foo');
    console.error('❌ expected throw on bad URL but got success');
    failed++;
  } catch (e: any) {
    console.log(`✅ bad URL rejected: ${e.message}`);
  }

  process.exit(failed === 0 ? 0 : 1);
}

main();
```

- [ ] **Step 3: Run the verifier**

```bash
cd backend
npx ts-node scripts/verify_video_embed_oembed.ts
```

Expected: both real URLs print `✅` with thumbnail URLs from `i.ytimg.com` and `i.vimeocdn.com` respectively. The bad URL prints `✅ bad URL rejected: Could not parse...`. Exit code 0.

If the YouTube oEmbed call fails with a network error, the codebase deploys to Vercel/Render and may have outbound restrictions — note this and continue; the controller in Task 4 surfaces the error to the user.

- [ ] **Step 4: Commit**

```bash
cd /Users/anshumansingh/kyokushin_karate
git add backend/src/utils/videoEmbed.ts backend/scripts/verify_video_embed_oembed.ts
git commit -m "feat(gallery): add oEmbed metadata fetcher for YouTube and Vimeo"
```

---

### Task 4: Video upload controller and route

**Files:**
- Modify: `backend/src/controllers/galleryController.ts`
- Modify: `backend/src/routes/galleryRoutes.ts`

- [ ] **Step 1: Add the controller**

In `backend/src/controllers/galleryController.ts`, add at the top with the other imports:

```typescript
import { fetchVideoMetadata } from '../utils/videoEmbed';
```

Append this controller to the file (after the existing exports):

```typescript
// POST /api/gallery/video — Admin/Instructor: add a YouTube/Vimeo video to the gallery
export const uploadGalleryVideo = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { videoUrl, caption, eventId, dojoId, albumId } = req.body;

    if (!videoUrl) {
        throw new AppError('videoUrl is required', 400);
    }

    let meta;
    try {
        meta = await fetchVideoMetadata(videoUrl);
    } catch (err: any) {
        throw new AppError(err.message || 'Failed to fetch video metadata', 400);
    }

    const item = await prisma.gallery.create({
        data: {
            uploadedBy: userId,
            imageUrl: meta.thumbnailUrl,
            caption: caption || meta.title || null,
            eventId: eventId || null,
            dojoId: dojoId || null,
            isApproved: true,
            approvedBy: userId,
            approvedAt: new Date(),
            mediaType: 'VIDEO',
            videoUrl,
            videoProvider: meta.provider,
            videoId: meta.id,
            duration: meta.duration,
        },
        include: {
            uploader: { select: { id: true, name: true } },
            event: { select: { id: true, name: true } },
            dojo: { select: { id: true, name: true } },
        },
    });

    if (albumId) {
        try {
            const maxOrder = await prisma.albumPhoto.findFirst({
                where: { albumId },
                orderBy: { order: 'desc' },
                select: { order: true },
            });
            await prisma.albumPhoto.create({
                data: {
                    albumId,
                    galleryId: item.id,
                    order: (maxOrder?.order ?? -1) + 1,
                },
            });
        } catch (e: any) {
            if (e.code !== 'P2002' && e.code !== 'P2003') throw e;
        }
    }

    res.status(201).json({
        status: 'success',
        data: { item },
    });
});
```

- [ ] **Step 2: Register the route**

In `backend/src/routes/galleryRoutes.ts`, update the imports and add the route:

```typescript
import {
    getGalleryItems,
    uploadGalleryItem,
    uploadGalleryVideo,
    getPendingGalleryItems,
    approveGalleryItem,
    toggleFeatured,
    deleteGalleryItem,
} from '../controllers/galleryController';
```

Then add this route between the existing `POST /` and `DELETE /:id`:

```typescript
router.post('/video', protect, restrictTo('ADMIN', 'INSTRUCTOR'), uploadGalleryVideo);
```

- [ ] **Step 3: Smoke test with curl**

Start the backend:

```bash
cd backend
npm run dev
```

In another terminal, log in as an instructor (use an existing test account or create one) and grab the JWT, then:

```bash
curl -X POST http://localhost:5000/api/gallery/video \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"videoUrl":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","caption":"smoke test"}'
```

Expected: `201` status with a JSON body containing `data.item.mediaType === "VIDEO"`, `data.item.videoProvider === "youtube"`, `data.item.videoId === "dQw4w9WgXcQ"`, and `data.item.imageUrl` set to a `i.ytimg.com` URL.

Negative test (student token):

```bash
curl -X POST http://localhost:5000/api/gallery/video \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"videoUrl":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

Expected: `403`.

Negative test (bad URL):

```bash
curl -X POST http://localhost:5000/api/gallery/video \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"videoUrl":"not-a-real-url"}'
```

Expected: `400` with message `"Could not parse video URL. Supported: YouTube and Vimeo links."`

- [ ] **Step 4: Verify the row also appears in `GET /api/gallery`**

```bash
curl http://localhost:5000/api/gallery | jq '.data.items[0]'
```

Expected: the just-created video row appears with all new fields populated.

- [ ] **Step 5: Commit**

```bash
cd /Users/anshumansingh/kyokushin_karate
git add backend/src/controllers/galleryController.ts backend/src/routes/galleryRoutes.ts
git commit -m "feat(gallery): add POST /api/gallery/video endpoint"
```

---

### Task 5: Extend frontend `GalleryPhoto` interface

**Files:**
- Modify: `frontend/src/app/gallery/page.tsx` (lines 185–194)
- Modify: `frontend/src/app/gallery/albums/[id]/page.tsx` (find the local Photo interface — around the top)

- [ ] **Step 1: Update `GalleryPhoto` in `frontend/src/app/gallery/page.tsx`**

Replace the existing interface (lines 185–194):

```tsx
export type MediaType = 'IMAGE' | 'VIDEO';

export interface GalleryPhoto {
    id: string;
    imageUrl: string;
    caption: string | null;
    uploadedAt: string;
    isPublicFeatured: boolean;
    uploader: { id: string; name: string };
    event: { id: string; name: string } | null;
    dojo: { id: string; name: string } | null;
    mediaType: MediaType;
    videoUrl: string | null;
    videoProvider: string | null;
    videoId: string | null;
    duration: number | null;
}
```

- [ ] **Step 2: Mirror in album detail page**

In `frontend/src/app/gallery/albums/[id]/page.tsx`, find the local `Photo` interface (search for `interface Photo`) and add the same five new fields. Use exactly the same names and types.

- [ ] **Step 3: Verify the frontend type-checks**

```bash
cd frontend
npm run build
```

Expected: build succeeds. (Don't commit yet — the new fields are unused; later tasks will reference them.)

- [ ] **Step 4: Commit**

```bash
cd /Users/anshumansingh/kyokushin_karate
git add frontend/src/app/gallery/page.tsx frontend/src/app/gallery/albums/[id]/page.tsx
git commit -m "feat(gallery): extend GalleryPhoto/Photo types with video fields"
```

---

### Task 6: Fix lightbox image distortion

**Files:**
- Modify: `frontend/src/app/gallery/page.tsx` (lightbox image render, around lines 625–636)
- Modify: `frontend/src/app/gallery/albums/[id]/page.tsx` (its lightbox image render — find it via `<motion.img` around the lightbox section)

- [ ] **Step 1: Wrap the gallery page lightbox image**

In `frontend/src/app/gallery/page.tsx`, replace the existing `<motion.img>` block (currently around lines 625–635) with:

```tsx
<div className="relative flex items-center justify-center max-w-full max-h-[85vh]">
    <motion.img
        key={photos[lightboxIndex].id}
        src={getImageUrl(photos[lightboxIndex].imageUrl) || ""}
        alt={photos[lightboxIndex].caption || "Full screen photo"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="w-auto h-auto max-w-full max-h-[85vh] object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 pointer-events-none select-none"
        draggable={false}
    />
</div>
```

Two changes: removed the spring `scale` animation (which could render mid-spring at non-1 scale on rapid navigation), and the wrapper plus explicit `w-auto h-auto` defeats flex-child max-width edge cases that were distorting aspect ratio.

- [ ] **Step 2: Apply the same fix to the album detail page**

In `frontend/src/app/gallery/albums/[id]/page.tsx`, find the `<motion.img>` inside the lightbox block. Replace with the same wrapper structure (preserving any zoom-related logic that page already has — only swap the wrapper and drop the `scale` animation, keep zoom interactions intact).

- [ ] **Step 3: Manual browser verification**

Run the frontend:

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000/gallery`. With the dev tools open, upload (or seed) four test photos at distinct aspect ratios:
- Square 1:1 (e.g., 1000×1000)
- Portrait 3:4 (e.g., 900×1200)
- Landscape 16:9 (e.g., 1920×1080)
- Panoramic 3:1 (e.g., 3000×1000)

Click each in turn. Use the dev-tools "Inspect" to read the `<img>` element's computed `width` and `height`. The ratio `width / height` must equal the source file's ratio within rounding.

Repeat in `/gallery/albums/<some-id>` to confirm the album-page fix.

- [ ] **Step 4: Commit**

```bash
cd /Users/anshumansingh/kyokushin_karate
git add frontend/src/app/gallery/page.tsx frontend/src/app/gallery/albums/[id]/page.tsx
git commit -m "fix(gallery): preserve aspect ratio in lightbox image render"
```

---

### Task 7: Build the `VideoPlayer` component

**Files:**
- Create: `frontend/src/components/gallery/VideoPlayer.tsx`

- [ ] **Step 1: Create the component**

Create `frontend/src/components/gallery/VideoPlayer.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";

interface VideoPlayerProps {
    provider: string;        // "youtube" | "vimeo"
    videoId: string;
    title?: string;
}

export function buildEmbedUrl(provider: string, videoId: string): string {
    if (provider === 'youtube') {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&modestbranding=1`;
    }
    if (provider === 'vimeo') {
        return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1`;
    }
    return '';
}

export default function VideoPlayer({ provider, videoId, title }: VideoPlayerProps) {
    const src = buildEmbedUrl(provider, videoId);
    if (!src) {
        return (
            <div className="flex items-center justify-center w-full max-w-4xl aspect-video bg-zinc-900 rounded-xl border border-white/10 text-zinc-400 text-sm">
                Unsupported video provider.
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-5xl aspect-video max-h-[85vh] rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10"
        >
            <iframe
                src={src}
                title={title || 'Embedded video'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
            />
        </motion.div>
    );
}
```

- [ ] **Step 2: Verify it builds**

```bash
cd frontend
npm run build
```

Expected: build succeeds (component is unused so far, that's OK).

- [ ] **Step 3: Commit**

```bash
cd /Users/anshumansingh/kyokushin_karate
git add frontend/src/components/gallery/VideoPlayer.tsx
git commit -m "feat(gallery): add VideoPlayer component for embedded YouTube/Vimeo"
```

---

### Task 8: Lightbox — branch between image and video

**Files:**
- Modify: `frontend/src/app/gallery/page.tsx` (lightbox area, around lines 532–647)
- Modify: `frontend/src/app/gallery/albums/[id]/page.tsx` (its lightbox area)

- [ ] **Step 1: Import `VideoPlayer` in gallery page**

At the top of `frontend/src/app/gallery/page.tsx`, after the other imports:

```tsx
import VideoPlayer from "@/components/gallery/VideoPlayer";
import { ExternalLink } from "lucide-react";
```

- [ ] **Step 2: Branch the swipeable image area**

Replace the contents of the swipeable `motion.div` (the one with the drag handler, currently containing only the wrapped `<motion.img>` from Task 6). The new contents should branch on `mediaType`:

```tsx
{photos[lightboxIndex].mediaType === 'VIDEO' && photos[lightboxIndex].videoProvider && photos[lightboxIndex].videoId ? (
    <VideoPlayer
        provider={photos[lightboxIndex].videoProvider}
        videoId={photos[lightboxIndex].videoId}
        title={photos[lightboxIndex].caption || undefined}
    />
) : (
    <div className="relative flex items-center justify-center max-w-full max-h-[85vh]">
        <motion.img
            key={photos[lightboxIndex].id}
            src={getImageUrl(photos[lightboxIndex].imageUrl) || ""}
            alt={photos[lightboxIndex].caption || "Full screen photo"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-auto h-auto max-w-full max-h-[85vh] object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 pointer-events-none select-none"
            draggable={false}
        />
    </div>
)}
```

Important: the surrounding `motion.div` has an `onClick={() => setLightboxIndex(null)}` that closes the lightbox when clicking the background. The video iframe must NOT bubble its clicks up. The iframe naturally doesn't trigger onClick on its parent for clicks inside the iframe (cross-origin), so this is already correct — but verify in browser.

- [ ] **Step 3: Swap top-bar Share + Download for videos**

The current top-bar has Share, Download, Close. For videos:
- Share button: copy `videoUrl` instead of `window.location.href`
- Download button: replaced with "Watch on YouTube/Vimeo" external-link button

Replace the Share button onClick body so it copies the appropriate URL:

```tsx
onClick={async () => {
    const photo = photos[lightboxIndex!];
    const isVideo = photo.mediaType === 'VIDEO' && photo.videoUrl;
    const shareUrl = isVideo ? photo.videoUrl! : window.location.href;
    const shareData = {
        title: photo.caption || "Kyokushin Gallery",
        text: `${photo.caption || "Check out this"} by ${photo.uploader.name}`,
        url: shareUrl,
    };
    if (navigator.share) {
        try { await navigator.share(shareData); } catch {}
    } else {
        await navigator.clipboard.writeText(shareUrl);
    }
}}
```

Replace the Download `<a>` block with a conditional:

```tsx
{photos[lightboxIndex].mediaType === 'VIDEO' && photos[lightboxIndex].videoUrl ? (
    <a
        href={photos[lightboxIndex].videoUrl!}
        target="_blank"
        rel="noreferrer"
        className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-colors backdrop-blur-md hidden sm:flex"
        title={`Watch on ${photos[lightboxIndex].videoProvider === 'youtube' ? 'YouTube' : 'Vimeo'}`}
    >
        <ExternalLink className="w-5 h-5 text-white" />
    </a>
) : (
    <a
        href={getImageUrl(photos[lightboxIndex].imageUrl) || ""}
        download
        target="_blank"
        rel="noreferrer"
        className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-colors backdrop-blur-md hidden sm:flex"
    >
        <Download className="w-5 h-5 text-white" />
    </a>
)}
```

- [ ] **Step 4: Mirror in album detail page**

Apply the same three changes (import, branch, top-bar swap) to `frontend/src/app/gallery/albums/[id]/page.tsx`. The album page may have its own variations (zoom, etc.) — preserve those for the image branch only; the video branch always uses `<VideoPlayer />` without zoom.

- [ ] **Step 5: Manual browser verification**

```bash
cd frontend
npm run dev
```

Pre-seed at least one video via the curl from Task 4 (target the local backend). On `/gallery`, click the video tile (still showing as a photo until Task 10 — that's fine for this step). The lightbox should open with the YouTube/Vimeo player, autoplay muted. Arrow keys should navigate between mixed photos and videos with the correct renderer per item. Esc closes. The Share button should write the video URL to clipboard. The new external-link button should open the video on YouTube/Vimeo in a new tab.

- [ ] **Step 6: Commit**

```bash
cd /Users/anshumansingh/kyokushin_karate
git add frontend/src/app/gallery/page.tsx frontend/src/app/gallery/albums/[id]/page.tsx
git commit -m "feat(gallery): branch lightbox between image and video player"
```

---

### Task 9: Switch masonry from CSS columns to CSS Grid

**Files:**
- Modify: `frontend/src/app/gallery/page.tsx` (masonry container, line ~504)
- Modify: `frontend/src/app/gallery/albums/[id]/page.tsx` (masonry container, line ~451)

This task switches the layout primitive without yet changing how individual tiles look. After this step, photos still render the same; the prep is for Task 10 to add `grid-column: span 2` for video tiles.

- [ ] **Step 1: Replace gallery page masonry container**

In `frontend/src/app/gallery/page.tsx`, find:

```tsx
<div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-5 space-y-5 pb-16">
```

Replace with:

```tsx
<div
    className="grid gap-5 pb-16"
    style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gridAutoFlow: 'dense',
        gridAutoRows: '10px',
    }}
>
```

CSS Grid masonry-like behavior: items occupy a number of rows equal to their natural height divided by the auto-row height (10px), achieved with `grid-row-end: span <n>` per item. This is added in the next step.

Also remove the `break-inside-avoid mb-5` and the `space-y-5` mechanics. The `FloatingPhoto` outer wrapper needs to compute its row span based on its rendered height. Update `FloatingPhoto` to set `grid-row-end: span <calculated>` after the image loads:

In `FloatingPhoto`, add a state for `rowSpan`, and an effect that sets it after image load:

```tsx
const [rowSpan, setRowSpan] = useState(20);

const handleImageLoad = (img: HTMLImageElement) => {
    setLoaded(true);
    const rowHeight = 10;
    const gap = 20;
    const span = Math.ceil((img.getBoundingClientRect().height + gap) / (rowHeight + gap));
    setRowSpan(span);
};
```

Update the `<motion.div>` wrapper of `FloatingPhoto` to include:

```tsx
style={{ gridRowEnd: `span ${rowSpan}` }}
```

And update the `<img>`'s `onLoad` to:

```tsx
onLoad={(e) => handleImageLoad(e.currentTarget)}
```

Remove `className="break-inside-avoid mb-5 group cursor-pointer"` and replace with `className="group cursor-pointer"`.

- [ ] **Step 2: Same change in album detail page**

Apply the same masonry container change in `frontend/src/app/gallery/albums/[id]/page.tsx` line ~451 (current text: `<div className="columns-2 md:columns-3 lg:columns-4 gap-5">`). Update its `FloatingPhotoCard` analogously.

- [ ] **Step 3: Browser verification**

```bash
cd frontend
npm run dev
```

Open `/gallery`. Verify photos still tile in a packed grid that visually resembles masonry. Check on mobile width (DevTools responsive view) — should scale to fewer columns automatically due to `auto-fill, minmax(220px, 1fr)`.

If any photos render as overly tall or short, adjust the row-span calculation by tweaking the gap and rowHeight constants.

- [ ] **Step 4: Commit**

```bash
cd /Users/anshumansingh/kyokushin_karate
git add frontend/src/app/gallery/page.tsx frontend/src/app/gallery/albums/[id]/page.tsx
git commit -m "refactor(gallery): switch masonry layout from CSS columns to CSS Grid"
```

---

### Task 10: Spotlight video tile rendering

**Files:**
- Modify: `frontend/src/app/gallery/page.tsx` (FloatingPhoto component, lines 196–269)
- Modify: `frontend/src/app/gallery/albums/[id]/page.tsx` (FloatingPhotoCard component)

- [ ] **Step 1: Add a duration formatter utility**

At the top of `frontend/src/app/gallery/page.tsx`, near `seededRandom`:

```tsx
function formatDuration(seconds: number | null): string | null {
    if (seconds == null || seconds < 0) return null;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}
```

- [ ] **Step 2: Update imports for new icons**

Already imports `Camera, Play` aren't both there. Add `Play` to the lucide-react import in `frontend/src/app/gallery/page.tsx`:

```tsx
import {
    Camera, Search, Loader2, ImageIcon, FolderOpen, Tent,
    GraduationCap, Trophy, Swords, Dumbbell, Grid3X3,
    ChevronRight, ChevronLeft, Sparkles, X, Maximize2, Download, Share2,
    Image as ImageIconSVG, ExternalLink, Play
} from "lucide-react";
```

- [ ] **Step 3: Render spotlight treatment when `mediaType === 'VIDEO'`**

Modify `FloatingPhoto` so a video tile:
- Spans 2 grid columns: outer wrapper gets `gridColumn: 'span 2'` when `photo.mediaType === 'VIDEO'`
- Adds a soft red glow ring (intensifies on hover)
- Adds a centered play button overlay
- Adds a duration pill bottom-right when `duration != null`

Replace the `motion.div` style/className region of `FloatingPhoto`:

```tsx
const isVideo = photo.mediaType === 'VIDEO';
const durationLabel = formatDuration(photo.duration);

return (
    <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30, rotate: rotation }}
        animate={inView ? {
            opacity: 1,
            y: isHovered ? -8 : offsetY,
            rotate: isHovered ? 0 : rotation,
            scale: isHovered ? 1.04 : 1,
        } : {}}
        transition={{
            opacity: { duration: 0.5, delay: Math.min((index % 10) * 0.05, 0.5) },
            y: { type: "spring", stiffness: 200, damping: 20 },
            rotate: { type: "spring", stiffness: 200, damping: 20 },
            scale: { type: "spring", stiffness: 300, damping: 25 },
        }}
        className="group cursor-pointer"
        style={{ gridRowEnd: `span ${rowSpan}`, gridColumn: isVideo ? 'span 2' : undefined }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
    >
        <div className={`relative rounded-xl overflow-hidden border transition-all duration-500 bg-zinc-900 shadow-xl shadow-black/40 ${
            isVideo
              ? 'border-red-500/30 group-hover:border-red-500/60 shadow-[0_0_30px_rgba(220,38,38,0.25)] group-hover:shadow-[0_0_45px_rgba(220,38,38,0.45)]'
              : 'border-white/[0.08] group-hover:border-red-500/30'
        }`}>
            {!loaded && <div className="w-full aspect-[4/3] animate-pulse bg-white/5" />}
            {inView && imgUrl && (
                <img
                    src={imgUrl}
                    alt={photo.caption || (isVideo ? "Video" : "Photo")}
                    className={`w-full transition-all duration-700 group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0 absolute"}`}
                    loading="lazy"
                    onLoad={(e) => handleImageLoad(e.currentTarget)}
                />
            )}

            {/* Video play badge overlay (always visible, pulses on hover) */}
            {isVideo && loaded && (
                <>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <motion.div
                            animate={isHovered ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                            transition={{ duration: 1.2, repeat: isHovered ? Infinity : 0 }}
                            className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-md border border-white/30 shadow-2xl flex items-center justify-center"
                        >
                            <Play className="w-7 h-7 text-white ml-1" fill="currentColor" />
                        </motion.div>
                    </div>
                    {durationLabel && (
                        <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-white text-xs font-bold pointer-events-none">
                            {durationLabel}
                        </div>
                    )}
                </>
            )}

            {loaded && !isVideo && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: isHovered ? 1 : 0.8, opacity: isHovered ? 1 : 0 }}
                        className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl"
                    >
                        <Maximize2 className="w-5 h-5 text-white" />
                    </motion.div>
                </div>
            )}

            {loaded && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#050507] via-[#050507]/60 to-transparent flex flex-col justify-end p-4 pt-16 pointer-events-none">
                    {photo.caption && <p className="text-sm font-bold text-white mb-1 drop-shadow-md">{photo.caption}</p>}
                    <p className="text-xs font-semibold text-zinc-400">by {photo.uploader.name}</p>
                </div>
            )}
        </div>
    </motion.div>
);
```

- [ ] **Step 4: Mirror in album detail page's `FloatingPhotoCard`**

Apply the same `isVideo` branch logic to `FloatingPhotoCard` in `frontend/src/app/gallery/albums/[id]/page.tsx`. Wrapper gets `gridColumn: span 2` when video; render play badge + duration pill; soft red glow ring.

- [ ] **Step 5: Browser verification**

```bash
cd frontend
npm run dev
```

Pre-seed at least one video. On `/gallery`:
- Video tile visibly spans 2 columns
- Centered play button shows on the thumbnail
- Soft red glow ring around video tile
- Duration pill in bottom-right (for Vimeo videos; YouTube videos won't have duration since YT oEmbed doesn't return it)
- On hover: glow brightens, play button pulses
- Click: lightbox opens with the video player from Task 8

Repeat in `/gallery/albums/<id>`.

- [ ] **Step 6: Commit**

```bash
cd /Users/anshumansingh/kyokushin_karate
git add frontend/src/app/gallery/page.tsx frontend/src/app/gallery/albums/[id]/page.tsx
git commit -m "feat(gallery): spotlight tile treatment for video items in masonry"
```

---

### Task 11: Add Video modal in dashboard

**Files:**
- Create: `frontend/src/components/dashboard/AddVideoModal.tsx`
- Modify: `frontend/src/components/dashboard/AlbumManager.tsx` (add a button that opens the modal)

- [ ] **Step 1: Create the modal**

Create `frontend/src/components/dashboard/AddVideoModal.tsx`:

```tsx
"use client";

import { useState } from "react";
import { X, Loader2, Video as VideoIcon } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

interface AddVideoModalProps {
    open: boolean;
    onClose: () => void;
    onSaved?: () => void;
    albumId?: string;
}

export default function AddVideoModal({ open, onClose, onSaved, albumId }: AddVideoModalProps) {
    const { showToast } = useToast();
    const [videoUrl, setVideoUrl] = useState("");
    const [caption, setCaption] = useState("");
    const [saving, setSaving] = useState(false);

    if (!open) return null;

    const handleSave = async () => {
        if (!videoUrl.trim()) {
            showToast("Paste a YouTube or Vimeo URL", "error");
            return;
        }
        setSaving(true);
        try {
            await api.post("/gallery/video", {
                videoUrl: videoUrl.trim(),
                caption: caption.trim() || undefined,
                albumId: albumId || undefined,
            });
            showToast("Video added", "success");
            setVideoUrl("");
            setCaption("");
            onSaved?.();
            onClose();
        } catch (err: any) {
            showToast(err.response?.data?.message || "Failed to add video", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <VideoIcon className="w-5 h-5 text-red-400" />
                        <h3 className="text-lg font-bold text-white">Add Video</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    YouTube or Vimeo URL
                </label>
                <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50"
                />

                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mt-4 mb-2">
                    Caption (optional)
                </label>
                <input
                    type="text"
                    placeholder="Defaults to the video's title"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50"
                />

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-zinc-400 hover:text-white hover:bg-white/5"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-2 rounded-lg text-sm font-bold bg-red-600 hover:bg-red-500 text-white flex items-center gap-2 disabled:opacity-60"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Wire into `AlbumManager`**

In `frontend/src/components/dashboard/AlbumManager.tsx`, add the import and a button. At the top:

```tsx
import { Video as VideoIcon } from "lucide-react";
import AddVideoModal from "./AddVideoModal";
```

Add state:

```tsx
const [showVideoModal, setShowVideoModal] = useState(false);
const [videoTargetAlbumId, setVideoTargetAlbumId] = useState<string | undefined>(undefined);
```

In the rendered JSX, near the top action bar (find the existing "Create Album" button — the page has a top-level "+ Album" or similar button), add a sibling:

```tsx
<button
    onClick={() => { setVideoTargetAlbumId(undefined); setShowVideoModal(true); }}
    className="px-4 py-2 rounded-lg text-sm font-bold bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10 flex items-center gap-2"
>
    <VideoIcon className="w-4 h-4 text-red-400" />
    Add Video
</button>
```

Just before the closing `</div>` of the component, render the modal:

```tsx
<AddVideoModal
    open={showVideoModal}
    onClose={() => setShowVideoModal(false)}
    onSaved={() => fetchAlbums()}
    albumId={videoTargetAlbumId}
/>
```

(If the album-detail UI inside `AlbumManager` has per-album controls, add an "Add Video to this Album" button there too that calls `setVideoTargetAlbumId(album.id); setShowVideoModal(true)`.)

- [ ] **Step 3: Browser verification**

```bash
cd frontend
npm run dev
```

Log in as an instructor. Go to the dashboard / album manager. Click "Add Video", paste a YouTube URL, save. Verify:
- Toast says "Video added"
- The modal closes
- Going to `/gallery` shows the new video tile with spotlight treatment

Log in as a student. The "Add Video" button is still visible (the dashboard route handles role gating elsewhere — confirm in the existing dashboard layout that students don't reach this page; if they do, hide the button via `useAuthStore` role check).

- [ ] **Step 4: Commit**

```bash
cd /Users/anshumansingh/kyokushin_karate
git add frontend/src/components/dashboard/AddVideoModal.tsx frontend/src/components/dashboard/AlbumManager.tsx
git commit -m "feat(gallery): dashboard modal for adding YouTube/Vimeo videos"
```

---

### Task 12: End-to-end manual verification

**Files:** none

- [ ] **Step 1: Backend running, frontend running**

```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev
```

- [ ] **Step 2: Verification matrix**

Walk through each scenario, ticking it off:

- [ ] Instructor logs in → dashboard shows "Add Video" button
- [ ] Add Video with valid YouTube URL → success toast, video appears on `/gallery`
- [ ] Add Video with valid Vimeo URL → success, duration pill shown on tile
- [ ] Add Video with garbage URL → error toast with parse-failure message
- [ ] Student-role login (if reachable) → cannot POST to `/api/gallery/video` (manual curl with student JWT returns 403)
- [ ] On `/gallery`, video tile spans 2 columns and has play overlay
- [ ] Hover video tile → glow intensifies, play button pulses
- [ ] Click video tile → lightbox opens with autoplaying muted iframe
- [ ] Arrow-right navigates from a video to the next item (image OR video) with correct renderer
- [ ] Esc closes the lightbox
- [ ] Share button on a video lightbox copies the video URL (paste somewhere to confirm)
- [ ] External-link button on a video lightbox opens YouTube/Vimeo in a new tab
- [ ] Click an image → opens lightbox with `<img>`, NOT distorted
- [ ] Test image distortion fix at four aspect ratios: 1:1, 3:4, 16:9, 3:1 (or whatever exists in the gallery) — each renders with the source file's aspect ratio
- [ ] Album detail page (`/gallery/albums/<id>`) shows video tile with spotlight treatment when album contains a video
- [ ] Album lightbox: video plays correctly, image fix applies
- [ ] Mobile responsive view (DevTools): video tile still spans 2 columns of the responsive grid

- [ ] **Step 3: Deploy preview to Vercel**

```bash
git push origin main
```

(Or branch + PR if the team prefers.) Vercel auto-builds. Hit the deployed URL and re-run the spot-checks: lightbox, video play, distortion fix.

- [ ] **Step 4: Final commit if any small fixes were needed**

If browser verification surfaced bugs and you patched them inline, commit with:

```bash
git add -A
git commit -m "fix(gallery): adjustments from end-to-end verification"
```

---

## Self-Review

**Spec coverage:**
- Backend data model → Task 1 ✓
- Video upload endpoint → Task 4 ✓
- URL parser + oEmbed fetcher → Tasks 2, 3 ✓
- Mixed feed CSS Grid switch → Task 9 ✓
- Spotlight tile treatment → Task 10 ✓
- Lightbox player branch + control swap → Task 8 ✓
- Lightbox image distortion fix → Task 6 ✓
- Albums with videos → Task 1 (schema reuse) + Tasks 8, 10 mirror to album page ✓
- Dashboard upload UI → Task 11 ✓

**Placeholder scan:** No "TBD"/"TODO". All steps include exact code or exact commands. The one phrase "if students can reach this page" in Task 11 Step 3 is a verification check, not a placeholder — the work is to add a role check if needed.

**Type consistency:** `MediaType` is `'IMAGE' | 'VIDEO'` (frontend) matching the Prisma enum (Task 1). `videoProvider`/`videoId`/`videoUrl`/`duration` names match across schema, controller, frontend interface, and components. The `formatDuration` and `buildEmbedUrl` helpers are defined in the file/component that uses them.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-27-gallery-video-and-lightbox-fix.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
