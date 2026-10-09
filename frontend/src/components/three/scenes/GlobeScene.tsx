"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import InkBackdrop from "../materials/InkBackdrop";
import { pointer } from "../pointer";
import { useReadySignal } from "./sceneUtils";

interface GlobeSceneProps {
    /** ISO alpha-2 of the host country, or null for India alone. */
    hostCode?: string | null;
    onReady?: () => void;
}

interface WorldData {
    dots: number[];
    centroids: Record<string, [number, number]>;
}

const R = 1.6;
const CAM_WIDE: [number, number, number] = [-1.7, 0, 7.1];
const CAM_TALL: [number, number, number] = [0, 0.1, 7.6];
const INDIA: [number, number] = [78.96, 22.6];

function toVec(lon: number, lat: number, r = R) {
    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(lon + 180);
    return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

function useGeo() {
    const [world, setWorld] = useState<WorldData | null>(null);
    const [india, setIndia] = useState<[number, number][][] | null>(null);
    useEffect(() => {
        let alive = true;
        fetch("/geo/world-dots.json").then((r) => r.json()).then((d: WorldData) => alive && setWorld(d)).catch(() => {});
        fetch("/geo/india.json").then((r) => r.json()).then((d: { rings: [number, number][][] }) => alive && setIndia(d.rings)).catch(() => {});
        return () => {
            alive = false;
        };
    }, []);
    return { world, india };
}

/* Land as a field of dots; each fades as it turns to the back of the globe. */
const dotVertex = /* glsl */ `
uniform float uSize;
uniform float uPixelRatio;
varying float vFacing;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec3 n = normalize(normalMatrix * normalize(position));
  vFacing = dot(n, normalize(-mv.xyz));
  gl_PointSize = uSize * uPixelRatio * (3.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;
const dotFragment = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform float uOpacity;
varying float vFacing;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5 || vFacing < 0.0) discard;
  float a = smoothstep(0.5, 0.2, d) * smoothstep(0.0, 0.35, vFacing) * uOpacity;
  gl_FragColor = vec4(uColor, a);
}
`;

function Dots({ positions, size, color, opacity }: { positions: Float32Array; size: number; color: string; opacity: number }) {
    const mat = useRef<THREE.ShaderMaterial>(null);
    const dpr = useThree((s) => s.viewport.dpr);
    const uniforms = useMemo(
        () => ({ uSize: { value: size }, uPixelRatio: { value: dpr }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity } }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );
    useFrame(() => {
        const u = mat.current?.uniforms;
        if (!u) return;
        u.uPixelRatio.value = dpr;
        u.uSize.value = size;
        u.uOpacity.value = opacity;
    });
    const geo = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        return g;
    }, [positions]);
    useEffect(() => () => geo.dispose(), [geo]);
    return (
        <points geometry={geo}>
            <shaderMaterial ref={mat} vertexShader={dotVertex} fragmentShader={dotFragment} uniforms={uniforms} transparent depthWrite={false} />
        </points>
    );
}

