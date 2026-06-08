"use client";

import { useEffect, useMemo, useState } from "react";
import type { GalleryPhoto } from "@/app/gallery/page";
import {
  FIRST_VISIT_KEY,
  GATE_MS,
  composeTiles,
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
  // Gate starts closed so the SSR/first-paint render is deterministic. After
  // mount we read the persisted first-visit time and arm a timer to open the
  // gate at the 10-minute mark. The setState lives in the timer callback (a
  // delay of 0 when the mark has already passed), never synchronously in the
  // effect body, so it doesn't trigger cascading renders.
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    const firstVisit = readFirstVisit();
    const remaining = Math.max(0, GATE_MS - (Date.now() - firstVisit));
    const timer = setTimeout(() => setGateOpen(true), remaining);
    return () => clearTimeout(timer);
  }, []);

  const { featured, rest } = useMemo(() => {
    const sorted = sortNewestFirst(pool);
    return selectFeatured(sorted);
  }, [pool]);

  // Ordering is a pure function of (rest, gateOpen): the older batch is shuffled
  // with a seed derived from its ids, so the order is stable across re-renders
  // and only changes when the data does. No refs or effects needed for ordering.
  const tiles = useMemo(() => composeTiles({ rest, gateOpen }), [rest, gateOpen]);

  return { featured, tiles };
}
