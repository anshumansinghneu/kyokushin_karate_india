"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";
import InkBackdrop from "../materials/InkBackdrop";
import { pointer } from "../pointer";
import { buildKanku } from "./kankuGeometry";
import { useReadySignal, useLoadedTexture } from "./sceneUtils";

interface HomeHeroSceneProps {
    /** 0 at the top of the hero, 1 once it has scrolled away. */
    progress?: MotionValue<number>;
    imageUrl?: string;
    videoUrl?: string;
    /**
     * Framed for a panel rather than the full-width hero (the auth pages): the
     * emblem centres in tall panels and sits right in short bands.
     */
    compact?: boolean;
    onReady?: () => void;
}

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * The Kanku rendered in black lacquer, rising out of sumi ink. The ink carries
 * the founder's image (or the CMS hero video) only where it is dense. On scroll
 * the camera presses in while the emblem turns edge-on and the ink settles to
 * black, handing over to the page.
 */
export default function HomeHeroScene({ progress, imageUrl, videoUrl, compact = false, onReady }: HomeHeroSceneProps) {
    const geo = useMemo(() => buildKanku(), []);
    const group = useRef<THREE.Group>(null);
    const cam = useRef<THREE.PerspectiveCamera>(null);
    const reveal = useRef(0);
    const fade = useRef(0);
    const clock = useRef(0);
    const texture = useHeroTexture(imageUrl, videoUrl);
    const size = useThree((st) => st.size);
    // Keep the red heart behind the emblem: it sits right of centre on wide screens.
    const portrait = size.width < size.height * 0.9;
    let coreUv: [number, number] = portrait ? [0.5, 0.74] : [0.73, 0.5];
    let anchor: [number, number, number] = portrait ? [0, 1.12, 0] : [1.35, 0.05, 0];
    let baseScale = portrait ? 0.48 : 1.1;
    if (compact) {
        // Visible half-height at the emblem's depth: tan(fov/2) * camera distance.
        const halfH = Math.tan(THREE.MathUtils.degToRad(16)) * 6.2;
        const aspect = size.width / Math.max(1, size.height);
        if (aspect > 1.3) {
            // Short band: emblem at the right, clear of the title on the left.
            // Sits low enough to clear the fixed top bar that overlaps the band.
            const x = halfH * aspect - 1.0;
            anchor = [x, -0.25, 0];
            baseScale = 0.55;
            coreUv = [0.5 + x / (2 * halfH * aspect), 0.5 - 0.25 / (2 * halfH)];
        } else {
            // Tall panel: emblem high and centred, the brand copy sits beneath it.
            anchor = [0, 0.5, 0];
            baseScale = Math.min(0.9, 0.75 * halfH * aspect);
            coreUv = [0.5, 0.5 + 0.5 / (2 * halfH)];
        }
    }

    useEffect(() => () => {
        geo.body.dispose();
        geo.diagonals.dispose();
        geo.core.dispose();
    }, [geo]);

    useReadySignal(onReady);

    useFrame((_, delta) => {
        // Own clock from frame deltas: R3F's shared clock is not reliable across views.
        clock.current += Math.min(delta, 0.1);
        const t = clock.current;
        const intro = easeOutExpo(Math.min(1, t / 2.4));
        reveal.current = intro;

        const p = progress ? THREE.MathUtils.clamp(progress.get(), 0, 1) : 0;
        fade.current = THREE.MathUtils.smoothstep(p, 0.55, 1);

        const g = group.current;
        if (g) {
            const k = 1 - Math.exp(-delta * 3);
            const targetX = -0.12 + pointer.y * 0.22 + Math.sin(t * 0.5) * 0.03;
            const targetY = -0.38 + pointer.x * 0.35 + p * Math.PI * 0.5;
            g.rotation.x += (targetX - g.rotation.x) * k;
            g.rotation.y += (targetY - g.rotation.y) * k;
            g.rotation.z = (1 - intro) * -0.6;
            g.position.y = (1 - intro) * -1.6 + Math.sin(t * 0.8) * 0.03 + p * 0.4;
            g.scale.setScalar(0.85 + intro * 0.15);
        }
        if (cam.current) {
            cam.current.position.z = 6.2 - p * 3.2;
        }
    });

    return (
        <>
            <PerspectiveCamera ref={cam} makeDefault position={[0, 0, 6.2]} fov={32} />
            <InkBackdrop texture={texture} reveal={reveal} fade={fade} red={portrait ? 0.6 : 1} density={1} core={coreUv} />

            {/* A softbox studio: long white strips give the lacquer its highlights. */}
            <Environment resolution={256} frames={1}>
                <Lightformer form="rect" intensity={5} position={[0, 5, 2]} rotation-x={Math.PI / 2} scale={[10, 1.5, 1]} />
                <Lightformer form="rect" intensity={2.5} position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
                <Lightformer form="rect" intensity={1.5} position={[5, -2, 2]} rotation-y={-Math.PI / 2} scale={[4, 1, 1]} />
                <Lightformer form="ring" intensity={8} color="#ff1a1a" position={[2, -3, -3]} scale={3} />
            </Environment>
            <pointLight position={[0, 0, -1.5]} intensity={22} distance={5} color="#ff2020" />
            <directionalLight position={[-3, 4, 5]} intensity={0.6} />

            <group position={anchor} scale={baseScale}>
            <group ref={group}>
                <mesh geometry={geo.body}>
                    <meshPhysicalMaterial color="#121212" metalness={0.55} roughness={0.16} clearcoat={1} clearcoatRoughness={0.04} />
                </mesh>
                <mesh geometry={geo.diagonals} position-z={-0.02}>
                    <meshPhysicalMaterial color="#1c1c1c" metalness={0.45} roughness={0.28} clearcoat={0.8} />
                </mesh>
                <mesh geometry={geo.core} position-z={0.02}>
                    <meshPhysicalMaterial color="#c00000" emissive="#5a0000" emissiveIntensity={0.6} roughness={0.25} clearcoat={1} />
                </mesh>
            </group>
            </group>
        </>
    );
}

function useHeroTexture(imageUrl?: string, videoUrl?: string) {
    const image = useLoadedTexture(videoUrl ? undefined : imageUrl);
    const [video, setVideo] = useState<THREE.VideoTexture | null>(null);

    useEffect(() => {
        if (!videoUrl) return;
        const el = document.createElement("video");
        el.src = videoUrl;
        el.crossOrigin = "anonymous";
        el.muted = true;
        el.loop = true;
        el.playsInline = true;
        let tex: THREE.VideoTexture | null = null;
        const onPlay = () => {
            tex = new THREE.VideoTexture(el);
            tex.colorSpace = THREE.SRGBColorSpace;
            setVideo(tex);
        };
        el.addEventListener("playing", onPlay, { once: true });
        el.play().catch(() => {
            /* Autoplay or CORS refused: the ink simply runs without footage. */
        });
        return () => {
            el.pause();
            el.removeAttribute("src");
            el.load();
            tex?.dispose();
        };
    }, [videoUrl]);

    return videoUrl ? video : image;
}
