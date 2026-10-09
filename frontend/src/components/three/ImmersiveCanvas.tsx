"use client";

import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { PerformanceMonitor, View } from "@react-three/drei";
import { useSceneStore, type SlotEntry } from "@/lib/three/sceneStore";
import { SCENES } from "./scenes";
import { startPointerTracking } from "./pointer";

/*
 * The one WebGL context for the public site. It sits fixed behind <main> and
 * paints each registered SceneSlot into that slot's rectangle via drei <View>.
 * Loaded lazily by CanvasHost, so three.js never ships in first-load JS.
 */

function SlotView({ slot }: { slot: SlotEntry }) {
    const track = useMemo(() => ({ current: slot.el }) as RefObject<HTMLElement>, [slot.el]);
    const Scene = SCENES[slot.scene];
    const markReady = useSceneStore((s) => s.markReady);
    return (
        <View track={track} visible={slot.visible}>
            <Suspense fallback={null}>
                <Scene {...slot.props} onReady={() => markReady(slot.id, true)} />
            </Suspense>
        </View>
    );
}

/** Pause the render loop whenever no slot is on screen. */
function LoopGovernor({ active }: { active: boolean }) {
    const setFrameloop = useThree((s) => s.setFrameloop);
    useEffect(() => {
        setFrameloop(active ? "always" : "never");
    }, [active, setFrameloop]);
    return null;
}

export default function ImmersiveCanvas() {
    const slots = useSceneStore((s) => s.slots);
    const tier = useSceneStore((s) => s.tier);
    const degrade = useSceneStore((s) => s.degrade);
    const declines = useRef(0);

    useEffect(() => startPointerTracking(), []);

    const list = Object.values(slots);
    const anyVisible = list.some((s) => s.visible);
    if (tier === "static" || tier === null) return null;

    return (
        <Canvas
            className="!fixed inset-0 !pointer-events-none"
            style={{ position: "fixed", inset: 0, zIndex: 0 }}
            eventSource={typeof document !== "undefined" ? document.body : undefined}
            eventPrefix="client"
            dpr={tier === "full" ? [1, 1.75] : [1, 1.25]}
            gl={{ antialias: tier === "full", alpha: true, powerPreference: "high-performance" }}
            onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        >
            <LoopGovernor active={anyVisible} />
            <PerformanceMonitor
                onDecline={() => {
                    declines.current += 1;
                    degrade(declines.current > 2 ? "static" : "lite");
                }}
            />
            {list.map((slot) => (
                <SlotView key={slot.id} slot={slot} />
            ))}
        </Canvas>
    );
}
