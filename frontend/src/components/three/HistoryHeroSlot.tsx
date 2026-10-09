"use client";

import { animate, useMotionValue, useMotionValueEvent } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import SceneSlot from "./SceneSlot";

interface HistoryHeroSlotProps {
    images: string[];
    /** Sideways shift of the corridor on wide screens (world units); positive = right. */
    offsetX?: number;
    /** Seconds for one pass down the corridor. */
    seconds?: number;
    /** Called with the index of the print currently in front, for captions. */
    onIndex?: (i: number) => void;
    poster?: React.ReactNode;
    className?: string;
}

/**
 * The history corridor as a self-running hero: the camera drifts down the
 * prints and back on its own, so a page can open on it without a scroll
 * journey. Reports the print in front so the page can caption it.
 */
export default function HistoryHeroSlot({ images, offsetX = 1.4, seconds = 9, onIndex, poster, className = "absolute inset-0" }: HistoryHeroSlotProps) {
    const progress = useMotionValue(0);
    const [front, setFront] = useState(0);

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        // Hold on each print, then glide to the next: keyframes with plateaus.
        const n = images.length;
        const stops: number[] = [];
        for (let i = 0; i < n; i++) stops.push(i / Math.max(1, n - 1), i / Math.max(1, n - 1));
        const controls = animate(progress, [...stops, ...stops.slice().reverse()], {
            duration: seconds * n,
            repeat: Infinity,
            ease: "easeInOut",
        });
        return () => controls.stop();
    }, [progress, images.length, seconds]);

    useMotionValueEvent(progress, "change", (v) => {
        const i = Math.round(v * (images.length - 1));
        if (i !== front) {
            setFront(i);
            onIndex?.(i);
        }
    });

    const sceneProps = useMemo(() => ({ progress, images, offsetX }), [progress, images, offsetX]);
    return <SceneSlot scene="history" sceneProps={sceneProps} className={className} fallback={poster ?? <div className="absolute inset-0 bg-black" />} />;
}
