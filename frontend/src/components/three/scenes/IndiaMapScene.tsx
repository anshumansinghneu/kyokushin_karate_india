"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import InkBackdrop from "../materials/InkBackdrop";
import { pointer } from "../pointer";
import { useReadySignal } from "./sceneUtils";

export interface MapCity {
    key: string;
    lat: number;
    lon: number;
    count: number;
}

interface IndiaMapSceneProps {
    cities: MapCity[];
    /** City key to fly to, or null for the whole country. */
    focus?: string | null;
    onReady?: () => void;
}

// Equirectangular around the subcontinent's middle, x squeezed by cos(lat).
const LON0 = 82;
const LAT0 = 22.5;
const K = 0.14;
const COS = Math.cos((LAT0 * Math.PI) / 180);
const project = (lon: number, lat: number) => new THREE.Vector2((lon - LON0) * K * COS, (lat - LAT0) * K);

const DEPTH = 0.12;

function useIndiaShapes() {
    const [rings, setRings] = useState<[number, number][][] | null>(null);
    useEffect(() => {
        let alive = true;
        fetch("/geo/india.json")
            .then((r) => r.json())
            .then((d: { rings: [number, number][][] }) => alive && setRings(d.rings))
            .catch(() => {
                /* No outline: the pillars still stand on their own. */
            });
        return () => {
            alive = false;
        };
    }, []);
    return useMemo(() => {
        if (!rings) return null;
        const shapes = rings.map((ring) => new THREE.Shape(ring.map(([lon, lat]) => project(lon, lat))));
        const land = new THREE.ExtrudeGeometry(shapes, { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 2, curveSegments: 4 });
        const edges = rings.map((ring) => {
            const pts = ring.map(([lon, lat]) => {
                const v = project(lon, lat);
                return new THREE.Vector3(v.x, v.y, DEPTH + 0.016);
            });
            pts.push(pts[0].clone());
            return new THREE.BufferGeometry().setFromPoints(pts);
        });
        return { land, edges };
    }, [rings]);
}

const ringVertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
// Ripples spreading from a pillar's foot, like a stone dropped in still water.
const ringFragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec3 uColor;
uniform float uStrength;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  float wave = fract(d * 1.0 - uTime * 0.45);
  float ring = smoothstep(0.0, 0.04, wave) * (1.0 - smoothstep(0.04, 0.12, wave));
  float a = ring * (1.0 - d) * uStrength + (1.0 - smoothstep(0.0, 0.18, d)) * 0.6 * uStrength;
  if (d > 1.0) discard;
  gl_FragColor = vec4(uColor * a, a);
}
`;

function Pillar({ city, focused, dim }: { city: MapCity; focused: boolean; dim: boolean }) {
    const p = useMemo(() => project(city.lon, city.lat), [city.lon, city.lat]);
    const height = 0.22 + Math.sqrt(city.count) * 0.22;
    const beam = useRef<THREE.MeshBasicMaterial>(null);
    const ring = useRef<THREE.ShaderMaterial>(null);
    const grow = useRef(0);
    const group = useRef<THREE.Group>(null);
    const uniforms = useMemo(() => ({ uTime: { value: Math.random() * 3 }, uColor: { value: new THREE.Color(1, 1, 1) }, uStrength: { value: 1 } }), []);
    const red = useMemo(() => new THREE.Color("#ff2020"), []);
    const white = useMemo(() => new THREE.Color("#ffffff"), []);

    useFrame((_, delta) => {
        grow.current = Math.min(1, grow.current + delta * 0.8);
        const e = 1 - Math.pow(1 - grow.current, 3);
        if (group.current) group.current.scale.set(1, 1, Math.max(0.001, e));
        const target = focused ? red : white;
        if (beam.current) {
            beam.current.color.lerp(target, 1 - Math.exp(-delta * 6));
            beam.current.opacity = dim ? 0.2 : focused ? 1 : 0.85;
        }
        const u = ring.current?.uniforms;
        if (u) {
            u.uTime.value += delta;
            (u.uColor.value as THREE.Color).lerp(target, 1 - Math.exp(-delta * 6));
            u.uStrength.value = dim ? 0.15 : focused ? 1.2 : 0.55;
        }
    });

    return (
        <group position={[p.x, p.y, DEPTH + 0.02]}>
            <group ref={group}>
                <mesh position={[0, 0, height / 2]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.016, 0.03, height, 12, 1, true]} />
                    <meshBasicMaterial ref={beam} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
                </mesh>
            </group>
            <mesh position={[0, 0, 0.002]}>
                <planeGeometry args={[0.42, 0.42]} />
                <shaderMaterial ref={ring} vertexShader={ringVertex} fragmentShader={ringFragment} uniforms={uniforms} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
        </group>
    );
}

/**
 * India in black lacquer, a thread of light rising from every city with a dojo.
 * Taller beams mean more dojos. Choosing a city in the page flies the camera
 * down to it and turns its beam red; the others dim.
 */
export default function IndiaMapScene({ cities, focus = null, onReady }: IndiaMapSceneProps) {
    const india = useIndiaShapes();
    const cam = useRef<THREE.PerspectiveCamera>(null);
    const stage = useRef<THREE.Group>(null);
    const clock = useRef(0);
    const look = useRef(new THREE.Vector3(0, 0, 0));
    const size = useThree((s) => s.size);
    const portrait = size.width < size.height * 0.9;
    const focused = cities.find((c) => c.key === focus) ?? null;

    useEffect(() => () => {
        india?.land.dispose();
        india?.edges.forEach((g) => g.dispose());
    }, [india]);

    useReadySignal(india ? onReady : undefined);

    useFrame((_, delta) => {
        clock.current += Math.min(delta, 0.1);
        const t = clock.current;
        const k = 1 - Math.exp(-delta * 1.8);
        const c = cam.current;
        if (!c) return;

        // The map lies on the floor (x/y plane tilted back); the camera looks down at it.
        let target: THREE.Vector3;
        let from: THREE.Vector3;
        if (focused) {
            const p = project(focused.lon, focused.lat);
            // Close in on the city, keeping it right of the copy on wide screens.
            const shift = portrait ? 0 : -0.75;
            target = new THREE.Vector3(p.x + shift, p.y + 0.2, 0.15);
            from = new THREE.Vector3(p.x + shift + 0.3, p.y - (portrait ? 3.2 : 2.6), portrait ? 4.2 : 2.7);
        } else {
            // Aim left of the country's centre so India sits in the right half, clear of the copy.
            target = new THREE.Vector3(portrait ? 0.15 : -1.25, portrait ? 0.35 : 0.25, 0);
            const sway = Math.sin(t * 0.12) * 0.35;
            from = new THREE.Vector3(target.x + sway + pointer.x * 0.35, target.y - (portrait ? 3.4 : 5.2) + pointer.y * 0.3, portrait ? 8.6 : 5.4);
        }
        c.position.lerp(from, k);
        look.current.lerp(target, k);
        c.up.set(0, 0, 1);
        c.lookAt(look.current);
    });

    return (
        <>
            <PerspectiveCamera ref={cam} makeDefault position={[1, -5, 4.5]} fov={34} />
            <InkBackdrop red={0} density={0.35} octaves={5} />
            <Environment resolution={128} frames={1}>
                <Lightformer form="rect" intensity={1.1} position={[0, 0, 6]} scale={[10, 10, 1]} />
                <Lightformer form="rect" intensity={1.2} position={[-4, -4, 2]} rotation-x={Math.PI / 3} scale={[6, 1, 1]} />
            </Environment>
            <directionalLight position={[-3, -4, 6]} intensity={0.9} />

            <group ref={stage}>
                {india && (
                    <>
                        <mesh geometry={india.land}>
                            <meshPhysicalMaterial color="#0e0e0e" roughness={0.35} metalness={0.2} clearcoat={1} clearcoatRoughness={0.15} />
                        </mesh>
                        {india.edges.map((g, i) => (
                            <lineLoop key={i} geometry={g}>
                                <lineBasicMaterial color="#ffffff" transparent opacity={0.35} />
                            </lineLoop>
                        ))}
                    </>
                )}
                {cities.map((city) => (
                    <Pillar key={city.key} city={city} focused={focused?.key === city.key} dim={!!focused && focused.key !== city.key} />
                ))}
            </group>
        </>
    );
}
