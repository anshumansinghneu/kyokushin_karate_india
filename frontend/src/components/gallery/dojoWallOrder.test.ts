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
  const rest = Array.from({ length: RECENT_COUNT + 6 }, (_, i) =>
    photo(`r${i}`, new Date(Date.UTC(2026, 0, RECENT_COUNT + 6 - i)).toISOString())
  );

  it("returns only the recent slice when the gate is closed", () => {
    const tiles = composeTiles({ rest, gateOpen: false });
    expect(tiles).toHaveLength(RECENT_COUNT);
    expect(tiles.map((p) => p.id)).toEqual(rest.slice(0, RECENT_COUNT).map((p) => p.id));
  });

  it("appends all older items when the gate is open, recent kept in date order on top", () => {
    const tiles = composeTiles({ rest, gateOpen: true });
    expect(tiles).toHaveLength(rest.length);
    // recent stays in date order up top
    expect(tiles.slice(0, RECENT_COUNT).map((p) => p.id)).toEqual(
      rest.slice(0, RECENT_COUNT).map((p) => p.id)
    );
    // every older item is present exactly once in the tail
    const olderIds = rest.slice(RECENT_COUNT).map((p) => p.id).sort();
    const tailIds = tiles.slice(RECENT_COUNT).map((p) => p.id).sort();
    expect(tailIds).toEqual(olderIds);
  });

  it("actually shuffles the older items (tail order differs from date order)", () => {
    const tiles = composeTiles({ rest, gateOpen: true });
    const tail = tiles.slice(RECENT_COUNT).map((p) => p.id);
    const olderInDateOrder = rest.slice(RECENT_COUNT).map((p) => p.id);
    expect(tail).not.toEqual(olderInDateOrder);
  });

  it("is deterministic — same input yields the same order every call (stable, no reshuffle)", () => {
    const a = composeTiles({ rest, gateOpen: true });
    const b = composeTiles({ rest, gateOpen: true });
    expect(a.map((p) => p.id)).toEqual(b.map((p) => p.id));
  });

  it("produces a different older order when the older set changes", () => {
    const baseTail = composeTiles({ rest, gateOpen: true })
      .slice(RECENT_COUNT)
      .map((p) => p.id);
    // Add one more older item — the seed (derived from older ids) changes.
    const grown = [...rest, photo("rX", "2025-06-01T00:00:00Z")];
    const grownTail = composeTiles({ rest: grown, gateOpen: true })
      .slice(RECENT_COUNT)
      .map((p) => p.id);
    expect(grownTail).not.toEqual(baseTail);
    expect(grownTail).toHaveLength(grown.length - RECENT_COUNT);
  });
});
