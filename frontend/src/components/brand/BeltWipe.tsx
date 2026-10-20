"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/**
 * Route change as a belt drawn through the knot: the screen arrives covered by
 * a black band carrying a dan-gold rank stripe, and the band pulls away to the
 * right to reveal the new page. Skipped on first load and under reduced motion
 * (PageTransition's crossfade covers that case). Replaces InkWipe for the
 * public site's system.
 */
export default function BeltWipe({ pathname }: { pathname: string }) {
    const reduce = useReducedMotion();
    const first = useRef(true);
    const [run, setRun] = useState(0);

    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        if (reduce) return;
        const start = requestAnimationFrame(() => setRun((n) => n + 1));
        const t = window.setTimeout(() => setRun(0), 760);
        return () => {
            cancelAnimationFrame(start);
            window.clearTimeout(t);
        };
    }, [pathname, reduce]);

    return (
        <AnimatePresence>
            {run > 0 && (
                <motion.div
                    key={run}
                    aria-hidden="true"
                    className="pointer-events-none fixed inset-0 z-40 bg-night"
                    initial={{ x: "0%" }}
                    animate={{ x: "101%" }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.7, ease: [0.7, 0, 0.2, 1], delay: 0.05 }}
                >
                    {/* The rank stripe, near the band's leading edge like the gold bars on a black belt. */}
                    <span className="absolute inset-y-0 left-6 w-[3px] bg-dan-gold" />
                    <span className="absolute inset-y-0 left-12 w-[3px] bg-dan-gold" />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
