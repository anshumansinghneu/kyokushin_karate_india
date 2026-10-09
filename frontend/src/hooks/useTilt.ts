"use client";

import { useCallback, useRef } from "react";
import { useMotionValue, useReducedMotion, useSpring } from "framer-motion";

/** Pointer-driven 3D tilt for a single element. Spread `handlers` on it and bind `style`. */
export function useTilt(maxDeg = 10) {
    const ref = useRef<HTMLElement | null>(null);
    const reduce = useReducedMotion();
    const rx = useMotionValue(0);
    const ry = useMotionValue(0);
    const rotateX = useSpring(rx, { stiffness: 160, damping: 20 });
    const rotateY = useSpring(ry, { stiffness: 160, damping: 20 });

    const onPointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (reduce || e.pointerType !== "mouse" || !ref.current) return;
            const r = ref.current.getBoundingClientRect();
            rx.set(-((e.clientY - r.top) / r.height - 0.5) * maxDeg * 2);
            ry.set(((e.clientX - r.left) / r.width - 0.5) * maxDeg * 2);
        },
        [reduce, maxDeg, rx, ry],
    );
    const onPointerLeave = useCallback(() => {
        rx.set(0);
        ry.set(0);
    }, [rx, ry]);

    return {
        ref,
        handlers: { onPointerMove, onPointerLeave },
        style: { rotateX, rotateY, transformPerspective: 1000 },
    };
}