/* The flight: a great-circle arc lifted off the surface, drawn on, then a bright head travelling along it. */
const arcVertex = /* glsl */ `
varying float vU;
void main() { vU = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const arcFragment = /* glsl */ `
precision highp float;
uniform float uDraw;
uniform float uHead;
uniform vec3 uColor;
varying float vU;
void main() {
  if (vU > uDraw) discard;
  float trail = 0.35 + 0.65 * smoothstep(0.0, 1.0, vU);
  float head = exp(-pow((vU - uHead) * 18.0, 2.0)) * step(0.999, uDraw);
  vec3 col = uColor * (trail + head * 2.2);
  gl_FragColor = vec4(col, min(1.0, trail * 0.9 + head));
}
`;

function Arc({ from, to }: { from: [number, number]; to: [number, number] }) {
    const mat = useRef<THREE.ShaderMaterial>(null);
    const draw = useRef(0);
    const head = useRef(0);
    const curve = useMemo(() => {
        const a = toVec(from[0], from[1], 1).normalize();
        const b = toVec(to[0], to[1], 1).normalize();
        const angle = a.angleTo(b);
        const lift = 0.12 + angle * 0.35;
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 64; i++) {
            const t = i / 64;
            const v = new THREE.Vector3().copy(a).lerp(b, t).normalize();
            // Slerp-ish: renormalised lerp is fine for arcs under ~120°.
            const h = R + 0.01 + Math.sin(Math.PI * t) * lift;
            pts.push(v.multiplyScalar(h));
        }
        return new THREE.CatmullRomCurve3(pts);
    }, [from, to]);
    const geo = useMemo(() => new THREE.TubeGeometry(curve, 160, 0.008, 8, false), [curve]);
    useEffect(() => () => geo.dispose(), [geo]);
    const uniforms = useMemo(() => ({ uDraw: { value: 0 }, uHead: { value: 0 }, uColor: { value: new THREE.Color("#ff2a2a") } }), []);

    useFrame((_, delta) => {
        const u = mat.current?.uniforms;
        if (!u) return;
        draw.current = Math.min(1, draw.current + delta * 0.45);
        const e = 1 - Math.pow(1 - draw.current, 3);
        u.uDraw.value = e;
        head.current = (head.current + delta * 0.28) % 1.4;
        u.uHead.value = head.current;
    });

    return (
        <mesh geometry={geo}>
            <shaderMaterial ref={mat} vertexShader={arcVertex} fragmentShader={arcFragment} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
    );
}

/* Expanding rings at a city, flat on the surface. */
const pulseFragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec3 uColor;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  if (d > 1.0) discard;
  float w = fract(d - uTime * 0.5);
  float ring = smoothstep(0.0, 0.05, w) * (1.0 - smoothstep(0.05, 0.14, w)) * (1.0 - d);
  float core = 1.0 - smoothstep(0.0, 0.16, d);
  float a = ring * 0.9 + core;
  gl_FragColor = vec4(uColor * a, a);
}
`;
const pulseVertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

function Pulse({ at, color, size = 0.22 }: { at: [number, number]; color: string; size?: number }) {
    const mat = useRef<THREE.ShaderMaterial>(null);
    // Phase offset from the location, so two pulses never beat in step.
    const uniforms = useMemo(() => ({ uTime: { value: Math.abs(at[0] * 0.37) % 2 }, uColor: { value: new THREE.Color(color) } }), [color, at]);
    const { position, quaternion } = useMemo(() => {
        const p = toVec(at[0], at[1], R + 0.004);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), p.clone().normalize());
        return { position: p, quaternion: q };
    }, [at]);
    useFrame((_, delta) => {
        const u = mat.current?.uniforms;
        if (u) u.uTime.value += delta;
    });
    return (
        <mesh position={position} quaternion={quaternion}>
            <planeGeometry args={[size, size]} />
            <shaderMaterial ref={mat} vertexShader={pulseVertex} fragmentShader={pulseFragment} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
    );
}

