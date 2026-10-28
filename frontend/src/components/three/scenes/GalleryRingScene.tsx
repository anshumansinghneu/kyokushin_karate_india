"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import InkBackdrop from "../materials/InkBackdrop";
import { pointer } from "../pointer";
import { useLoadedTexture, useReadySignal } from "./sceneUtils";

interface GalleryRingSceneProps {
    images: string[];
    /** Target rotation in radians, written by the page's drag and arrow controls, plus a scroll offset. */
    spin?: { current: number; scroll?: number };
    /** Called with the index of the print facing the viewer when it changes. */
    onFront?: (index: number) => void;
    onReady?: () => void;
}

const vertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// The prints are seen from inside the wall, so the photo is mirrored back the right way
// round. Colour is fullest at the centre and only softens toward the edges: the wall
// should read as photographs, not as a dark room.
const fragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uHasTex;
uniform float uFocus;
uniform vec2 uTexRes;
uniform float uAspect;

void main() {
  // Cover-fit the photo into the panel.
  float rt = uTexRes.x / uTexRes.y;
  vec2 scale = uAspect > rt ? vec2(1.0, rt / uAspect) : vec2(uAspect / rt, 1.0);
  vec2 uv = (vec2(1.0 - vUv.x, vUv.y) - 0.5) * scale + 0.5;
  vec3 c = uHasTex > 0.5 ? texture2D(uTex, uv).rgb : vec3(0.06);
  float g = dot(c, vec3(0.299, 0.587, 0.114));
  vec3 col = mix(vec3(g), c, 0.45 + 0.55 * uFocus);
  col *= 0.62 + 0.38 * uFocus;
  // Soft vignette at the panel edge.
  vec2 d = min(vUv, 1.0 - vUv);
  col *= smoothstep(0.0, 0.05, min(d.x, d.y * 1.6));
  gl_FragColor = vec4(col, 1.0);
}
`;

function Panel({
    url,
    index,
    count,
    radius,
    height,
    focus,
}: {
    url: string;
    index: number;
    count: number;
    radius: number;
    height: number;
    focus: { current: number[] };
}) {
    const tex = useLoadedTexture(url);
    const mat = useRef<THREE.ShaderMaterial>(null);
    const step = (Math.PI * 2) / count;
    const theta = step * 0.9;
    const arc = radius * theta;
    const geometry = useMemo(() => {
        // An open cylinder segment centred on +Z, so each print is gently curved.
        const g = new THREE.CylinderGeometry(radius, radius, height, 24, 1, true, -theta / 2, theta);
        return g;
    }, [radius, height, theta]);
    const uniforms = useMemo(
        () => ({
            uTex: { value: null as THREE.Texture | null },
            uHasTex: { value: 0 },
            uFocus: { value: 0 },
            uTexRes: { value: new THREE.Vector2(16, 9) },
            uAspect: { value: arc / height },
        }),
        [arc, height],
    );

    useEffect(() => () => geometry.dispose(), [geometry]);

    useFrame(() => {
        // Write through the live material: R3F may hand it a copy of the uniforms object.
        const u = mat.current?.uniforms;
        if (!u) return;
        u.uTex.value = tex;
        u.uHasTex.value = tex ? 1 : 0;
        const img = tex?.image as { width?: number; height?: number } | undefined;
        if (img?.width && img.height) (u.uTexRes.value as THREE.Vector2).set(img.width, img.height);
        u.uFocus.value = focus.current[index] ?? 0;
        u.uAspect.value = arc / height;
    });

    return (
        <mesh geometry={geometry} rotation={[0, index * step, 0]}>
            <shaderMaterial ref={mat} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} side={THREE.DoubleSide} />
        </mesh>
    );
}

/**
 * A concave wall of real dojo photographs (Vivant): the camera stands inside the curve,
 * so every print in view faces the visitor and the wall wraps toward them at the edges.
 * It turns slowly on its own; dragging and scrolling the page turn it further (the page
 * writes both into `spin`). The print at the centre is in full colour.
 */
export default function GalleryRingScene({ images, spin, onFront, onReady }: GalleryRingSceneProps) {
    const ring = useRef<THREE.Group>(null);
    const angle = useRef(0);
    const drift = useRef(0);
    const front = useRef(-1);
    const focus = useRef<number[]>(images.map(() => 0));
    const cb = useRef(onFront);
    const size = useThree((s) => s.size);
    const portrait = size.width < size.height * 0.9;

    useEffect(() => {
        cb.current = onFront;
    }, [onFront]);

    useReadySignal(onReady);

    const count = Math.max(images.length, 1);
    const radius = 6;
    const height = (radius * ((Math.PI * 2) / count) * 0.9) / (16 / 10);

    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.1);
        // A slow idle turn that the visitor's drag adds to, never fights.
        drift.current -= dt * 0.06;
        const target = (spin?.current ?? 0) + (spin?.scroll ?? 0) + drift.current;
        angle.current += (target - angle.current) * (1 - Math.exp(-dt * 5));
        const a = angle.current;

        const g = ring.current;
        if (g) {
            g.rotation.y = a;
            g.rotation.x += (pointer.y * 0.05 - g.rotation.x) * (1 - Math.exp(-dt * 3));
        }

        // Which panel is straight ahead (-Z, across the wall from the camera): panel i sits
        // at angle i*step + a, measured from +Z.
        const step = (Math.PI * 2) / count;
        let best = 0;
        let bestCos = -2;
        focus.current = images.map((_, i) => {
            const c = -Math.cos(i * step + a);
            if (c > bestCos) {
                bestCos = c;
                best = i;
            }
            return THREE.MathUtils.smoothstep(c, 0.7, 0.99);
        });
        if (best !== front.current) {
            front.current = best;
            cb.current?.(best);
        }
    });

    return (
        <>
            {/* Inside the curve, set back from its centre, so the far wall is straight ahead and the sides wrap in. */}
            <PerspectiveCamera makeDefault position={[0, 0, radius * 0.3]} fov={portrait ? 54 : 44} onUpdate={(c) => c.lookAt(0, portrait ? -0.2 : -0.35, -radius)} />
            <InkBackdrop red={0} density={0.4} octaves={5} />
            {/* The wall sits in the upper part of the frame, clear of the copy at the bottom. */}
            <group ref={ring} position={[0, portrait ? 0.9 : 0.55, 0]}>
                {images.map((url, i) => (
                    <Panel key={url} url={url} index={i} count={count} radius={radius} height={height} focus={focus} />
                ))}
            </group>
        </>
    );
}
