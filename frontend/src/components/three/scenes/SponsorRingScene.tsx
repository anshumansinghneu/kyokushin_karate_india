"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import InkBackdrop from "../materials/InkBackdrop";
import { pointer } from "../pointer";
import { useLoadedTexture, useReadySignal } from "./sceneUtils";

interface SponsorRingSceneProps {
    /** White-on-transparent logo images, same origin. */
    logos: string[];
    /** Centre the ring in its slot (a band mid-page) instead of lifting it above a hero title. */
    centered?: boolean;
    onReady?: () => void;
}

const RADIUS = 2.4;
const BAND_H = 1.05;
const PANELS = 9;

const tmpNormal = new THREE.Vector3();
const tmpToCam = new THREE.Vector3();
const tmpPos = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();

function Logo({ url, angle }: { url: string; angle: number }) {
    const tex = useLoadedTexture(url);
    const mesh = useRef<THREE.Mesh>(null);
    const mat = useRef<THREE.MeshBasicMaterial>(null);
    const camera = useThree((s) => s.camera);
    const img = tex?.image as { width: number; height: number } | undefined;
    const aspect = img ? img.width / img.height : 3;
    // Fit inside the band: at most ~1.25 wide and ~0.5 tall.
    const w = Math.min(1.25, 0.5 * aspect);
    const h = w / aspect;

    useFrame(() => {
        const m = mesh.current;
        if (!m || !mat.current) return;
        // Logos turning away from the viewer fade into the lacquer.
        m.getWorldPosition(tmpPos);
        tmpNormal.set(0, 0, 1).applyQuaternion(m.getWorldQuaternion(tmpQuat));
        tmpToCam.copy(camera.position).sub(tmpPos).normalize();
        const facing = THREE.MathUtils.clamp(tmpNormal.dot(tmpToCam), 0, 1);
        mat.current.opacity = Math.pow(facing, 1.6) * 0.95;
    });

    return (
        <group rotation={[0, angle, 0]}>
            <mesh ref={mesh} position={[0, 0, RADIUS + 0.012]}>
                <planeGeometry args={[w, h]} />
                <meshBasicMaterial ref={mat} map={tex} transparent depthWrite={false} toneMapped={false} visible={!!tex} />
            </mesh>
        </group>
    );
}

/**
 * The foundation's sponsors carried on a slow band of black lacquer. The band
 * turns by itself and leans toward the pointer; logos fade as they turn away.
 */
export default function SponsorRingScene({ logos, centered = false, onReady }: SponsorRingSceneProps) {
    const ring = useRef<THREE.Group>(null);
    const clock = useRef(0);
    const size = useThree((s) => s.size);
    const portrait = size.width < size.height * 0.9;

    const placed = useMemo(() => {
        if (logos.length === 0) return [];
        return Array.from({ length: PANELS }, (_, i) => ({
            url: logos[i % logos.length],
            angle: (i / PANELS) * Math.PI * 2,
        }));
    }, [logos]);

    useReadySignal(onReady);

    useFrame((_, delta) => {
        clock.current += Math.min(delta, 0.1);
        const g = ring.current;
        if (!g) return;
        g.rotation.y = clock.current * 0.12;
        const k = 1 - Math.exp(-delta * 2);
        g.rotation.x += (0.12 + pointer.y * 0.12 - g.rotation.x) * k;
        g.rotation.z += (pointer.x * -0.06 - g.rotation.z) * k;
    });

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0.9, portrait ? 9.5 : 7.2]} fov={32} onUpdate={(c) => c.lookAt(0, 0, 0)} />
            <InkBackdrop red={0} density={0.3} octaves={4} />
            <Environment resolution={128} frames={1}>
                <Lightformer form="rect" intensity={3} position={[0, 3, 4]} scale={[8, 0.6, 1]} />
                <Lightformer form="rect" intensity={1.2} position={[-5, 0, 2]} rotation-y={Math.PI / 2} scale={[4, 2, 1]} />
            </Environment>
            <directionalLight position={[2, 4, 5]} intensity={0.6} />

            {/* Held in the upper half of the hero so the title below never crosses a logo. */}
            <group position={centered ? [0, 0.15, 0] : [portrait ? 0 : 0.6, portrait ? 1.6 : 0.72, 0]} scale={centered ? (portrait ? 0.55 : 0.85) : portrait ? 0.5 : 0.78}>
            <group ref={ring}>
                <mesh>
                    <cylinderGeometry args={[RADIUS, RADIUS, BAND_H, 96, 1, true]} />
                    <meshPhysicalMaterial color="#0c0c0c" roughness={0.25} metalness={0.3} clearcoat={1} clearcoatRoughness={0.08} side={THREE.DoubleSide} />
                </mesh>
                {/* Hairline rims, the only bright edges on the band. */}
                {[BAND_H / 2, -BAND_H / 2].map((y) => (
                    <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <torusGeometry args={[RADIUS, 0.008, 6, 160]} />
                        <meshBasicMaterial color="#ffffff" transparent opacity={0.35} />
                    </mesh>
                ))}
                {placed.map((p, i) => (
                    <Logo key={i} url={p.url} angle={p.angle} />
                ))}
            </group>
            </group>
        </>
    );
}
