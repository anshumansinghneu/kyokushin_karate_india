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
