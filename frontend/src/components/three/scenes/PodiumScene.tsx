"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerspectiveCamera, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";
import InkBackdrop from "../materials/InkBackdrop";
import { pointer } from "../pointer";
import { useReadySignal } from "./sceneUtils";

interface PodiumSceneProps {
    /** [first, second, third] printed on the steps; omit for an unlabelled podium. */
    names?: (string | null | undefined)[];
    /** 0 at the top of the hero, 1 once it has scrolled away. */
    progress?: MotionValue<number>;
    /** Centre the podium instead of setting it to the right of the copy. */
    compact?: boolean;
    onReady?: () => void;
}

/** Step layout, left to right: second, first, third. Heights mirror a real podium. */
const STEPS = [
    { place: 2, x: -1.38, h: 0.86, medal: "#c9ccd4" },
    { place: 1, x: 0, h: 1.24, medal: "#d4a017" },
    { place: 3, x: 1.38, h: 0.6, medal: "#b4713d" },
] as const;
const STEP_W = 1.3;
const STEP_D = 1.05;

/** The body's actual font stack: next/font hashes the family name. */
function bodyFont() {
    if (typeof document === "undefined") return "sans-serif";
    return getComputedStyle(document.body).fontFamily || "sans-serif";
}

/** Fits a name to a width by stepping the size down; returns the size used. */
function fitText(ctx: CanvasRenderingContext2D, text: string, weight: number, max: number, start: number, family: string) {
    let size = start;
    do {
        ctx.font = `${weight} ${size}px ${family}`;
        if (ctx.measureText(text).width <= max) break;
        size -= 2;
    } while (size > 18);
    return size;
}

/** Front face of one step: the place numeral, and the name beneath when there is one. */
function makeStepLabel(place: number, name: string | null | undefined, family: string) {
    const w = 512;
    const h = 512;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    // Gold numeral only for first: gold is the earned mark.
    ctx.fillStyle = place === 1 ? "#e3b23c" : "rgba(255,255,255,0.86)";
    ctx.font = `900 ${place === 1 ? 250 : 210}px ${family}`;
    ctx.fillText(String(place), w / 2, name ? 300 : 360);
    if (name) {
        const label = name.toUpperCase();
        const size = fitText(ctx, label, 800, w - 60, 54, family);
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.font = `800 ${size}px ${family}`;
        ctx.fillText(label, w / 2, 400);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
}

/** Labels are drawn once fonts are ready and whenever the names change. */
function useStepLabels(names: (string | null | undefined)[] | undefined) {
    const key = (names ?? []).map((n) => n ?? "").join("|");
    const [labels, setLabels] = useState<THREE.Texture[] | null>(null);
    useEffect(() => {
        let alive = true;
        let made: THREE.Texture[] = [];
        const draw = () => {
            if (!alive) return;
            const family = bodyFont();
            const list = key ? key.split("|") : [];
            made = STEPS.map((s) => makeStepLabel(s.place, list[s.place - 1] || null, family));
            setLabels(made);
        };
        if (document.fonts?.ready) document.fonts.ready.then(draw);
        else draw();
        return () => {
            alive = false;
            made.forEach((t) => t.dispose());
        };
    }, [key]);
    return labels;
}

/** A medal standing on its step: metal disc with a raised rim, on a dark red ribbon. */
function Medal({ color, height, phase }: { color: string; height: number; phase: number }) {
    const ref = useRef<THREE.Group>(null);
    const clock = useRef(phase);
    useFrame((_, delta) => {
        clock.current += Math.min(delta, 0.1);
        const g = ref.current;
        if (!g) return;
        g.rotation.y = Math.sin(clock.current * 0.6) * 0.9;
        g.position.y = height + 0.62 + Math.sin(clock.current * 1.1) * 0.035;
    });
    return (
        <group ref={ref} position={[0, height + 0.62, 0.05]}>
            {/* Ribbon: two strips meeting at the medal. */}
            <mesh position={[-0.09, 0.33, -0.02]} rotation={[0, 0, 0.32]}>
                <boxGeometry args={[0.13, 0.5, 0.01]} />
                <meshStandardMaterial color="#7a0000" roughness={0.65} />
            </mesh>
            <mesh position={[0.09, 0.33, -0.02]} rotation={[0, 0, -0.32]}>
                <boxGeometry args={[0.13, 0.5, 0.01]} />
                <meshStandardMaterial color="#5c0000" roughness={0.65} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.27, 0.27, 0.045, 64]} />
                <meshPhysicalMaterial color={color} metalness={0.9} roughness={0.38} clearcoat={0.5} clearcoatRoughness={0.25} />
            </mesh>
            {/* Raised rim and a sunk centre medallion, so the face reads as struck metal. */}
            <mesh>
                <torusGeometry args={[0.255, 0.024, 16, 64]} />
                <meshPhysicalMaterial color={color} metalness={1} roughness={0.18} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.012]}>
                <cylinderGeometry args={[0.14, 0.14, 0.03, 48]} />
                <meshPhysicalMaterial color={color} metalness={0.85} roughness={0.42} />
            </mesh>
            <mesh position={[0, 0, -0.012]} rotation={[0, Math.PI, 0]}>
                <torusGeometry args={[0.255, 0.024, 16, 64]} />
                <meshPhysicalMaterial color={color} metalness={1} roughness={0.18} />
            </mesh>
        </group>
    );
}

