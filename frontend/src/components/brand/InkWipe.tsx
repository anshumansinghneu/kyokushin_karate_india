"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/**
 * Route change as sumi on paper: the screen arrives covered in ink and the
 * new page opens through a ragged, spreading hole. Skipped on first load and
 * under reduced motion (PageTransition's crossfade covers that case).
 */
export default function InkWipe({ pathname }: { pathname: string }) {
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
        const t = window.setTimeout(() => setRun(0), 820);
        return () => {
            cancelAnimationFrame(start);
            window.clearTimeout(t);
        };
    }, [pathname, reduce]);

    const radius = typeof window === "undefined" ? 2000 : Math.hypot(window.innerWidth, window.innerHeight) * 0.75;

    return (
        <AnimatePresence>
            {run > 0 && (
                <motion.svg
                    key={run}
                    aria-hidden="true"
                    className="pointer-events-none fixed inset-0 z-40 h-full w-full"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                >
                    <defs>
                        <filter id={`ink-edge-${run}`} x="-20%" y="-20%" width="140%" height="140%">
                            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed={run} />
                            <feDisplacementMap in="SourceGraphic" scale="120" />
                        </filter>
                        <mask id={`ink-mask-${run}`}>
                            <rect width="100%" height="100%" fill="white" />
                            <motion.circle
                                cx="50%"
                                cy="55%"
                                fill="black"
                                filter={`url(#ink-edge-${run})`}
                                initial={{ r: 0 }}
                                animate={{ r: radius }}
                                transition={{ duration: 0.75, ease: [0.7, 0, 0.2, 1] }}
                            />
                        </mask>
                    </defs>
                    <rect width="100%" height="100%" fill="#000" mask={`url(#ink-mask-${run})`} />
                </motion.svg>
            )}
        </AnimatePresence>
    );
}
