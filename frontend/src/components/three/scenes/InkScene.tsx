"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";
import InkBackdrop from "../materials/InkBackdrop";
import { pointer } from "../pointer";
import { useLoadedTexture, useReadySignal } from "./sceneUtils";

/*
 * The quiet hero for reading and utility pages: sumi ink drifting in still
 * water, an optional photograph surfacing where the ink is dense, and a large
 * brushed character floating in it with a faint echo behind for depth. The
 * character is painted onto a canvas from the system's Japanese serif (no font
 * download) and brushed in by a noise-masked reveal.
 */

interface InkSceneProps {
    /** Photo revealed through the dense ink. */
    imageUrl?: string;
    /** One or two characters, written vertically. Defaults to 極真. Pass "" for ink only. */
    kanji?: string;
    /** 0..1 strength of the red heart behind the character. Earned colour: keep it low. */
    red?: number;
    /** 0 at the top of the hero, 1 once it has scrolled away. */
    progress?: MotionValue<number>;
    /** Which side the character floats on when the screen is wide. */
    side?: "right" | "left" | "center";
    onReady?: () => void;
}

const vertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// The glyph is brushed in: noise decides which fibres of the stroke arrive first,
// and the edge of the reveal bleeds like ink on damp paper.
const fragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uReveal;
uniform float uOpacity;
uniform float uTime;
uniform vec3 uColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}

void main() {
  vec2 wobble = vec2(noise(vUv * 14.0 + uTime * 0.08), noise(vUv * 14.0 - uTime * 0.07)) - 0.5;
  float a = texture2D(uTex, vUv + wobble * 0.004).a;
  float n = noise(vUv * 7.0) * 0.6 + noise(vUv * 23.0) * 0.4;
  // Top of the glyph arrives first, like a brush pulled downward.
  float front = uReveal * 1.35 - (1.0 - vUv.y) * 0.35;
  float mask = smoothstep(n - 0.12, n + 0.04, front);
  // Dry-brush texture inside the stroke.
  float dry = 0.82 + 0.18 * noise(vUv * vec2(60.0, 8.0));
  float alpha = a * mask * uOpacity * dry;
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;

/** Paints the characters, stacked vertically, into a transparent canvas texture. */
function useGlyphTexture(text: string) {
    return useMemo(() => {
        if (!text) return null;
        const chars = Array.from(text);
        const cell = 512;
        const c = document.createElement("canvas");
        c.width = cell;
        c.height = cell * chars.length;
        const ctx = c.getContext("2d");
        if (!ctx) return null;
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `700 ${Math.round(cell * 0.82)}px "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", "Noto Serif CJK JP", "Source Han Serif", serif`;
        chars.forEach((ch, i) => ctx.fillText(ch, cell / 2, cell * i + cell / 2 + cell * 0.02));
        const tex = new THREE.CanvasTexture(c);
        tex.anisotropy = 4;
        tex.needsUpdate = true;
        return { tex, aspect: 1 / chars.length };
    }, [text]);
}

function Glyph({
    tex,
    width,
    height,
    z,
    opacity,
    color,
    revealRef,
    opacityRef,
}: {
    tex: THREE.Texture;
    width: number;
    height: number;
    z: number;
    opacity: number;
    color: string;
    revealRef: { current: number };
    opacityRef: { current: number };
}) {
    const mat = useRef<THREE.ShaderMaterial>(null);
    const uniforms = useMemo(
        () => ({
            uTex: { value: tex },
            uReveal: { value: 0 },
            uOpacity: { value: opacity },
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(color) },
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );
    useFrame((_, delta) => {
        // Write through the live material: R3F may hand it a copy of the uniforms object.
        const u = mat.current?.uniforms;
        if (!u) return;
        u.uTex.value = tex;
        u.uReveal.value = revealRef.current;
        u.uOpacity.value = opacity * opacityRef.current;
        u.uTime.value += delta;
    });
    return (
        <mesh position-z={z}>
            <planeGeometry args={[width, height]} />
            <shaderMaterial ref={mat} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} transparent depthWrite={false} />
        </mesh>
    );
}

const easeOutQuart = (t: number) => 1 - Math.pow(1 - Math.min(1, t), 4);

export default function InkScene({ imageUrl, kanji = "極真", red = 0.35, progress, side = "right", onReady }: InkSceneProps) {
    const texture = useLoadedTexture(imageUrl);
    const glyph = useGlyphTexture(kanji);
    const size = useThree((s) => s.size);
    const portrait = size.width < size.height * 0.9;
    const group = useRef<THREE.Group>(null);
    const clock = useRef(0);
    const reveal = useRef(0);
    const inkReveal = useRef(0);
    const fade = useRef(0);
    const glyphOpacity = useRef(1);

    useEffect(() => () => glyph?.tex.dispose(), [glyph]);
    useReadySignal(onReady);

    // Visible extent at z = 0 for a 32° camera at z = 6.
    const viewH = 2 * Math.tan(THREE.MathUtils.degToRad(16)) * 6;
    const viewW = viewH * (size.width / Math.max(1, size.height));
    const multi = !!glyph && glyph.aspect < 1;
    const anchorU = portrait || side === "center" ? 0.5 : side === "left" ? 0.2 : 0.82;
    const anchorV = portrait ? 0.74 : multi ? 0.56 : 0.54;
    const glyphH = portrait ? viewH * (multi ? 0.38 : 0.3) : viewH * (multi ? 0.7 : 0.5);
    const glyphW = glyph ? glyphH * glyph.aspect : 0;
    const core: [number, number] = [anchorU, anchorV];

    useFrame((_, delta) => {
        clock.current += Math.min(delta, 0.1);
        const t = clock.current;
        inkReveal.current = easeOutQuart(t / 2.2);
        reveal.current = easeOutQuart(Math.max(0, t - 0.35) / 2.4);
        const p = progress ? THREE.MathUtils.clamp(progress.get(), 0, 1) : 0;
        fade.current = THREE.MathUtils.smoothstep(p, 0.5, 1);
        glyphOpacity.current = 1 - THREE.MathUtils.smoothstep(p, 0.2, 0.85);

        const g = group.current;
        if (g) {
            const k = 1 - Math.exp(-delta * 2.5);
            g.rotation.y += (pointer.x * 0.18 + Math.sin(t * 0.25) * 0.04 - g.rotation.y) * k;
            g.rotation.x += (-pointer.y * 0.1 - g.rotation.x) * k;
            g.position.y = (anchorV - 0.5) * viewH + Math.sin(t * 0.5) * 0.04 + p * 0.6;
        }
    });

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={32} />
            <InkBackdrop texture={texture} reveal={inkReveal} fade={fade} red={red} density={0.9} core={core} octaves={portrait ? 5 : 6} />
            {glyph && (
                <group ref={group} position={[(anchorU - 0.5) * viewW, 0, 0]}>
                    {/* Echo behind: the same character, larger and fainter, for parallax depth. */}
                    <Glyph tex={glyph.tex} width={glyphW * 1.12} height={glyphH * 1.12} z={-0.9} opacity={0.08} color="#ffffff" revealRef={reveal} opacityRef={glyphOpacity} />
                    <Glyph tex={glyph.tex} width={glyphW} height={glyphH} z={0} opacity={0.62} color="#f4f2ee" revealRef={reveal} opacityRef={glyphOpacity} />
                </group>
            )}
        </>
    );
}
