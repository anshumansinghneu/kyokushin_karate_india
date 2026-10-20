import type Lenis from "lenis";

/**
 * The site-wide Lenis instance (created by SmoothScroll, desktop mice only),
 * shared so the homepage scroll film can sync ScrollTrigger to it instead of
 * starting a second one. On touch and reduced motion there is none.
 */
let current: Lenis | null = null;
const listeners = new Set<(lenis: Lenis | null) => void>();

export function setLenis(lenis: Lenis | null) {
    current = lenis;
    listeners.forEach((fn) => fn(lenis));
}

/** Calls fn now and whenever the instance changes. Returns an unsubscribe. */
export function onLenis(fn: (lenis: Lenis | null) => void): () => void {
    listeners.add(fn);
    fn(current);
    return () => {
        listeners.delete(fn);
    };
}
