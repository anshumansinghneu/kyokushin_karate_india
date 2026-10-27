"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate, useInView } from "framer-motion";
import { useReduced, useScrollProgress } from "@/components/home/film/hooks";

/**
 * The unveiling (Valmora): a dark cloth hangs over the podium and pulls away upward as
 * the reader scrolls to it, catching at one corner the way fabric does. Reduced motion
 * shows the podium uncovered.
 */
export function Unveil({ children }: { children: ReactNode }) {
    const reduced = useReduced();
    const box = useRef<HTMLDivElement>(null);
    const cloth = useRef<HTMLDivElement>(null);

    useScrollProgress(
        box,
        (p) => {
            const el = cloth.current;
            if (!el) return;
            const e = p * p * (3 - 2 * p);
            el.style.transform = `translateY(${-e * 112}%) skewY(${-e * 7}deg)`;
            el.style.opacity = String(1 - Math.max(0, e - 0.85) / 0.15);
        },
        { start: "top 75%", end: "center 45%", enabled: !reduced },
    );

    return (
        <div ref={box} className="relative overflow-hidden">
            {children}
            {!reduced && (
                <div
                    ref={cloth}
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-x-[6%] -bottom-2 top-0 origin-top-left bg-[#0b0b0b] will-change-transform"
                    style={{
                        // Folds: soft vertical light and shade, and a hem along the bottom.
                        backgroundImage:
                            "repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 2.5%, rgba(0,0,0,0.35) 5%, rgba(255,255,255,0.02) 7.5%, rgba(0,0,0,0) 10%), linear-gradient(to bottom, transparent 92%, rgba(184,154,90,0.35) 92% 93%, transparent 93%)",
                    }}
                />
            )}
        </div>
    );
}

/** A number that counts up to its value the first time it is seen. */
export function CountUp({ value, className }: { value: number; className?: string }) {
    const reduced = useReduced();
    const ref = useRef<HTMLSpanElement>(null);
    const seen = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
    const [shown, setShown] = useState(0);
    useEffect(() => {
        if (!seen || reduced) return;
        const c = animate(0, value, { duration: 1.2, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setShown(Math.round(v)) });
        return () => c.stop();
    }, [seen, reduced, value]);
    return (
        <span ref={ref} className={className}>
            {reduced ? value : shown}
        </span>
    );
}

/** The medal gauge: a hairline track, gold filling to this dojo's share of the leader's total. */
export function Gauge({ value, max }: { value: number; max: number }) {
    const reduced = useReduced();
    const ref = useRef<HTMLSpanElement>(null);
    const seen = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
    const frac = max > 0 ? value / max : 0;
    return (
        <span ref={ref} aria-hidden="true" className="block h-[3px] w-full bg-white/10">
            <span
                className="block h-full origin-left bg-secondary transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                style={{ transform: `scaleX(${reduced || seen ? frac : 0})` }}
            />
        </span>
    );
}
