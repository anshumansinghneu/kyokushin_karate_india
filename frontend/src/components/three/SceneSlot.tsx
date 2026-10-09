"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";
import { useSceneStore, type SceneKey } from "@/lib/three/sceneStore";

interface SceneSlotProps {
    scene: SceneKey;
    /** Still image of the scene. Shown until the scene is drawing, and forever on the static tier. */
    poster?: string;
    posterAlt?: string;
    /** Anything the scene reads. Live objects (MotionValues, refs) are read per frame, not per render. */
    sceneProps?: Record<string, unknown>;
    className?: string;
    /** Drawn under the poster; use for a CSS composition when there is no poster image. */
    fallback?: React.ReactNode;
}

/**
 * A transparent hole the persistent canvas paints a scene into. Pure DOM: it
 * registers itself in the scene store and never imports three.js.
 */
export default function SceneSlot({ scene, poster, posterAlt = "", sceneProps, className, fallback }: SceneSlotProps) {
    const id = useId();
    const ref = useRef<HTMLDivElement>(null);
    const register = useSceneStore((s) => s.register);
    const update = useSceneStore((s) => s.update);
    const unregister = useSceneStore((s) => s.unregister);
    const ready = useSceneStore((s) => s.ready[id] ?? false);
    const tier = useSceneStore((s) => s.tier);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        register({ id, scene, el, props: sceneProps ?? {}, visible: false });
        const io = new IntersectionObserver(
            ([entry]) => update(id, { visible: entry.isIntersecting }),
            { rootMargin: "200px 0px" },
        );
        io.observe(el);
        return () => {
            io.disconnect();
            unregister(id);
        };
        // sceneProps is synced by the effect below; re-registering would drop readiness.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, scene, register, update, unregister]);

    useEffect(() => {
        update(id, { props: sceneProps ?? {} });
    }, [id, sceneProps, update]);

    const showPoster = tier === "static" || !ready;

    return (
        <div ref={ref} className={cn("relative", className)} aria-hidden="true" data-scene={scene}>
            {fallback && (
                <div className={cn("absolute inset-0 transition-opacity duration-700", showPoster ? "opacity-100" : "opacity-0")}>
                    {fallback}
                </div>
            )}
            {poster && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={poster}
                    alt={posterAlt}
                    decoding="async"
                    className={cn(
                        "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
                        showPoster ? "opacity-100" : "opacity-0",
                    )}
                />
            )}
        </div>
    );
}
