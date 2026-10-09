"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";
import InkBackdrop from "../materials/InkBackdrop";
import { pointer } from "../pointer";
import { useLoadedTexture, useReadySignal } from "./sceneUtils";

interface HistorySceneProps {
    /** 0..1 through the chapters. */
    progress?: MotionValue<number>;
    images: string[];
    onReady?: () => void;
}

const GAP = 7;

const photoVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Archive print: grey until it is the chapter in front of you, edges eaten by ink.
const photoFragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uFocus;
uniform float uHasTex;
uniform float uTime;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}

void main() {
  vec3 c = uHasTex > 0.5 ? texture2D(uTex, vUv).rgb : vec3(0.08);
  float g = dot(c, vec3(0.299, 0.587, 0.114));
  vec3 col = mix(vec3(g), c, uFocus * 0.85);
  col *= 0.35 + 0.65 * uFocus;

  // Ragged ink edge that closes in as the print falls out of focus.
  vec2 d = min(vUv, 1.0 - vUv);
  float edge = min(d.x, d.y);
  float n = noise(vUv * 9.0 + uTime * 0.05) * 0.06 + noise(vUv * 40.0) * 0.015;
  float reach = mix(0.09, 0.012, uFocus);
  float a = smoothstep(reach, reach + 0.03, edge + n);
  if (a < 0.01) discard;
  gl_FragColor = vec4(col, a);
}
`;

function Print({ url, index, focus }: { url: string; index: number; focus: { current: number[] } }) {
    const tex = useLoadedTexture(url);
    const mat = useRef<THREE.ShaderMaterial>(null);
    const uniforms = useMemo(
        () => ({ uTex: { value: null as THREE.Texture | null }, uFocus: { value: 0 }, uHasTex: { value: 0 }, uTime: { value: 0 } }),
        [],
    );
    const img = tex?.image as { width: number; height: number } | undefined;
    const aspect = img ? img.width / img.height : 1;
    const h = 2.25;
    const side = index % 2 === 0 ? 1 : -1;

    useFrame((_, delta) => {
        // Write through the live material: R3F may hand it a copy of the uniforms object.
        const u = mat.current?.uniforms;
        if (!u) return;
        u.uTex.value = tex;
        u.uHasTex.value = tex ? 1 : 0;
        u.uFocus.value = focus.current[index] ?? 0;
        u.uTime.value += delta;
    });

    return (
        <mesh position={[side * 1.5, 0.1, -index * GAP]} rotation={[0, -side * 0.22, 0]}>
            <planeGeometry args={[h * aspect, h]} />
            <shaderMaterial ref={mat} vertexShader={photoVertex} fragmentShader={photoFragment} uniforms={uniforms} transparent depthWrite={false} />
        </mesh>
    );
}

/**
 * A corridor of archive prints. Scroll walks the camera down it, one chapter
 * per print; the print you are facing comes into colour, the rest stay grey
 * and recede into the dark.
 */
export default function HistoryScene({ progress, images, onReady }: HistorySceneProps) {
    const cam = useRef<THREE.PerspectiveCamera>(null);
    const shown = useRef(0);
    const focus = useRef<number[]>(images.map(() => 0));
    const size = useThree((s) => s.size);
    const portrait = size.width < size.height * 0.9;

    useReadySignal(onReady);

    useFrame((_, delta) => {
        const n = images.length;
        const target = progress ? THREE.MathUtils.clamp(progress.get(), 0, 1) * (n - 1) : 0;
        shown.current += (target - shown.current) * (1 - Math.exp(-delta * 4));
        const s = shown.current;
        focus.current = images.map((_, i) => Math.max(0, 1 - Math.abs(s - i) * 1.6));

        const c = cam.current;
        if (c) {
            // Drift towards the side the current print hangs on, so it sits off-centre opposite the copy.
            const i = Math.round(s);
            const side = i % 2 === 0 ? 1 : -1;
            const lookX = portrait ? side * 1.25 : side * 0.2;
            c.position.z = 5.2 - s * GAP;
            c.position.x += (lookX + pointer.x * 0.25 - c.position.x) * (1 - Math.exp(-delta * 2));
            c.position.y = 0.1 + pointer.y * 0.15;
            c.lookAt(c.position.x * 0.6, 0.1, c.position.z - GAP);
        }
    });

    return (
        <>
            <PerspectiveCamera ref={cam} makeDefault position={[0, 0.1, 5.2]} fov={portrait ? 55 : 38} />
            <InkBackdrop red={0} density={0.45} octaves={5} />
            <fog attach="fog" args={["#000000", 4, GAP * 1.6]} />
            {images.map((url, i) => (
                <Print key={url} url={url} index={i} focus={focus} />
            ))}
        </>
    );
}
