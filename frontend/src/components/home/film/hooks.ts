"use client";

import { useEffect, useRef, useSyncExternalStore, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const REDUCE = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (fn: () => void) => {
    const mq = window.matchMedia(REDUCE);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
};

/** prefers-reduced-motion. Hydrates as false (the server's guess), then switches without a mismatch. */
export function useReduced(): boolean {
    return useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCE).matches, () => false);
}

/**
 * Scroll progress (0 to 1) of an element through the viewport, delivered to a
 * callback rather than state so scrubbing never re-renders. For the two things
 * outside the films that move with scroll: the lineage hairline and the
 * closing crossfade.
 */
export function useScrollProgress(
    ref: RefObject<HTMLElement | null>,
    onProgress: (p: number) => void,
    { start = "top top", end = "bottom bottom", enabled = true }: { start?: string; end?: string; enabled?: boolean } = {},
) {
    const cb = useRef(onProgress);
    useEffect(() => {
        cb.current = onProgress;
    });
    useEffect(() => {
        const el = ref.current;
        if (!el || !enabled) return;
        const st = ScrollTrigger.create({
            trigger: el,
            start,
            end,
            onUpdate: (self) => cb.current(self.progress),
            onRefresh: (self) => cb.current(self.progress),
        });
        cb.current(st.progress);
        return () => st.kill();
    }, [ref, start, end, enabled]);
}
