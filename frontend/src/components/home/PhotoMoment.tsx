"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

/**
 * One decisive photograph, full bleed, drifting slower than the page. The
 * foundation's numbers sit on it as a single sentence.
 */
export default function PhotoMoment({ children }: { children?: React.ReactNode }) {
    const ref = useRef<HTMLElement>(null);
    const reduce = useReducedMotion();
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
    const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-8%", "8%"]);
    const scale = useTransform(scrollYProgress, [0, 0.5, 1], reduce ? [1, 1, 1] : [1.12, 1.04, 1.12]);

    return (
        <section ref={ref} className="relative flex min-h-[92svh] items-end overflow-hidden bg-black">
            <motion.div className="absolute inset-[-10%_0]" style={{ y, scale }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/history/kumite-today.jpg"
                    alt="Two karateka in white gi exchange kicks at a KKFI tournament while the referee watches"
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover grayscale-[0.35]"
                />
            </motion.div>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10" />
            <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 pb-[clamp(3rem,9vh,6rem)] sm:px-6 lg:px-8">{children}</div>
        </section>
    );
}
