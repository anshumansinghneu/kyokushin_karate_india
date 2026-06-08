# Dojo Wall Featured-Video Masonry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the random-swap `HeroMosaic` on the public `/gallery` page with a content-ordered masonry wall whose newest video is an autoplaying featured centerpiece, every other cell is a click-to-play thumbnail, and ordering is time-gated (recent-only until the visitor has been on the site 10 minutes, then older items mix in shuffled-once).

**Architecture:** Pure ordering helpers (`dojoWallOrder.ts`) are unit-tested with Vitest. A thin React hook (`useDojoWallOrder`) wraps them with `localStorage` first-visit tracking and a gate timer. Presentational components (`FeaturedVideo`, `WallTile`, `DojoWall`) render the wall; `DojoWall` drops into `gallery/page.tsx` where `HeroMosaic` was. Only the featured iframe loads on page load; everything else is a lazy `<img>` until clicked (opens the existing lightbox).

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 3, Framer Motion, lucide-react, Vitest (new, dev-only). Videos are YouTube/Vimeo iframes (not self-hosted files).

---

## Spec reference

`docs/superpowers/specs/2026-06-08-dojo-wall-featured-video-design.md`

## Amendment (during execution)

Tasks 2 & 3 diverged from the code blocks below for a good reason: the original
`composeTiles(previousOlderOrder)` + `useRef`-in-`useMemo` approach violates React 19 /
Next 16 lint rules (`react-compiler` forbids ref read/write during render;
`react-hooks/set-state-in-effect` forbids the effect fallback). **Resolved by seeding
the older-batch shuffle from the items' ids** so ordering is a pure function of the data
(stable across renders, changes only when data changes) — no refs/state/effects for
ordering. As shipped:
- `composeTiles({ rest, gateOpen, recentCount? })` returns `GalleryPhoto[]` directly and
  shuffles `older` with `fisherYatesShuffle(older, mulberry32(hashString(olderIds)))`.
  New exports: `hashString`, `mulberry32`. Removed: `previousOlderOrder`/`rng` params,
  `ComposeTilesResult`.
- `useDojoWallOrder` arms a `setTimeout` (delay 0 if the 10-min mark already passed) to
  flip `gateOpen`; `tiles = useMemo(() => composeTiles({ rest, gateOpen }), [rest, gateOpen])`.
- Its public return — `{ featured, tiles }` — is unchanged, so Tasks 4–7 below are unaffected.

## Conventions for this plan

- All paths are relative to repo root `/Users/anshumansingh/kyokushin_karate`.
- Run all `npm` commands from `frontend/` (the Next.js app). Commands below `cd` into it.
- Type `GalleryPhoto` is exported from `frontend/src/app/gallery/page.tsx` (`import type { GalleryPhoto } from "@/app/gallery/page"`).
- `getImageUrl` lives at `@/lib/imageUtils`.

---

### Task 1: Set up Vitest

**Files:**
- Create: `frontend/vitest.config.ts`
- Modify: `frontend/package.json` (add dev dep + `test` script)

- [ ] **Step 1: Install Vitest (dev-only)**

```bash
cd /Users/anshumansingh/kyokushin_karate/frontend
npm install -D vitest@^2
```

- [ ] **Step 2: Create the Vitest config**

Create `frontend/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
```

- [ ] **Step 3: Add the `test` script**

In `frontend/package.json`, add a `test` entry to `"scripts"` so it reads:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run"
  },
