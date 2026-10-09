"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useSceneStore } from "@/lib/three/sceneStore";

const ImmersiveCanvas = dynamic(() => import("./ImmersiveCanvas"), { ssr: false });

/**
 * Loads the WebGL canvas only once a page actually has a scene slot, the tier
 * allows it, and the browser is idle, so first paint is never waiting on three.js.
 */
export default function CanvasHost() {
    const tier = useSceneStore((s) => s.tier);
    const hasSlots = useSceneStore((s) => Object.keys(s.slots).length > 0);
    const [idle, setIdle] = useState(false);

    useEffect(() => {
        if (idle || !hasSlots || !tier || tier === "static") return;
        // Wait for the page to finish loading and go quiet, so the WebGL bundle never
        // competes with first paint or hydration. Any interaction starts it at once.
        const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
        let timer = 0;
        let idleHandle = 0;
        const start = () => setIdle(true);
        const schedule = () => {
            timer = window.setTimeout(() => {
                if (w.requestIdleCallback) idleHandle = w.requestIdleCallback(start, { timeout: 2000 });
                else start();
            }, 3500);
        };
        const events = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;
        events.forEach((e) => window.addEventListener(e, start, { once: true, passive: true }));
        if (document.readyState === "complete") schedule();
        else window.addEventListener("load", schedule, { once: true });
        return () => {
            window.clearTimeout(timer);
            if (idleHandle) window.cancelIdleCallback?.(idleHandle);
            window.removeEventListener("load", schedule);
            events.forEach((e) => window.removeEventListener(e, start));
        };
    }, [idle, hasSlots, tier]);

    if (!idle || tier === "static") return null;
    return <ImmersiveCanvas />;
}
