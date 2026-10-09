"use client";

import { useMemo } from "react";
import type { MotionValue } from "framer-motion";
import SceneSlot from "./SceneSlot";

interface InkSlotProps {
    kanji?: string;
    red?: number;
    imageUrl?: string;
    side?: "right" | "left" | "center";
    progress?: MotionValue<number>;
    /** Still image for static-tier and first paint; plain black when omitted. */
    poster?: React.ReactNode;
    className?: string;
}

/**
 * The "ink" hero scene as a drop-in background: fills its positioned parent
 * and keeps its scene props stable, so pages can pass plain values.
 */
export default function InkSlot({ kanji, red, imageUrl, side, progress, poster, className = "absolute inset-0" }: InkSlotProps) {
    const sceneProps = useMemo(() => ({ kanji, red, imageUrl, side, progress }), [kanji, red, imageUrl, side, progress]);
    return <SceneSlot scene="ink" sceneProps={sceneProps} className={className} fallback={poster ?? <div className="absolute inset-0 bg-black" />} />;
}