```

- [ ] **Step 4: Add a throwaway smoke test and verify the runner works**

Create `frontend/src/components/gallery/_vitest-smoke.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("vitest smoke", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `cd /Users/anshumansingh/kyokushin_karate/frontend && npm test`
Expected: PASS — 1 passed.

- [ ] **Step 5: Delete the smoke test**

```bash
rm /Users/anshumansingh/kyokushin_karate/frontend/src/components/gallery/_vitest-smoke.test.ts
```

- [ ] **Step 6: Commit**

```bash
cd /Users/anshumansingh/kyokushin_karate
git add frontend/package.json frontend/package-lock.json frontend/vitest.config.ts
git commit -m "chore(frontend): add vitest for unit testing"
```

---

### Task 2: Pure ordering helpers (TDD)

**Files:**
- Test: `frontend/src/components/gallery/dojoWallOrder.test.ts`
- Create: `frontend/src/components/gallery/dojoWallOrder.ts`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/components/gallery/dojoWallOrder.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import type { GalleryPhoto } from "@/app/gallery/page";
import {
  GATE_MS,
  RECENT_COUNT,
  sortNewestFirst,
  selectFeatured,
  isGateOpen,
  resolveFirstVisit,
  composeTiles,
} from "./dojoWallOrder";

// Minimal factory — only the fields the helpers read.
function photo(id: string, uploadedAt: string, mediaType: "IMAGE" | "VIDEO" = "IMAGE"): GalleryPhoto {
  return {
    id,
    imageUrl: `/${id}.jpg`,
    caption: null,
    uploadedAt,
    isPublicFeatured: false,
    uploader: { id: "u", name: "U" },
    event: null,
    dojo: null,
    mediaType,
    videoUrl: mediaType === "VIDEO" ? `https://youtu.be/${id}` : null,
    videoProvider: mediaType === "VIDEO" ? "youtube" : null,
    videoId: mediaType === "VIDEO" ? id : null,
    duration: mediaType === "VIDEO" ? 60 : null,
  };
}

describe("sortNewestFirst", () => {
  it("orders by uploadedAt descending and does not mutate input", () => {
    const input = [
      photo("a", "2026-01-01T00:00:00Z"),
      photo("c", "2026-03-01T00:00:00Z"),
      photo("b", "2026-02-01T00:00:00Z"),
    ];
    const out = sortNewestFirst(input);
    expect(out.map((p) => p.id)).toEqual(["c", "b", "a"]);
    expect(input.map((p) => p.id)).toEqual(["a", "c", "b"]); // unchanged
  });
});

describe("selectFeatured", () => {
  it("picks the newest VIDEO as featured and excludes it from rest", () => {
    const sorted = [
      photo("p1", "2026-05-01T00:00:00Z"),
      photo("v1", "2026-04-01T00:00:00Z", "VIDEO"),
      photo("p2", "2026-03-01T00:00:00Z"),
      photo("v2", "2026-02-01T00:00:00Z", "VIDEO"),
    ];
    const { featured, rest } = selectFeatured(sorted);
    expect(featured?.id).toBe("v1");
    expect(rest.map((p) => p.id)).toEqual(["p1", "p2", "v2"]);
  });

  it("falls back to the newest item when there are no videos", () => {
    const sorted = [photo("p1", "2026-05-01T00:00:00Z"), photo("p2", "2026-04-01T00:00:00Z")];
    const { featured, rest } = selectFeatured(sorted);
    expect(featured?.id).toBe("p1");
    expect(rest.map((p) => p.id)).toEqual(["p2"]);
  });

  it("returns null featured and empty rest for an empty pool", () => {
    const { featured, rest } = selectFeatured([]);
    expect(featured).toBeNull();
    expect(rest).toEqual([]);
  });
});

describe("isGateOpen", () => {
  it("is closed before the gate and open at/after it", () => {
    const first = 1_000_000;
    expect(isGateOpen(first, first)).toBe(false);
    expect(isGateOpen(first, first + GATE_MS - 1)).toBe(false);
    expect(isGateOpen(first, first + GATE_MS)).toBe(true);
  });
});

describe("resolveFirstVisit", () => {
  it("keeps a valid stored timestamp and does not request a write", () => {
    const r = resolveFirstVisit("1700000000000", 1800000000000);
    expect(r.firstVisit).toBe(1700000000000);
    expect(r.shouldPersist).toBe(false);
  });

  it("uses now and requests a write when stored is missing or invalid", () => {
    expect(resolveFirstVisit(null, 123)).toEqual({ firstVisit: 123, shouldPersist: true });
    expect(resolveFirstVisit("not-a-number", 123)).toEqual({ firstVisit: 123, shouldPersist: true });
  });
});

describe("composeTiles", () => {
  const rest = Array.from({ length: RECENT_COUNT + 4 }, (_, i) =>
    photo(`r${i}`, new Date(Date.UTC(2026, 0, RECENT_COUNT + 4 - i)).toISOString())
  );

  it("returns only the recent slice when the gate is closed", () => {
    const { tiles } = composeTiles({ rest, gateOpen: false });
    expect(tiles).toHaveLength(RECENT_COUNT);
    expect(tiles.map((p) => p.id)).toEqual(rest.slice(0, RECENT_COUNT).map((p) => p.id));
  });

  it("appends all older items (shuffled) when the gate is open", () => {
    const { tiles } = composeTiles({ rest, gateOpen: true, rng: () => 0 });
    expect(tiles).toHaveLength(rest.length);
    // recent stays in date order up top
    expect(tiles.slice(0, RECENT_COUNT).map((p) => p.id)).toEqual(
      rest.slice(0, RECENT_COUNT).map((p) => p.id)
    );
    // every older item is present somewhere
    const olderIds = rest.slice(RECENT_COUNT).map((p) => p.id).sort();
    const tailIds = tiles.slice(RECENT_COUNT).map((p) => p.id).sort();
    expect(tailIds).toEqual(olderIds);
  });

  it("reuses a previous older order unchanged when the older set is identical (shuffle once)", () => {
    const first = composeTiles({ rest, gateOpen: true, rng: () => 0 });
    const second = composeTiles({
      rest,
      gateOpen: true,
      previousOlderOrder: first.olderOrder,
      rng: () => 0.999, // different rng must NOT matter — order is reused
    });
    expect(second.olderOrder.map((p) => p.id)).toEqual(first.olderOrder.map((p) => p.id));
  });

  it("re-shuffles when the older set changes", () => {
    const stale = [photo("ghost", "2020-01-01T00:00:00Z")];
    const { olderOrder } = composeTiles({
      rest,
      gateOpen: true,
      previousOlderOrder: stale,
      rng: () => 0,
    });
    expect(olderOrder.map((p) => p.id)).not.toEqual(["ghost"]);
    expect(olderOrder).toHaveLength(rest.length - RECENT_COUNT);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd /Users/anshumansingh/kyokushin_karate/frontend && npm test`
Expected: FAIL — cannot resolve `./dojoWallOrder` (module does not exist yet).

- [ ] **Step 3: Implement the pure helpers**

Create `frontend/src/components/gallery/dojoWallOrder.ts`:

```ts
import type { GalleryPhoto } from "@/app/gallery/page";

export const GATE_MS = 10 * 60 * 1000; // 10 minutes
export const RECENT_COUNT = 12;
export const FIRST_VISIT_KEY = "dojowall:first-visit";

/** Newest-first by uploadedAt. Pure — returns a new array. */
export function sortNewestFirst(pool: GalleryPhoto[]): GalleryPhoto[] {
  return [...pool].sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}

/** The newest video is the featured centerpiece; if there are no videos, the newest item. */
export function selectFeatured(sorted: GalleryPhoto[]): {
  featured: GalleryPhoto | null;
  rest: GalleryPhoto[];
} {
  if (sorted.length === 0) return { featured: null, rest: [] };
  const featured = sorted.find((p) => p.mediaType === "VIDEO") ?? sorted[0];
  const rest = sorted.filter((p) => p.id !== featured.id);
  return { featured, rest };
}

export function isGateOpen(firstVisit: number, now: number, gateMs: number = GATE_MS): boolean {
  return now - firstVisit >= gateMs;
}

/** Decide the first-visit timestamp from whatever was stored. Pure — no I/O. */
export function resolveFirstVisit(
  stored: string | null,
  now: number
): { firstVisit: number; shouldPersist: boolean } {
  const parsed = stored == null ? NaN : Number(stored);
  if (Number.isFinite(parsed) && parsed > 0) {
    return { firstVisit: parsed, shouldPersist: false };
  }
  return { firstVisit: now, shouldPersist: true };
}

/** Fisher–Yates. Pure — returns a new array. rng injectable for deterministic tests. */
export function fisherYatesShuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sameIdSet(a: GalleryPhoto[], b: GalleryPhoto[]): boolean {
  if (a.length !== b.length) return false;
  const ids = new Set(b.map((p) => p.id));
  return a.every((p) => ids.has(p.id));
}

export interface ComposeTilesParams {
  rest: GalleryPhoto[];
  gateOpen: boolean;
  recentCount?: number;
  /** Previously shuffled older order, for shuffle-once stability across renders. */
  previousOlderOrder?: GalleryPhoto[] | null;
  rng?: () => number;
}

export interface ComposeTilesResult {
  tiles: GalleryPhoto[];
  /** The (stable) shuffled older order to feed back in on the next render. */
  olderOrder: GalleryPhoto[];
}

/**
 * Compose the wall tiles. Recent items stay in date order up top. Older items
 * are appended (shuffled exactly once) only when the gate is open. Passing the
 * previous olderOrder back in keeps the shuffle stable unless the older set changes.
 */
export function composeTiles({
  rest,
  gateOpen,
  recentCount = RECENT_COUNT,
  previousOlderOrder = null,
  rng = Math.random,
}: ComposeTilesParams): ComposeTilesResult {
  const recent = rest.slice(0, recentCount);
  const older = rest.slice(recentCount);

  if (!gateOpen) {
    return { tiles: recent, olderOrder: previousOlderOrder ?? [] };
  }

  const reuse =
    previousOlderOrder != null &&
    previousOlderOrder.length > 0 &&
    sameIdSet(previousOlderOrder, older);

  const olderOrder = reuse ? (previousOlderOrder as GalleryPhoto[]) : fisherYatesShuffle(older, rng);
  return { tiles: [...recent, ...olderOrder], olderOrder };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd /Users/anshumansingh/kyokushin_karate/frontend && npm test`
Expected: PASS — all tests in `dojoWallOrder.test.ts` green.

- [ ] **Step 5: Commit**

```bash
cd /Users/anshumansingh/kyokushin_karate
git add frontend/src/components/gallery/dojoWallOrder.ts frontend/src/components/gallery/dojoWallOrder.test.ts
git commit -m "feat(gallery): pure ordering helpers for the dojo wall"
```

---

### Task 3: `useDojoWallOrder` hook

**Files:**
- Create: `frontend/src/components/gallery/useDojoWallOrder.ts`

No unit test (thin React glue over Task 2; localStorage + timer behavior is verified by running the app in Task 7). The logic it composes is already covered by `dojoWallOrder.test.ts`.

- [ ] **Step 1: Implement the hook**

Create `frontend/src/components/gallery/useDojoWallOrder.ts`:

```ts
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GalleryPhoto } from "@/app/gallery/page";
import {
  FIRST_VISIT_KEY,
  GATE_MS,
  composeTiles,
  isGateOpen,
  resolveFirstVisit,
  selectFeatured,
  sortNewestFirst,
} from "./dojoWallOrder";

interface DojoWallOrder {
  featured: GalleryPhoto | null;
  tiles: GalleryPhoto[];
}

/** Read the persisted first-visit timestamp, writing it on the first ever visit. */
function readFirstVisit(): number {
  const now = Date.now();
  try {
    const stored = window.localStorage.getItem(FIRST_VISIT_KEY);
    const { firstVisit, shouldPersist } = resolveFirstVisit(stored, now);
    if (shouldPersist) window.localStorage.setItem(FIRST_VISIT_KEY, String(firstVisit));
    return firstVisit;
  } catch {
    // localStorage blocked/unavailable — treat as a fresh visit (gate closed).
    return now;
  }
}

export function useDojoWallOrder(pool: GalleryPhoto[]): DojoWallOrder {
  // Client-only: resolved in an effect so SSR render is deterministic (gate closed).
  const [firstVisit, setFirstVisit] = useState<number | null>(null);
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    const fv = readFirstVisit();
    setFirstVisit(fv);
    if (isGateOpen(fv, Date.now())) {
      setGateOpen(true);
      return;
    }
    const remaining = GATE_MS - (Date.now() - fv);
    const timer = setTimeout(() => setGateOpen(true), Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, []);

  const { featured, rest } = useMemo(() => {
    const sorted = sortNewestFirst(pool);
    return selectFeatured(sorted);
  }, [pool]);

  // Keep the shuffled older order stable across renders (shuffle once).
  const olderOrderRef = useRef<GalleryPhoto[] | null>(null);

  const tiles = useMemo(() => {
    const result = composeTiles({
      rest,
      gateOpen,
      previousOlderOrder: olderOrderRef.current,
    });
    olderOrderRef.current = result.olderOrder;
    return result.tiles;
  }, [rest, gateOpen]);

  // firstVisit is read but intentionally only drives the effect above.
  void firstVisit;

  return { featured, tiles };
}
```

- [ ] **Step 2: Type-check / lint the new file**

Run: `cd /Users/anshumansingh/kyokushin_karate/frontend && npx tsc --noEmit && npm run lint`
Expected: no errors referencing `useDojoWallOrder.ts`.

- [ ] **Step 3: Commit**

```bash
cd /Users/anshumansingh/kyokushin_karate
git add frontend/src/components/gallery/useDojoWallOrder.ts
git commit -m "feat(gallery): useDojoWallOrder hook with time-gated ordering"
```

---

### Task 4: `FeaturedVideo` component

**Files:**
- Create: `frontend/src/components/gallery/FeaturedVideo.tsx`

- [ ] **Step 1: Implement the component**

Create `frontend/src/components/gallery/FeaturedVideo.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { getImageUrl } from "@/lib/imageUtils";
import type { GalleryPhoto } from "@/app/gallery/page";

interface FeaturedVideoProps {
  photo: GalleryPhoto;
  onClick: () => void;
}

/** Looped/muted/autoplay embed with JS API enabled so we can postMessage it. */
function buildFeaturedEmbedUrl(provider: string, videoId: string): string {
  if (provider === "youtube") {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&playsinline=1&rel=0&enablejsapi=1`;
  }
  if (provider === "vimeo") {
    return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&controls=0&playsinline=1`;
  }
  return "";
}

type PlayerAction = "play" | "pause" | "mute" | "unmute";

function postToPlayer(iframe: HTMLIFrameElement | null, provider: string, action: PlayerAction) {
  const win = iframe?.contentWindow;
  if (!win) return;
  if (provider === "youtube") {
    const func = { play: "playVideo", pause: "pauseVideo", mute: "mute", unmute: "unMute" }[action];
    win.postMessage(JSON.stringify({ event: "command", func, args: [] }), "*");
  } else if (provider === "vimeo") {
    const msg =
      action === "play"
        ? { method: "play" }
        : action === "pause"
        ? { method: "pause" }
        : action === "unmute"
        ? { method: "setVolume", value: 1 }
        : { method: "setVolume", value: 0 };
    win.postMessage(JSON.stringify(msg), "*");
  }
}

export default function FeaturedVideo({ photo, onClick }: FeaturedVideoProps) {
  const isVideo = photo.mediaType === "VIDEO" && !!photo.videoProvider && !!photo.videoId;
  const thumb = getImageUrl(photo.imageUrl) || "";
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [muted, setMuted] = useState(true);

  // Pause when scrolled out of view; resume when back in view. Never unmount (no re-buffer).
  useEffect(() => {
    if (!isVideo) return;
    const el = containerRef.current;
    if (!el) return;
    const provider = photo.videoProvider as string;
    const observer = new IntersectionObserver(
      ([entry]) => {
        postToPlayer(iframeRef.current, provider, entry.isIntersecting ? "play" : "pause");
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isVideo, photo.videoProvider]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !muted;
    setMuted(next);
    postToPlayer(iframeRef.current, photo.videoProvider as string, next ? "mute" : "unmute");
  };

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className="relative w-full h-full overflow-hidden rounded-2xl border border-red-500/30 cursor-pointer group bg-zinc-900 shadow-[0_0_40px_rgba(220,38,38,0.18)]"
    >
      {/* Poster layer (always painted under the iframe). */}
      {thumb && (
        <img
          src={thumb}
          alt={photo.caption || "Featured video"}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      )}

      {isVideo && (
        <iframe
          ref={iframeRef}
          src={buildFeaturedEmbedUrl(photo.videoProvider as string, photo.videoId as string)}
          title={photo.caption || "Featured video"}
          allow="autoplay; encrypted-media; picture-in-picture"
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      )}

      {/* Unmute / mute toggle (only meaningful for video). */}
      {isVideo && (
        <button
          onClick={toggleMute}
          className="absolute bottom-3 right-3 z-10 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/25 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          title={muted ? "Unmute" : "Mute"}
          aria-label={muted ? "Unmute video" : "Mute video"}
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      )}

      {/* Caption gradient. */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#050507] via-[#050507]/40 to-transparent p-5 pt-16 pointer-events-none">
        {photo.caption && (
          <p className="text-base font-bold text-white drop-shadow-md line-clamp-1">{photo.caption}</p>
        )}
        <p className="text-xs font-semibold text-zinc-400">by {photo.uploader.name}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check / lint**

Run: `cd /Users/anshumansingh/kyokushin_karate/frontend && npx tsc --noEmit && npm run lint`
Expected: no errors referencing `FeaturedVideo.tsx`.

- [ ] **Step 3: Commit**

```bash
cd /Users/anshumansingh/kyokushin_karate
git add frontend/src/components/gallery/FeaturedVideo.tsx
git commit -m "feat(gallery): FeaturedVideo with autoplay, unmute, and off-screen pause"
```

---

### Task 5: `WallTile` component

**Files:**
- Create: `frontend/src/components/gallery/WallTile.tsx`

- [ ] **Step 1: Implement the component**

Create `frontend/src/components/gallery/WallTile.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Maximize2 } from "lucide-react";
import { getImageUrl } from "@/lib/imageUtils";
import type { GalleryPhoto } from "@/app/gallery/page";

interface WallTileProps {
  photo: GalleryPhoto;
  onClick: () => void;
}

function formatDuration(seconds: number | null): string | null {
  if (seconds == null || seconds < 0) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function WallTile({ photo, onClick }: WallTileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const isVideo = photo.mediaType === "VIDEO";
  const imgUrl = getImageUrl(photo.imageUrl) || "";
  const durationLabel = formatDuration(photo.duration);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`group relative w-full h-full aspect-square overflow-hidden rounded-xl border cursor-pointer bg-zinc-900 transition-all duration-500 ${
        isVideo
          ? "border-red-500/30 hover:border-red-500/60 shadow-[0_0_25px_rgba(220,38,38,0.2)] hover:shadow-[0_0_40px_rgba(220,38,38,0.4)]"
          : "border-white/[0.08] hover:border-red-500/30"
      }`}
    >
      {!loaded && <div className="absolute inset-0 animate-pulse bg-white/5" />}
      {inView && imgUrl && (
        <img
          src={imgUrl}
          alt={photo.caption || (isVideo ? "Video" : "Photo")}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          draggable={false}
        />
      )}

      {/* Video: play badge + duration. */}
      {isVideo && loaded && (
        <>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-md border border-white/30 shadow-2xl flex items-center justify-center">
              <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
            </div>
          </div>
          {durationLabel && (
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-white text-xs font-bold pointer-events-none">
              {durationLabel}
            </div>
          )}
        </>
      )}

      {/* Photo: hover maximize affordance. */}
      {!isVideo && loaded && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl">
            <Maximize2 className="w-5 h-5 text-white" />
          </div>
        </div>
      )}

      {/* Caption gradient. */}
      {loaded && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#050507] via-[#050507]/50 to-transparent flex flex-col justify-end p-3 pt-12 pointer-events-none">
          {photo.caption && (
            <p className="text-xs font-bold text-white mb-0.5 drop-shadow-md line-clamp-1">
              {photo.caption}
            </p>
          )}
          <p className="text-[11px] font-semibold text-zinc-400">by {photo.uploader.name}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check / lint**

Run: `cd /Users/anshumansingh/kyokushin_karate/frontend && npx tsc --noEmit && npm run lint`
Expected: no errors referencing `WallTile.tsx`.

- [ ] **Step 3: Commit**

```bash
cd /Users/anshumansingh/kyokushin_karate
git add frontend/src/components/gallery/WallTile.tsx
git commit -m "feat(gallery): WallTile click-to-play thumbnail"
```

---

### Task 6: `DojoWall` component

**Files:**
- Create: `frontend/src/components/gallery/DojoWall.tsx`

- [ ] **Step 1: Implement the component**

Create `frontend/src/components/gallery/DojoWall.tsx`. Layout notes:
- Tiles are `aspect-square` so grid auto-rows size to a column's width; the featured cell spans `md:col-span-3 md:row-span-2` (~60% width, 2 rows tall) and fills that span.
- Base `grid-cols-2` (mobile): featured is `col-span-2` (full width, `aspect-video`), tiles flow 2-up below — "featured full-width at top, everything else below".
- `md:grid-cols-5`: featured `md:col-span-3 md:row-span-2`, `md:aspect-auto` so it fills the 3×2 span.

```tsx
"use client";

import { useEffect } from "react";
import type { GalleryPhoto } from "@/app/gallery/page";
import { useDojoWallOrder } from "./useDojoWallOrder";
import FeaturedVideo from "./FeaturedVideo";
import WallTile from "./WallTile";

interface DojoWallProps {
  pool: GalleryPhoto[];
  onTileClick: (photoId: string) => void;
  /** Report visible IDs so the marquee can de-duplicate. */
  onTileIdsChange?: (ids: string[]) => void;
}

export default function DojoWall({ pool, onTileClick, onTileIdsChange }: DojoWallProps) {
  const { featured, tiles } = useDojoWallOrder(pool);

  useEffect(() => {
    const ids = featured ? [featured.id, ...tiles.map((t) => t.id)] : tiles.map((t) => t.id);
    onTileIdsChange?.(ids);
  }, [featured, tiles, onTileIdsChange]);

  if (!featured) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center bg-zinc-950 border-y border-white/5">
        <p className="text-zinc-500 text-sm">No memories yet — be the first to upload.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3">
        {/* Featured: full width on mobile (aspect-video), 3×2 span on desktop. */}
        <div className="col-span-2 md:col-span-3 md:row-span-2 aspect-video md:aspect-auto">
          <FeaturedVideo photo={featured} onClick={() => onTileClick(featured.id)} />
        </div>

        {tiles.map((photo) => (
          <WallTile key={photo.id} photo={photo} onClick={() => onTileClick(photo.id)} />
        ))}
      </div>

      {/* Title overlay — ported from HeroMosaic. */}
      <div className="pointer-events-none absolute bottom-0 left-0 p-4 md:p-8 lg:p-12 max-w-4xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent rounded-tr-[100px] pointer-events-none" />
        <h1
          className="relative font-black tracking-tighter uppercase leading-[0.9] drop-shadow-2xl"
          style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)" }}
        >
          <span className="text-white">THE </span>
          <span
            className="drop-shadow-[0_4px_25px_rgba(220,38,38,0.4)]"
            style={{
              background: "linear-gradient(180deg, #ef4444, #991b1b)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            DOJO
          </span>
          <span className="text-white"> WALL</span>
        </h1>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check / lint**

Run: `cd /Users/anshumansingh/kyokushin_karate/frontend && npx tsc --noEmit && npm run lint`
Expected: no errors referencing `DojoWall.tsx`.

- [ ] **Step 3: Commit**

```bash
cd /Users/anshumansingh/kyokushin_karate
git add frontend/src/components/gallery/DojoWall.tsx
git commit -m "feat(gallery): DojoWall masonry layout with featured video"
```

---

### Task 7: Wire `DojoWall` into the gallery page and verify

**Files:**
- Modify: `frontend/src/app/gallery/page.tsx` (imports + the `<HeroMosaic>` element)

- [ ] **Step 1: Swap the import**

In `frontend/src/app/gallery/page.tsx`, replace the HeroMosaic import line (currently `import HeroMosaic from "@/components/gallery/HeroMosaic";`) with:

```tsx
import DojoWall from "@/components/gallery/DojoWall";
```

- [ ] **Step 2: Swap the rendered element**

Replace the `<HeroMosaic ... />` block (the element that renders `pool={photos} paused={lightboxIndex !== null} onTileClick={openLightboxById} onTileIdsChange={handleHeroTileIdsChange}`) with — note `paused` is dropped, `DojoWall` has no swap timer:

```tsx
            <DojoWall
                pool={photos}
                onTileClick={openLightboxById}
                onTileIdsChange={handleHeroTileIdsChange}
            />
```

- [ ] **Step 3: Type-check, lint, and confirm the old component is now unused**

```bash
cd /Users/anshumansingh/kyokushin_karate/frontend
npx tsc --noEmit && npm run lint
grep -rn "HeroMosaic" src --include=*.tsx --include=*.ts
```
Expected: tsc/lint clean. The `grep` should return **no remaining references** to `HeroMosaic` (it was only used by this page). If any reference remains, leave `HeroMosaic.tsx`/`MosaicTile.tsx` untouched and skip Step 4. If none remain, proceed to Step 4.

- [ ] **Step 4: Remove the now-dead components (only if Step 3 grep was empty)**

```bash
cd /Users/anshumansingh/kyokushin_karate/frontend
# Confirm MosaicTile is only used by HeroMosaic before deleting:
grep -rn "MosaicTile" src --include=*.tsx --include=*.ts
# Expected: only HeroMosaic.tsx references it. If so:
rm src/components/gallery/HeroMosaic.tsx src/components/gallery/MosaicTile.tsx
npx tsc --noEmit && npm run lint
```
Expected: tsc/lint still clean after deletion.

- [ ] **Step 5: Run the full test suite**

Run: `cd /Users/anshumansingh/kyokushin_karate/frontend && npm test`
Expected: PASS — `dojoWallOrder.test.ts` green.

- [ ] **Step 6: Run the app and verify behavior manually**

```bash
cd /Users/anshumansingh/kyokushin_karate/frontend && npm run dev
```
Open the gallery page and confirm:
- The newest video is the large featured cell and **autoplays muted + loops**; the unmute button toggles audio.
- Scrolling the featured video out of view **pauses** it; scrolling back **resumes** it (network/console shows no re-buffer/reload).
- Photos and non-featured videos are **static thumbnails**; clicking any opens the existing lightbox (only then does a video iframe load). No second video ever autoplays on the wall.
- On a narrow viewport the featured video is **full-width at the top** and tiles stack below (no forced wide layout).
- "THE DOJO WALL" title and the "LATEST UPLOADS" marquee below are intact.
- To sanity-check the time gate without waiting 10 min: in DevTools console run `localStorage.setItem('dojowall:first-visit', Date.now() - 11*60*1000)` then reload — older items should now be mixed in (shuffled), and reloading again keeps that same order.

- [ ] **Step 7: Commit**

```bash
cd /Users/anshumansingh/kyokushin_karate
git add -A
git commit -m "feat(gallery): replace HeroMosaic with time-gated DojoWall"
```

---

## Self-Review

**Spec coverage:**
- Featured = most recent video, biggest cell ~60% desktop → Task 2 `selectFeatured`, Task 6 `md:col-span-3` of 5. ✅
- Only featured autoplays (muted/loop/playsinline) + poster + unmute + IO pause → Task 4. ✅
- Other videos click-to-play, iframe only on click → Task 5 (thumbnail) + existing lightbox. ✅
- Never more than one video at a time → only featured iframe on wall; lightbox is single. ✅
- Mobile stacks, featured full-width, no forced wide layout → Task 6 base `grid-cols-2`, featured `col-span-2`, `md:` upgrades. ✅
- Sort newest-first → Task 2 `sortNewestFirst`. ✅
- First load shows recent ~N → Task 2 `RECENT_COUNT=12`, `composeTiles` gate-closed branch. ✅
- After 10 min mix in older + shuffle, tracked via localStorage first-visit, no reset on reload → Task 2 `isGateOpen`/`resolveFirstVisit`, Task 3 hook timer + persistence. ✅
- Shuffle older once, then stable → Task 2 `composeTiles` previousOlderOrder reuse; Task 3 ref. ✅
- Lazy-load non-featured, only featured loads on page load, preload=none equivalent → Task 4 (one iframe) + Task 5 (`loading="lazy"`, no iframe). ✅
- Keep dark theme / masonry / LATEST UPLOADS styling → Task 6 ported title + grid; marquee untouched in Task 7. ✅
- Mixed (not grouped) → Task 6 interleaves tiles by date. ✅

**Placeholder scan:** None — every code/command step is complete.

**Type consistency:** `GalleryPhoto` used throughout from `@/app/gallery/page`. `composeTiles`/`selectFeatured`/`sortNewestFirst`/`isGateOpen`/`resolveFirstVisit` signatures match between Task 2 definition, the Task 2 tests, and the Task 3 hook. `buildFeaturedEmbedUrl`/`postToPlayer` are local to Task 4. `DojoWall` props (`pool`, `onTileClick`, `onTileIdsChange`) match the Task 7 call site (with `paused` removed). ✅
