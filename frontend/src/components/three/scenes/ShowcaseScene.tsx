"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerspectiveCamera, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";
import InkBackdrop from "../materials/InkBackdrop";
import { pointer } from "../pointer";
import { useLoadedTexture, useReadySignal } from "./sceneUtils";

/*
 * A dark showroom. In plate mode the images stand as thick lacquer-framed
 * plates on a slowly turning plinth, lit like products in a studio, with a
 * faint reflection in the floor. In logo mode a single transparent PNG floats
 * as a badge with real depth (stacked layers), over an optional full-bleed
 * artwork backdrop. Images must be CORS-readable; ones that fail simply do not
 * appear, and the scene only reports ready once something has loaded.
 */

interface ShowcaseSceneProps {
    /** Plate images (plate mode). */
    images?: string[];
    /** A transparent PNG to float as a badge (logo mode). Takes precedence over images. */
    logo?: string;
    /** Full-bleed artwork drawn behind everything (cover-fit, darkened at the edges). */
    backdrop?: string;
    /** 0..1 as the hero scrolls away. */
    progress?: MotionValue<number>;
    /** Framed for a smaller, centred window instead of the right half of a hero. */
    compact?: boolean;
    onReady?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Backdrop artwork: a screen-space quad, cover-fit, vignetted         */
/* ------------------------------------------------------------------ */

const backdropVertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
const backdropFragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uTexRes;
uniform vec2 uShift;
uniform float uReveal;
void main() {
  float rs = uRes.x / uRes.y; float rt = uTexRes.x / uTexRes.y;
  vec2 scale = rs > rt ? vec2(1.0, rt / rs) : vec2(rs / rt, 1.0);
  // A touch of overscan so the pointer parallax never shows an edge.
  vec2 uv = (vUv - 0.5) * scale * 0.94 + 0.5 + uShift;
  vec3 col = texture2D(uTex, uv).rgb;
  float d = length((vUv - 0.5) * vec2(1.2, 1.0));
  col *= mix(1.0, 0.5, smoothstep(0.35, 1.0, d));
  col *= mix(1.0, 0.0, smoothstep(0.5, 1.0, 1.0 - vUv.y) * 0.7);
  gl_FragColor = vec4(col * uReveal, 1.0);
}
`;

const target = new THREE.Vector2();

function BackdropArt({ url, onLoad }: { url: string; onLoad: () => void }) {
    const tex = useLoadedTexture(url);
    const mat = useRef<THREE.ShaderMaterial>(null);
    const size = useThree((s) => s.size);
    const shift = useRef(new THREE.Vector2());
    const reveal = useRef(0);
    const uniforms = useMemo(
        () => ({
            uTex: { value: null as THREE.Texture | null },
            uRes: { value: new THREE.Vector2(1, 1) },
            uTexRes: { value: new THREE.Vector2(1, 1) },
            uShift: { value: new THREE.Vector2() },
            uReveal: { value: 0 },
        }),
        [],
    );

    useEffect(() => {
        if (tex) onLoad();
    }, [tex, onLoad]);

    useFrame((_, delta) => {
        // Write through the live material: R3F may hand it a copy of the uniforms object.
        const u = mat.current?.uniforms;
        if (!u || !tex) return;
        const img = tex.image as { width: number; height: number };
        u.uTex.value = tex;
        u.uRes.value.set(size.width, size.height);
        u.uTexRes.value.set(img.width || 1, img.height || 1);
        target.set(-pointer.x * 0.012, -pointer.y * 0.01);
        shift.current.lerp(target, 1 - Math.exp(-delta * 2));
        u.uShift.value.copy(shift.current);
        reveal.current = Math.min(1, reveal.current + delta * 1.5);
        u.uReveal.value = reveal.current;
    });

    if (!tex) return null;
    return (
        <mesh frustumCulled={false} renderOrder={-2}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial ref={mat} vertexShader={backdropVertex} fragmentShader={backdropFragment} uniforms={uniforms} depthWrite={false} depthTest={false} />
        </mesh>
    );
}

/* ------------------------------------------------------------------ */
/*  Plate mode                                                          */
/* ------------------------------------------------------------------ */

const PLATE_H = 1.75;
const PLINTH_R = 1.75;
const PLATE_D = 0.09;
const FRAME = 0.07;

function Plate({ url, x, z, yaw, reflection = false, onLoad }: { url: string; x: number; z: number; yaw: number; reflection?: boolean; onLoad?: () => void }) {
    const tex = useLoadedTexture(url);
    useEffect(() => {
        if (tex && onLoad) onLoad();
    }, [tex, onLoad]);
    if (!tex) return null;
    const img = tex.image as { width: number; height: number };
    const aspect = THREE.MathUtils.clamp((img.width || 1) / (img.height || 1), 0.55, 1.6);
    const w = PLATE_H * aspect;
    const opacity = reflection ? 0.16 : 1;

    return (
        <group position={[x, PLATE_H / 2, z]} rotation={[0, yaw, 0]}>
            <RoundedBox args={[w + FRAME * 2, PLATE_H + FRAME * 2, PLATE_D]} radius={0.03} smoothness={3}>
                <meshPhysicalMaterial color="#0b0b0b" roughness={0.22} metalness={0.3} clearcoat={1} clearcoatRoughness={0.08} transparent={reflection} opacity={opacity} />
            </RoundedBox>
            <mesh position={[0, 0, PLATE_D / 2 + 0.002]}>
                <planeGeometry args={[w, PLATE_H]} />
                <meshBasicMaterial map={tex} toneMapped={false} transparent={reflection} opacity={opacity} />
            </mesh>
        </group>
    );
}

/** Plates stand on a shallow arc facing the viewer, the outer ones angled in like a gallery wall. */
function arcLayout(n: number) {
    // Half the distance between the outer plates' centres: enough that neighbours never overlap.
    const spread = n <= 1 ? 0 : Math.min(2.1, 0.92 * (n - 1));
    return Array.from({ length: n }, (_, i) => {
        const u = n <= 1 ? 0 : i / (n - 1) - 0.5; // -0.5 .. 0.5
        const x = u * spread * 2;
        return { x, z: -Math.abs(u) * 1.1, yaw: -u * 0.75 };
    });
}

function Plates({ images, onLoad }: { images: string[]; onLoad: () => void }) {
    const list = images.slice(0, 4);
    const layout = arcLayout(list.length);
    return (
        <>
            {list.map((url, i) => (
                <Plate key={url} url={url} {...layout[i]} onLoad={onLoad} />
            ))}
            {/* The floor's reflection: the same plates, mirrored and faint. */}
            <group scale={[1, -1, 1]}>
                {list.map((url, i) => (
                    <Plate key={`r-${url}`} url={url} {...layout[i]} reflection />
                ))}
            </group>
        </>
    );
}

/* ------------------------------------------------------------------ */
/*  Logo mode: a transparent PNG with depth                            */
/* ------------------------------------------------------------------ */

const LAYERS = 16;
const LOGO_DEPTH = 0.22;

function LogoBadge({ url, onLoad }: { url: string; onLoad: () => void }) {
    const tex = useLoadedTexture(url);
    useEffect(() => {
        if (tex) onLoad();
    }, [tex, onLoad]);
    if (!tex) return null;
    const img = tex.image as { width: number; height: number };
    const aspect = (img.width || 1) / (img.height || 1);
    const h = 2.6;
    const w = h * aspect;
    return (
        <group>
            {Array.from({ length: LAYERS }).map((_, i) => {
                const front = i === LAYERS - 1;
                const z = -LOGO_DEPTH + (i / (LAYERS - 1)) * LOGO_DEPTH;
                // The sides of the "extrusion" are the logo's own silhouette in near-black,
                // lightening slightly towards the face; only the face carries its colours.
                const shade = front ? "#ffffff" : new THREE.Color().setScalar(0.06 + (i / LAYERS) * 0.12).getStyle();
                return (
                    <mesh key={i} position={[0, 0, z]} renderOrder={i}>
                        <planeGeometry args={[w, h]} />
                        <meshBasicMaterial map={tex} color={shade} alphaTest={0.5} transparent={false} toneMapped={false} side={THREE.DoubleSide} />
                    </mesh>
                );
            })}
        </group>
    );
}

/** A soft pool of shadow under whatever floats above it. */
function ShadowPool({ width = 3.4, opacity = 0.55 }: { width?: number; opacity?: number }) {
    const tex = useMemo(() => {
        const c = document.createElement("canvas");
        c.width = c.height = 128;
        const g = c.getContext("2d")!;
        const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        grd.addColorStop(0, "rgba(0,0,0,1)");
        grd.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = grd;
        g.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(c);
    }, []);
    useEffect(() => () => tex.dispose(), [tex]);
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[width, width * 0.45]} />
            <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} />
        </mesh>
    );
}

/* ------------------------------------------------------------------ */
/*  Scene                                                               */
/* ------------------------------------------------------------------ */

export default function ShowcaseScene({ images = [], logo, backdrop, progress, compact = false, onReady }: ShowcaseSceneProps) {
    const [loaded, setLoaded] = useState(false);
    const markLoaded = useMemo(() => () => setLoaded(true), []);
    const turntable = useRef<THREE.Group>(null);
    const rig = useRef<THREE.Group>(null);
    const cam = useRef<THREE.PerspectiveCamera>(null);
    const clock = useRef(0);
    const size = useThree((s) => s.size);
    const portrait = size.width < size.height * 0.9;
    const logoMode = !!logo;

    // Ready only once a plate or the logo is actually on screen; until then the poster stays.
    useReadySignal(loaded ? onReady : undefined);

    useFrame((_, delta) => {
        clock.current += Math.min(delta, 0.1);
        const t = clock.current;
        const p = progress ? THREE.MathUtils.clamp(progress.get(), 0, 1) : 0;
        const k = 1 - Math.exp(-delta * 2.5);

        if (turntable.current) {
            // Plates: a slow, continuous turn. Logo: a gentle sway that never shows its back.
            if (logoMode) {
                turntable.current.rotation.y += (Math.sin(t * 0.45) * 0.38 + pointer.x * 0.3 - turntable.current.rotation.y) * k;
                turntable.current.rotation.x += (-0.06 + pointer.y * 0.15 - turntable.current.rotation.x) * k;
                turntable.current.position.y = Math.sin(t * 0.8) * 0.06;
            } else {
                // The plinth turns a little each way, so the plates catch the light without ever going edge-on.
                turntable.current.rotation.y += (Math.sin(t * 0.3) * 0.32 + pointer.x * 0.2 + p * 0.4 - turntable.current.rotation.y) * k;
            }
        }
        if (rig.current) {
            rig.current.rotation.x += (pointer.y * 0.06 - rig.current.rotation.x) * k;
            rig.current.rotation.y += (pointer.x * 0.12 - rig.current.rotation.y) * k;
        }
        if (cam.current) {
            cam.current.position.z = (portrait ? 9 : logoMode ? 7.2 : 7.4) - p * 1.2;
        }
    });

    // Where the subject sits: the right half of a wide hero, the top band of a tall one, or centred.
    const anchor: [number, number, number] = compact ? [0, 0, 0] : portrait ? [0, logoMode ? 1.55 : 1.45, 0] : [logoMode ? 1.7 : 1.95, logoMode ? 0.1 : 0.2, 0];
    const scale = compact ? 0.82 : portrait ? (logoMode ? 0.6 : 0.62) : logoMode ? 0.9 : 0.78;

    return (
        <>
            <PerspectiveCamera ref={cam} makeDefault position={[0, logoMode ? 0.25 : 0.9, 7.4]} rotation={[logoMode ? 0 : -0.1, 0, 0]} fov={32} />
            {backdrop ? <BackdropArt url={backdrop} onLoad={markLoaded} /> : <InkBackdrop red={0} density={0.32} octaves={5} />}

            {/* Studio: long softboxes overhead and to the side, a cool rim from behind. */}
            <Environment resolution={256} frames={1}>
                <Lightformer form="rect" intensity={4} position={[0, 5, 2]} rotation-x={Math.PI / 2} scale={[8, 2, 1]} />
                <Lightformer form="rect" intensity={2} position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[4, 4, 1]} />
                <Lightformer form="rect" intensity={1.5} position={[5, 0, -3]} rotation-y={-Math.PI / 2} scale={[3, 5, 1]} />
            </Environment>
            <spotLight position={[0, 6, 3]} angle={0.5} penumbra={0.8} intensity={30} distance={14} />
            <ambientLight intensity={0.2} />

            <group position={anchor} scale={scale}>
                <group ref={rig}>
                    {logoMode ? (
                        <>
                            <group ref={turntable}>
                                <LogoBadge url={logo!} onLoad={markLoaded} />
                            </group>
                            <group position={[0, -1.75, 0]}>
                                <ShadowPool width={3.2} opacity={0.6} />
                            </group>
                        </>
                    ) : (
                        <group position={[0, -1.15, 0]}>
                            {/* Plinth: black lacquer drum. Its top is a dark glass disc, so the
                                mirrored plates beneath it read as a reflection in the lacquer. */}
                            <mesh position={[0, -0.14, 0]}>
                                <cylinderGeometry args={[PLINTH_R, PLINTH_R + 0.08, 0.28, 96, 1, true]} />
                                <meshPhysicalMaterial color="#090909" roughness={0.18} metalness={0.4} clearcoat={1} clearcoatRoughness={0.05} side={THREE.DoubleSide} />
                            </mesh>
                            <mesh position={[0, -0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                                <circleGeometry args={[PLINTH_R + 0.08, 96]} />
                                <meshBasicMaterial color="#000000" />
                            </mesh>
                            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
                                <circleGeometry args={[PLINTH_R, 96]} />
                                <meshPhysicalMaterial color="#050505" roughness={0.12} metalness={0.2} clearcoat={1} clearcoatRoughness={0.04} transparent opacity={0.82} depthWrite={false} />
                            </mesh>
                            <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                                <ringGeometry args={[PLINTH_R - 0.03, PLINTH_R, 128]} />
                                <meshBasicMaterial color="#ffffff" transparent opacity={0.35} />
                            </mesh>
                            <group ref={turntable}>
                                <Plates images={images} onLoad={markLoaded} />
                            </group>
                        </group>
                    )}
                </group>
            </group>
        </>
    );
}
