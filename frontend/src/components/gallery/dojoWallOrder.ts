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
