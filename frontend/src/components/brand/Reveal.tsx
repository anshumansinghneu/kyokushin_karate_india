"use client";

import { motion, useInView, type Variants } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type RevealKind = "rise" | "mask" | "focus" | "depth";

const VARIANTS: Record<RevealKind, Variants> = {
    rise: { hidden: { opacity: 0, y: 28 }, shown: { opacity: 1, y: 0 } },
    // A curtain lifting from the bottom edge.
    mask: { hidden: { clipPath: "inset(0 0 100% 0)" }, shown: { clipPath: "inset(0 0 0% 0)" } },
    focus: { hidden: { opacity: 0, filter: "blur(12px)" }, shown: { opacity: 1, filter: "blur(0px)" } },
    // Falls forward out of the page.
    depth: { hidden: { opacity: 0, rotateX: 14, y: 40, transformPerspective: 900 }, shown: { opacity: 1, rotateX: 0, y: 0, transformPerspective: 900 } },
};

interface RevealProps {
    children: React.ReactNode;
    as?: "div" | "section" | "li" | "article" | "span";
    kind?: RevealKind;
    delay?: number;
    duration?: number;
    className?: string;
}

/**
 * Content is visible by default (SSR, no-JS, hidden tabs, headless renders).
 * Only after hydration, and only for elements still below the fold, is it
 * armed into the hidden state and played in when it scrolls into view.
 */
export default function Reveal({ children, as = "div", kind = "rise", delay = 0, duration = 0.9, className }: RevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
    const [armed, setArmed] = useState(false);

    useEffect(() => {
        const el = ref.current;
        // Reduced motion: never arm, so content simply sits where it is.
        if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        if (el.getBoundingClientRect().top <= window.innerHeight * 0.92) return;
        const id = requestAnimationFrame(() => setArmed(true));
        return () => cancelAnimationFrame(id);
    }, []);

    const MotionTag = motion[as] as typeof motion.div;
    const state = !armed || inView ? "shown" : "hidden";

    return (
        <MotionTag
            ref={ref}
            className={className}
            // Same variants on server and client; reduced motion is handled by never arming.
            variants={VARIANTS[kind]}
            initial={false}
            animate={state}
            transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
        >
            {children}
        </MotionTag>
    );
}
