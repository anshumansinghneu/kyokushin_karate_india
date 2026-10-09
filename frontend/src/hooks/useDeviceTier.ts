"use client";

import { useEffect } from "react";
import { useSceneStore, type DeviceTier } from "@/lib/three/sceneStore";

type NavigatorHints = Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
};

/**
 * Picks the starting tier from what the browser will tell us up front. The
 * canvas can still step it down at runtime when frame rate drops.
 */
export function detectTier(): DeviceTier {
    if (typeof window === "undefined") return "static";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";

    const nav = navigator as NavigatorHints;
    if (nav.connection?.saveData) return "static";
    if (nav.connection?.effectiveType && /(^|-)2g$/.test(nav.connection.effectiveType)) return "static";

    try {
        const probe = document.createElement("canvas");
        if (!probe.getContext("webgl2")) return "static";
    } catch {
        return "static";
    }

    const memory = nav.deviceMemory ?? 4;
    const cores = nav.hardwareConcurrency ?? 4;
    if (memory <= 2 || cores <= 2) return "static";

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse || memory <= 4 || cores <= 4) return "lite";
    return "full";
}

/** Mount once (LayoutShell). Keeps the tier in sync with the reduced-motion setting. */
export function useDeviceTierInit() {
    const setTier = useSceneStore((s) => s.setTier);
    useEffect(() => {
        setTier(detectTier());
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const onChange = () => setTier(detectTier());
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, [setTier]);
}

export function useDeviceTier(): DeviceTier | null {
    return useSceneStore((s) => s.tier);
}