/* Rim light: a faint white fresnel shell, so the black sphere separates from the black page. */
const rimVertex = /* glsl */ `
varying vec3 vN; varying vec3 vV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;
const rimFragment = /* glsl */ `
precision highp float;
varying vec3 vN; varying vec3 vV;
void main() {
  float f = pow(1.0 - abs(dot(vN, vV)), 3.0);
  gl_FragColor = vec4(vec3(1.0) * f * 0.35, f * 0.35);
}
`;

/**
 * A lacquer globe in a field of land dots. India is drawn from its official
 * boundary, brighter than the rest; a red flight arc rises from it to the host
 * country, and the globe turns to frame the journey.
 */
export default function GlobeScene({ hostCode = null, onReady }: GlobeSceneProps) {
    const { world, india } = useGeo();
    const spin = useRef<THREE.Group>(null);
    const tilt = useRef<THREE.Group>(null);
    const clock = useRef(0);
    const size = useThree((s) => s.size);
    const portrait = size.width < size.height * 0.9;

    const host = hostCode && hostCode !== "IN" && world?.centroids[hostCode] ? world.centroids[hostCode] : null;

    const landDots = useMemo(() => {
        if (!world) return null;
        const arr = new Float32Array((world.dots.length / 2) * 3);
        for (let i = 0, j = 0; i < world.dots.length; i += 2, j += 3) {
            const v = toVec(world.dots[i], world.dots[i + 1], R + 0.003);
            arr[j] = v.x;
            arr[j + 1] = v.y;
            arr[j + 2] = v.z;
        }
        return arr;
    }, [world]);

    // India: a finer dot fill inside the official outline, plus the outline itself.
    const indiaGeo = useMemo(() => {
        if (!india) return null;
        const inside = (x: number, y: number) =>
            india.some((ring) => {
                let c = false;
                for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
                    const [xi, yi] = ring[i];
                    const [xj, yj] = ring[j];
                    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-12) + xi) c = !c;
                }
                return c;
            });
        const pts: number[] = [];
        for (let lat = 6; lat <= 37.5; lat += 0.75) {
            for (let lon = 67; lon <= 98; lon += 0.75 / Math.cos(THREE.MathUtils.degToRad(lat))) {
                if (inside(lon, lat)) {
                    const v = toVec(lon, lat, R + 0.004);
                    pts.push(v.x, v.y, v.z);
                }
            }
        }
        const outlines = india.map((ring) => {
            const g = new THREE.BufferGeometry().setFromPoints(ring.map(([lon, lat]) => toVec(lon, lat, R + 0.006)));
            return g;
        });
        return { fill: new Float32Array(pts), outlines };
    }, [india]);

    useEffect(() => () => indiaGeo?.outlines.forEach((g) => g.dispose()), [indiaGeo]);

    // Turn the globe so the journey's midpoint faces the camera with north up.
    // Built from the local east/north/out basis at that point; aligning the
    // single vector alone leaves the roll free and the journey lands sideways.
    const facing = useMemo(() => {
        const a = toVec(INDIA[0], INDIA[1], 1).normalize();
        // Weighted towards the destination so the arrival, not the departure, sits nearest the viewer.
        const mid = host ? a.clone().add(toVec(host[0], host[1], 1).normalize().multiplyScalar(1.25)).normalize() : a;
        const east = new THREE.Vector3(0, 1, 0).cross(mid).normalize();
        const north = mid.clone().cross(east).normalize();
        const toPoint = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(east, north, mid));
        // Inverse maps (east, north, out) onto (x, y, z); a small nod lifts the arc into view,
        // and a yaw turns it to the camera, which sits off to one side on wide screens.
        const yaw = Math.atan2(CAM_WIDE[0], CAM_WIDE[2]);
        return toPoint
            .invert()
            .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.18))
            .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), portrait ? 0 : yaw));
    }, [host, portrait]);

    useReadySignal(world && india ? onReady : undefined);

    useFrame((_, delta) => {
        clock.current += Math.min(delta, 0.1);
        const t = clock.current;
        const s = spin.current;
        if (s) s.quaternion.slerp(facing, 1 - Math.exp(-delta * 1.5));
        const g = tilt.current;
        if (g) {
            const k = 1 - Math.exp(-delta * 2);
            g.rotation.y += (Math.sin(t * 0.15) * 0.07 + pointer.x * 0.2 - g.rotation.y) * k;
            g.rotation.x += (-pointer.y * 0.15 - g.rotation.x) * k;
        }
    });

    return (
        <>
            <PerspectiveCamera makeDefault position={portrait ? CAM_TALL : CAM_WIDE} fov={34} />
            <InkBackdrop red={0} density={0.3} octaves={5} />
            {/* One soft overhead source: a gentle sheen on the lacquer, never a mirrored softbox. */}
            <Environment resolution={64} frames={1}>
                <Lightformer form="circle" intensity={0.8} position={[-2, 5, 3]} scale={6} />
            </Environment>

            <group ref={tilt}>
                <group ref={spin}>
                    <mesh>
                        <sphereGeometry args={[R, 96, 96]} />
                        <meshPhysicalMaterial color="#050505" roughness={0.55} metalness={0.1} clearcoat={0.6} clearcoatRoughness={0.45} />
                    </mesh>
                    {landDots && <Dots positions={landDots} size={4.2} color="#ffffff" opacity={0.38} />}
                    {indiaGeo && (
                        <>
                            <Dots positions={indiaGeo.fill} size={3.6} color="#ffffff" opacity={0.9} />
                            {indiaGeo.outlines.map((g, i) => (
                                <lineLoop key={i} geometry={g}>
                                    <lineBasicMaterial color="#ffffff" transparent opacity={0.85} />
                                </lineLoop>
                            ))}
                        </>
                    )}
                    <Pulse at={INDIA} color="#ffffff" size={0.2} />
                    {host && (
                        <>
                            <Arc from={INDIA} to={host} />
                            <Pulse at={host} color="#ff2a2a" size={0.36} />
                        </>
                    )}
                </group>
                <mesh scale={1.06}>
                    <sphereGeometry args={[R, 64, 64]} />
                    <shaderMaterial vertexShader={rimVertex} fragmentShader={rimFragment} transparent depthWrite={false} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
                </mesh>
            </group>
        </>
    );
}
