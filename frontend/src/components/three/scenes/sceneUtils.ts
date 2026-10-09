"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Tell the slot to drop its poster once a few real frames have been drawn. */
export function useReadySignal(onReady?: () => void, after = 3) {
    const frames = useRef(0);
    const done = useRef(false);
    const cb = useRef(onReady);
    useEffect(() => {
        cb.current = onReady;
    }, [onReady]);
    useFrame(() => {
        // Count only while someone is listening: a scene may pass the callback once its data has loaded.
        if (done.current || !cb.current) return;
        frames.current += 1;
        if (frames.current >= after) {
            done.current = true;
            cb.current?.();
        }
    });
}

/** Loads a texture without suspending; a failed or cross-origin load just yields null. */
export function useLoadedTexture(url?: string) {
    const [state, setState] = useState<{ url: string; tex: THREE.Texture | null } | null>(null);
    useEffect(() => {
        if (!url) return;
        let alive = true;
        let loaded: THREE.Texture | null = null;
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin("anonymous");
        loader.load(
            url,
            (t) => {
                t.colorSpace = THREE.SRGBColorSpace;
                t.anisotropy = 4;
                loaded = t;
                if (alive) setState({ url, tex: t });
                else t.dispose();
            },
            undefined,
            () => alive && setState({ url, tex: null }),
        );
        return () => {
            alive = false;
            loaded?.dispose();
        };
    }, [url]);
    return url && state?.url === url ? state.tex : null;
}
