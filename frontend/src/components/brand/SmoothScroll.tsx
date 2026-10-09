"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/**
 * Weighted scrolling on desktop mice only. Touch devices keep native momentum,
 * and reduced-motion users keep native scrolling. Maps and other inner
 * scrollers opt out with data-lenis-prevent.
 */
export default function SmoothScroll() {
    const pathname = usePathname();

    useEffect(() => {
        const fine = window.matchMedia("(pointer: fine)").matches;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!fine || reduce) return;

        const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95, smoothWheel: true });
        let raf = requestAnimationFrame(function loop(time) {
            lenis.raf(time);
            raf = requestAnimationFrame(loop);
        });
        return () => {
            cancelAnimationFrame(raf);
            lenis.destroy();
        };
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}
