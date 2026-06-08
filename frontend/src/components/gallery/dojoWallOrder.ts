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

/** Fisher–Yates. Pure — returns a new array. rng injectable for determinism. */
export function fisherYatesShuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** FNV-1a string hash → uint32. Deterministic seed source. */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — small deterministic PRNG seeded by a uint32. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ComposeTilesParams {
  rest: GalleryPhoto[];
  gateOpen: boolean;
  recentCount?: number;
}

/**
 * Compose the wall tiles. Recent items stay in date order up top. When the gate
 * is open, older items are appended shuffled. The shuffle is seeded from the
 * older items' ids, so it is a pure function of the data: identical on every
 * render (stable — never reshuffles on re-render) and only changes if the older
 * set itself changes. No external bookkeeping (refs/state) required.
 */
export function composeTiles({
  rest,
  gateOpen,
  recentCount = RECENT_COUNT,
}: ComposeTilesParams): GalleryPhoto[] {
  const recent = rest.slice(0, recentCount);
  if (!gateOpen) return recent;

  const older = rest.slice(recentCount);
  const seed = hashString(older.map((p) => p.id).join(","));
  const shuffledOlder = fisherYatesShuffle(older, mulberry32(seed));
  return [...recent, ...shuffledOlder];
}
