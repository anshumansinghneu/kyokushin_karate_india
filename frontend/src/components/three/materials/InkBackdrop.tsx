"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { pointer } from "../pointer";

/*
 * Sumi ink drifting through still water. A screen-space quad (fills whatever
 * View rectangle it is drawn in) running domain-warped fbm. Optional photo is
 * revealed only where the ink is dense, as if the image were in the smoke.
 * Vignette and grain are folded in here so no postprocessing pass is needed.
 */

const vertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uPointer;
uniform float uReveal;   // intro, 0 -> 1
uniform float uFade;     // scroll-out, 0 -> 1 (to black)
uniform float uRed;      // strength of the red core
uniform float uImage;    // 0 when no texture
uniform float uOctaves;
uniform float uDensity;
uniform vec2 uCore;      // uv position of the red heart
uniform sampler2D uTex;
uniform vec2 uTexRes;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 6; i++) {
    if (float(i) >= uOctaves) break;
    v += a * noise(p); p = r * p * 2.02; a *= 0.5;
  }
  return v;
}

vec2 coverUv(vec2 uv, vec2 res, vec2 texRes) {
  float rs = res.x / res.y; float rt = texRes.x / texRes.y;
  vec2 scale = rs > rt ? vec2(1.0, rt / rs) : vec2(rs / rt, 1.0);
  return (uv - 0.5) * scale + 0.5;
}

void main() {
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  float t = uTime * 0.045;

  // Ink is pushed gently away from the pointer.
  vec2 pp = uPointer * vec2(uRes.x / uRes.y, 1.0) * 0.5;
  vec2 away = p - pp;
  p += normalize(away + 1e-4) * 0.06 * exp(-dot(away, away) * 6.0);

  vec2 q = vec2(fbm(p * 1.6 + vec2(0.0, t)), fbm(p * 1.6 + vec2(5.2, -t)));
  vec2 r = vec2(fbm(p * 1.9 + 3.5 * q + vec2(1.7, 9.2) + t * 0.6), fbm(p * 1.9 + 3.5 * q + vec2(8.3, 2.8) - t * 0.4));
  float ink = fbm(p * 1.4 + 3.0 * r);

  // Rises from below during the intro.
  float rise = smoothstep(-0.2, 1.1, uReveal * 1.6 - (1.0 - uv.y));
  float body = smoothstep(0.38, 0.78, ink) * rise;
  // Thin bright filaments where the warped field folds over itself.
  float filament = (1.0 - smoothstep(0.0, 0.015, abs(fbm(p * 3.2 + 4.0 * r) - 0.5))) * body;
  ink = body;

  vec3 col = vec3(0.0);
  // Output is display-referred (no colour-space conversion): these are the grey levels you see.
  col += vec3(0.93, 0.93, 0.94) * (ink * 0.26 + filament * 0.30) * uDensity;

  if (uImage > 0.5) {
    vec3 img = texture2D(uTex, coverUv(uv, uRes, uTexRes)).rgb;
    float g = dot(img, vec3(0.299, 0.587, 0.114));
    g = pow(g, 1.25);
    col += vec3(g) * smoothstep(0.15, 0.85, ink) * 0.55 * uReveal;
  }

  // A low red heart, like lacquer under smoke. Earned colour, kept faint.
  vec2 cp = (uCore - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  float core = exp(-pow(length(p - cp) * 2.6, 2.0));
  col += vec3(0.42, 0.0, 0.0) * core * (0.4 + 0.6 * ink) * uRed * uReveal;

  // Vignette and grain.
  float vig = 1.0 - smoothstep(0.25, 1.15, length((uv - 0.5) * vec2(1.25, 1.0)));
  col *= vig;
  col += (hash(uv * uRes + fract(uTime) * 61.0) - 0.5) * 0.035;

  col *= 1.0 - uFade;
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`;

const target = new THREE.Vector2();

interface InkBackdropProps {
    texture?: THREE.Texture | null;
    reveal?: { current: number };
    fade?: { current: number };
    red?: number;
    octaves?: number;
    /** Overall ink brightness. */
    density?: number;
    /** Where the red heart sits, in view uv (0..1, y up). */
    core?: [number, number];
}

export default function InkBackdrop({ texture, reveal, fade, red = 1, octaves = 6, density = 1, core = [0.5, 0.5] }: InkBackdropProps) {
    const size = useThree((s) => s.size);
    const mat = useRef<THREE.ShaderMaterial>(null);
    const smooth = useRef(new THREE.Vector2());

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uRes: { value: new THREE.Vector2(1, 1) },
            uPointer: { value: new THREE.Vector2() },
            uReveal: { value: 0 },
            uFade: { value: 0 },
            uRed: { value: red },
            uImage: { value: 0 },
            uOctaves: { value: octaves },
            uDensity: { value: density },
            uCore: { value: new THREE.Vector2(0.5, 0.5) },
            uTex: { value: null as THREE.Texture | null },
            uTexRes: { value: new THREE.Vector2(1, 1) },
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    useFrame((_, delta) => {
        // Write through the live material: R3F may hand the material a copy of the uniforms object.
        const u = (mat.current?.uniforms ?? uniforms) as typeof uniforms;
        u.uTime.value += delta;
        u.uRes.value.set(size.width, size.height);
        target.set(pointer.x, pointer.y);
        smooth.current.lerp(target, 1 - Math.exp(-delta * 2));
        u.uPointer.value.copy(smooth.current);
        u.uReveal.value = reveal ? reveal.current : 1;
        u.uFade.value = fade ? fade.current : 0;
        u.uRed.value = red;
        u.uOctaves.value = octaves;
        u.uDensity.value = density;
        u.uCore.value.set(core[0], core[1]);
        const img = texture?.image as { width?: number; height?: number; videoWidth?: number; videoHeight?: number } | undefined;
        if (texture && img) {
            u.uTex.value = texture;
            u.uImage.value = 1;
            u.uTexRes.value.set(img.videoWidth || img.width || 1, img.videoHeight || img.height || 1);
        } else {
            u.uImage.value = 0;
        }
    });

    return (
        <mesh frustumCulled={false} renderOrder={-1}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
                ref={mat}
                vertexShader={vertex}
                fragmentShader={fragment}
                uniforms={uniforms}
                depthWrite={false}
                depthTest={false}
            />
        </mesh>
    );
}
