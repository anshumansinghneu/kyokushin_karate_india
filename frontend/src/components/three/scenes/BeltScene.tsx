"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";
import InkBackdrop from "../materials/InkBackdrop";
import { pointer } from "../pointer";
import { barTransforms, beltCurve, buildBelt, stitchTexture } from "./beltGeometry";
import { useReadySignal } from "./sceneUtils";

export interface BeltStop {
    /** Cloth colour, any CSS colour. */
    color: string;
    /** Rank bars on the tail (dan degrees). */
    bars: number;
}

interface BeltSceneProps {
    /** 0..1 through the journey. */
    progress?: MotionValue<number>;
    stops: BeltStop[];
    onReady?: () => void;
}

const MAX_BARS = 6;
const TWIST = Math.PI * 0.6;

/**
 * One belt, re-dyed rank by rank as the reader scrolls. Colour holds through
 * most of each step and turns over quickly between them, the way a grading
 * is a moment, not a gradient. Gold enters only with the dan bars.
 */
export default function BeltScene({ progress, stops, onReady }: BeltSceneProps) {
    const curve = useMemo(() => beltCurve(), []);
    const geometry = useMemo(() => buildBelt(curve, 360, 0.46, 0.045, TWIST), [curve]);
    const stitches = useMemo(() => stitchTexture(), []);
    const bars = useMemo(() => barTransforms(curve, MAX_BARS, 0.9, 0.016, TWIST), [curve]);
    const palette = useMemo(() => stops.map((s) => new THREE.Color(s.color)), [stops]);

    const group = useRef<THREE.Group>(null);
    const cloth = useRef<THREE.MeshPhysicalMaterial>(null);
    const barRefs = useRef<(THREE.Mesh | null)[]>([]);
    const goldLight = useRef<THREE.PointLight>(null);
    const clock = useRef(0);
    const shown = useRef(0);
    const mix = useMemo(() => new THREE.Color(), []);
    const size = useThree((s) => s.size);
    const portrait = size.width < size.height * 0.9;

    useEffect(() => () => {
        geometry.dispose();
        stitches.dispose();
    }, [geometry, stitches]);

    useReadySignal(onReady);

    useFrame((_, delta) => {
        clock.current += Math.min(delta, 0.1);
        const t = clock.current;
        const n = stops.length;
        const raw = progress ? THREE.MathUtils.clamp(progress.get(), 0, 1) * (n - 1) : 0;
        // Ease towards the scroll position so a flick of the wheel still reads as a turn, not a jump.
        shown.current += (raw - shown.current) * (1 - Math.exp(-delta * 6));
        const s = shown.current;
        const i = Math.min(n - 1, Math.floor(s));
        const f = s - i;
        const turn = THREE.MathUtils.smoothstep(f, 0.55, 0.95);
        const a = palette[i];
        const b = palette[Math.min(n - 1, i + 1)];

        if (cloth.current) {
            mix.copy(a).lerp(b, turn);
            cloth.current.color.copy(mix);
            // Dark cloth needs more sheen to keep its weave visible.
            const lum = mix.r * 0.3 + mix.g * 0.59 + mix.b * 0.11;
            cloth.current.sheen = 0.4 + (1 - lum) * 0.6;
        }

        const barCount = THREE.MathUtils.lerp(stops[i].bars, stops[Math.min(n - 1, i + 1)].bars, turn);
        barRefs.current.forEach((m, k) => {
            if (!m) return;
            const on = THREE.MathUtils.clamp(barCount - k, 0, 1);
            m.scale.set(1, on, on);
            m.visible = on > 0.01;
        });
        if (goldLight.current) goldLight.current.intensity = Math.min(1, barCount) * 6;

        const g = group.current;
        if (g) {
            const k = 1 - Math.exp(-delta * 2.5);
            // Each grading rocks the belt to a new angle; it never spins away from the viewer.
            const targetY = -0.35 + Math.sin(s * 1.3) * 0.45 + Math.sin(t * 0.3) * 0.06 + pointer.x * 0.2;
            const targetX = 0.12 + Math.cos(s * 0.9) * 0.12 + pointer.y * 0.1;
            g.rotation.y += (targetY - g.rotation.y) * k;
            g.rotation.x += (targetX - g.rotation.x) * k;
            g.position.y = Math.sin(t * 0.6) * 0.05;
        }
    });

    return (
        <>
            <PerspectiveCamera makeDefault position={portrait ? [0, 0, 11] : [0, 0, 7.5]} fov={32} />
            <InkBackdrop red={0} density={0.55} octaves={5} />

            <Environment resolution={256} frames={1}>
                <Lightformer form="rect" intensity={4} position={[0, 5, 3]} rotation-x={Math.PI / 2} scale={[10, 2, 1]} />
                <Lightformer form="rect" intensity={2} position={[-5, 0, 2]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
                <Lightformer form="rect" intensity={1} position={[5, 1, -2]} rotation-y={-Math.PI / 2} scale={[4, 2, 1]} />
            </Environment>
            <directionalLight position={[2, 5, 4]} intensity={3.4} />
            <directionalLight position={[-4, -1, 3]} intensity={0.6} />
            <ambientLight intensity={0.35} />
            <pointLight ref={goldLight} position={[3.2, 1.2, 1.2]} distance={4} color="#ffcc33" intensity={0} />

            <group ref={group} position={portrait ? [0.2, 2.1, 0] : [1.05, 0.3, 0]} scale={portrait ? 0.62 : 0.9}>
                <mesh geometry={geometry} castShadow>
                    <meshPhysicalMaterial
                        ref={cloth}
                        map={stitches}
                        bumpMap={stitches}
                        bumpScale={0.6}
                        roughness={0.78}
                        sheen={0.6}
                        sheenRoughness={0.5}
                        sheenColor="#ffffff"
                        side={THREE.DoubleSide}
                    />
                </mesh>
                {bars.map((tr, k) => (
                    <mesh
                        key={k}
                        ref={(m) => {
                            barRefs.current[k] = m;
                        }}
                        position={tr.position}
                        quaternion={tr.quaternion}
                        visible={false}
                    >
                        <boxGeometry args={[0.038, 0.48, 0.062]} />
                        <meshPhysicalMaterial color="#d4a017" metalness={0.85} roughness={0.28} clearcoat={0.4} />
                    </mesh>
                ))}
            </group>
        </>
    );
}