/**
 * A black lacquer podium under studio light, medals turning above each step.
 * Gold leads the first place only; the steps carry the champions' names when
 * the page has them.
 */
export default function PodiumScene({ names, progress, compact = false, onReady }: PodiumSceneProps) {
    const group = useRef<THREE.Group>(null);
    const cam = useRef<THREE.PerspectiveCamera>(null);
    const fade = useRef(0);
    const reveal = useRef(0);
    const clock = useRef(0);
    const labels = useStepLabels(names);
    const size = useThree((s) => s.size);
    // Phones get the centred framing even when their scene band is wider than tall.
    const portrait = size.width < size.height * 0.9 || size.width < 640;
    const anchor = useMemo<[number, number, number]>(() => {
        if (portrait) return [0, -0.15, 0];
        return compact ? [0, -0.6, 0] : [1.85, -0.42, 0];
    }, [portrait, compact]);
    const scale = portrait ? 0.62 : compact ? 0.82 : 0.74;

    useReadySignal(labels ? onReady : undefined);

    useFrame((_, delta) => {
        clock.current += Math.min(delta, 0.1);
        const t = clock.current;
        reveal.current = Math.min(1, reveal.current + delta * 0.6);
        const p = progress ? THREE.MathUtils.clamp(progress.get(), 0, 1) : 0;
        fade.current = THREE.MathUtils.smoothstep(p, 0.5, 1);
        const g = group.current;
        if (g) {
            const k = 1 - Math.exp(-delta * 2.5);
            const ty = -0.28 + pointer.x * 0.22 + Math.sin(t * 0.25) * 0.05;
            const tx = 0.05 + pointer.y * 0.06;
            g.rotation.y += (ty - g.rotation.y) * k;
            g.rotation.x += (tx - g.rotation.x) * k;
            const rise = 1 - Math.pow(1 - reveal.current, 3);
            g.position.y = anchor[1] - (1 - rise) * 0.6 - p * 0.5;
        }
        if (cam.current) cam.current.position.z = (portrait ? 9.4 : 7.4) + p * 1.2;
    });

    return (
        <>
            <PerspectiveCamera ref={cam} makeDefault position={[0, 1.1, portrait ? 9.4 : 7.4]} fov={30} rotation={[-0.08, 0, 0]} />
            <InkBackdrop red={0.35} density={0.5} octaves={5} fade={fade} core={portrait ? [0.5, 0.6] : compact ? [0.5, 0.45] : [0.72, 0.45]} />

            <Environment resolution={128} frames={1}>
                <Lightformer form="rect" intensity={4} position={[0, 5, 2]} rotation-x={Math.PI / 2} scale={[8, 2, 1]} />
                <Lightformer form="rect" intensity={2.2} position={[-5, 1.5, 2]} rotation-y={Math.PI / 2} scale={[4, 3, 1]} />
                <Lightformer form="rect" intensity={1.2} position={[5, 0.5, 1]} rotation-y={-Math.PI / 2} scale={[3, 2, 1]} />
                {/* A soft key behind the camera: gives the medal faces something bright to reflect. */}
                <Lightformer form="rect" intensity={2.4} position={[0, 1.5, 7]} rotation-y={Math.PI} scale={[6, 3, 1]} />
            </Environment>
            <spotLight position={[0, 6, 3]} angle={0.5} penumbra={0.8} intensity={30} distance={14} color="#ffffff" />
            <pointLight position={[0, 2.4, 1.2]} intensity={5} distance={4} color="#ffcc55" />
            <ambientLight intensity={0.12} />

            <group position={anchor} scale={scale}>
                <group ref={group}>
                    {STEPS.map((s, i) => (
                        <group key={s.place} position={[s.x, 0, 0]}>
                            <RoundedBox args={[STEP_W, s.h, STEP_D]} radius={0.035} smoothness={4} position={[0, s.h / 2, 0]}>
                                <meshPhysicalMaterial color="#0c0c0c" metalness={0.3} roughness={0.28} clearcoat={1} clearcoatRoughness={0.08} />
                            </RoundedBox>
                            {/* Hairline gold inlay on the winner's step only. */}
                            {s.place === 1 && (
                                <mesh position={[0, s.h - 0.02, STEP_D / 2 + 0.002]}>
                                    <planeGeometry args={[STEP_W - 0.12, 0.012]} />
                                    <meshBasicMaterial color="#d4a017" />
                                </mesh>
                            )}
                            {labels && (
                                <mesh position={[0, s.h * 0.5, STEP_D / 2 + 0.004]}>
                                    <planeGeometry args={[Math.min(STEP_W - 0.1, s.h * 0.95), Math.min(STEP_W - 0.1, s.h * 0.95)]} />
                                    <meshBasicMaterial map={labels[i]} transparent toneMapped={false} />
                                </mesh>
                            )}
                            <Medal color={s.medal} height={s.h} phase={i * 1.7} />
                        </group>
                    ))}
                    {/* A low black plinth the podium stands on, catching the light at its edge. */}
                    <RoundedBox args={[4.6, 0.06, 1.6]} radius={0.02} smoothness={3} position={[0, -0.03, 0.05]}>
                        <meshPhysicalMaterial color="#070707" metalness={0.4} roughness={0.35} clearcoat={0.8} />
                    </RoundedBox>
                </group>
            </group>
        </>
    );
}
