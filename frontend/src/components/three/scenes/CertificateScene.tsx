"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerspectiveCamera, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import InkBackdrop from "../materials/InkBackdrop";
import { pointer } from "../pointer";
import { useReadySignal } from "./sceneUtils";

interface CertificateSceneProps {
    /** Holder's name; omit for the generic membership card. */
    name?: string;
    membershipNumber?: string;
    rank?: string;
    /** "Student", "Instructor"… */
    role?: string;
    /** Shown under the number, e.g. "Valid until 1 April 2027". */
    note?: string;
    /** Centre the card instead of setting it to the right of the copy. */
    compact?: boolean;
    onReady?: () => void;
}

// Same path data as KankuMark (200x200 viewBox); duplicated so the scene chunk stays self-contained.
const KANKU = [
    "M100 5 C100 5 115 60 100 100 C85 60 100 5 100 5Z",
    "M195 100 C195 100 140 115 100 100 C140 85 195 100 195 100Z",
    "M100 195 C100 195 85 140 100 100 C115 140 100 195 100 195Z",
    "M5 100 C5 100 60 85 100 100 C60 115 5 100 5 100Z",
    "M167 33 C167 33 130 75 100 100 C110 63 167 33 167 33Z",
    "M167 167 C167 167 125 130 100 100 C137 110 167 167 167 167Z",
    "M33 167 C33 167 70 125 100 100 C90 137 33 167 33 167Z",
    "M33 33 C33 33 75 70 100 100 C63 90 33 33 33 33Z",
];

const BELT: Record<string, string> = {
    White: "#ffffff",
    Orange: "#f97316",
    Blue: "#3b82f6",
    Yellow: "#eab308",
    Green: "#22c55e",
    Brown: "#92400e",
    Black: "#161616",
};
const beltColour = (rank: string) => BELT[Object.keys(BELT).find((k) => rank.includes(k)) ?? ""] ?? "#555555";

const CARD_W = 3.4;
const CARD_H = 2.14;
const TEX_W = 1600;
const TEX_H = Math.round((TEX_W * CARD_H) / CARD_W);

function bodyFont() {
    if (typeof document === "undefined") return "sans-serif";
    return getComputedStyle(document.body).fontFamily || "sans-serif";
}

function fit(ctx: CanvasRenderingContext2D, text: string, weight: number, max: number, start: number, family: string) {
    let size = start;
    do {
        ctx.font = `${weight} ${size}px ${family}`;
        if (ctx.measureText(text).width <= max) break;
        size -= 2;
    } while (size > 20);
    return size;
}

/**
 * Draws the card face twice: the colour map, and a matching metal/roughness map
 * (three reads metalness from blue, roughness from green) so the gold foil is
 * genuinely metallic and catches the light while the black stock stays lacquer.
 */
function drawCard(p: CertificateSceneProps, family: string) {
    const make = () => {
        const c = document.createElement("canvas");
        c.width = TEX_W;
        c.height = TEX_H;
        return c;
    };
    const colour = make();
    const metal = make();
    const ctx = colour.getContext("2d")!;
    const mtx = metal.getContext("2d")!;

    // Stock: near-black lacquer with a faint grain.
    ctx.fillStyle = "#0b0b0b";
    ctx.fillRect(0, 0, TEX_W, TEX_H);
    const img = ctx.getImageData(0, 0, TEX_W, TEX_H);
    for (let i = 0; i < img.data.length; i += 4) {
        const n = (Math.random() - 0.5) * 7;
        img.data[i] += n;
        img.data[i + 1] += n;
        img.data[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
    mtx.fillStyle = "rgb(0, 120, 0)"; // non-metal, satin
    mtx.fillRect(0, 0, TEX_W, TEX_H);

    const GOLD = "#e8bd4f";
    const FOIL = "rgb(0, 70, 150)"; // part-metal, glossy: keeps its own gold colour on a dark stage
    const gold = (draw: (g: CanvasRenderingContext2D) => void) => {
        ctx.save();
        ctx.fillStyle = GOLD;
        ctx.strokeStyle = GOLD;
        draw(ctx);
        ctx.restore();
        mtx.save();
        mtx.fillStyle = FOIL;
        mtx.strokeStyle = FOIL;
        draw(mtx);
        mtx.restore();
    };

    // Embossed edge: a fine gold border inset from the card edge.
    gold((g) => {
        g.lineWidth = 4;
        g.strokeRect(36, 36, TEX_W - 72, TEX_H - 72);
    });

    // Gold-foil Kanku, large on the left.
    const k = 640;
    const kx = 90;
    const ky = (TEX_H - k) / 2;
    gold((g) => {
        g.save();
        g.translate(kx, ky);
        g.scale(k / 200, k / 200);
        g.lineWidth = 3;
        g.beginPath();
        g.arc(100, 100, 95, 0, Math.PI * 2);
        g.stroke();
        KANKU.forEach((d, i) => {
            g.globalAlpha = i < 4 ? 1 : 0.55;
            g.fill(new Path2D(d));
        });
        g.restore();
    });
    // The one red mark at the centre.
    ctx.fillStyle = "#b80000";
    ctx.beginPath();
    ctx.arc(kx + k / 2, ky + k / 2, (12 / 200) * k, 0, Math.PI * 2);
    ctx.fill();

    // Text block on the right.
    const left = kx + k + 90;
    const maxW = TEX_W - left - 90;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.font = `700 34px ${family}`;
    ctx.fillText("KYOKUSHIN KARATE FOUNDATION OF INDIA", left, 160, maxW);

    const name = (p.name || "KKFI Member").toUpperCase();
    const nameSize = fit(ctx, name, 900, maxW, 104, family);
    ctx.fillStyle = "#ffffff";
    ctx.font = `900 ${nameSize}px ${family}`;
    ctx.fillText(name, left, 330);

    const number = p.membershipNumber || "KKFI · MEMBERSHIP";
    gold((g) => {
        g.font = `800 ${fit(g, number, 800, maxW, 64, family)}px ${family}`;
        g.fillText(number, left, 440);
    });

    if (p.rank) {
        ctx.fillStyle = beltColour(p.rank);
        ctx.fillRect(left, 520, 96, 30);
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 2;
        ctx.strokeRect(left, 520, 96, 30);
        ctx.fillStyle = "#ffffff";
        ctx.font = `800 46px ${family}`;
        ctx.fillText(p.rank, left + 124, 551, maxW - 124);
    } else {
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.font = `700 42px ${family}`;
        ctx.fillText("Official membership card", left, 551, maxW);
    }

    const foot = [p.role, p.note].filter(Boolean).join("  ·  ") || "Verified against the national register";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = `600 34px ${family}`;
    ctx.fillText(foot, left, TEX_H - 120, maxW);

    const toTex = (c: HTMLCanvasElement, srgb: boolean) => {
        const t = new THREE.CanvasTexture(c);
        if (srgb) t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        return t;
    };
    return { map: toTex(colour, true), metal: toTex(metal, false) };
}

function useCardTextures(p: CertificateSceneProps) {
    const key = [p.name, p.membershipNumber, p.rank, p.role, p.note].map((v) => v ?? "").join("|");
    const [tex, setTex] = useState<{ map: THREE.Texture; metal: THREE.Texture } | null>(null);
    useEffect(() => {
        let alive = true;
        let made: { map: THREE.Texture; metal: THREE.Texture } | null = null;
        const [name, membershipNumber, rank, role, note] = key.split("|");
        const draw = () => {
            if (!alive) return;
            made = drawCard({ name: name || undefined, membershipNumber: membershipNumber || undefined, rank: rank || undefined, role: role || undefined, note: note || undefined }, bodyFont());
            setTex(made);
        };
        if (document.fonts?.ready) document.fonts.ready.then(draw);
        else draw();
        return () => {
            alive = false;
            made?.map.dispose();
            made?.metal.dispose();
        };
    }, [key]);
    return tex;
}

/**
 * The membership card as an object: black lacquer stock, gold-foil Kanku and
 * type that catch a slow light sweep as the card tilts toward the pointer.
 */
export default function CertificateScene(props: CertificateSceneProps) {
    const { compact = false, onReady } = props;
    const tex = useCardTextures(props);
    const card = useRef<THREE.Group>(null);
    const sweep = useRef<THREE.PointLight>(null);
    const clock = useRef(0);
    const reveal = useRef(0);
    const size = useThree((s) => s.size);
    // Phones get the centred framing even when their scene band is wider than tall.
    const portrait = size.width < size.height * 0.9 || size.width < 640;
    const anchor = useMemo<[number, number, number]>(() => (portrait ? [0, 0.05, 0] : compact ? [0, 0, 0] : [1.7, 0, 0]), [portrait, compact]);
    const scale = portrait ? 0.86 : compact ? 0.92 : 0.84;

    useReadySignal(tex ? onReady : undefined);

    useFrame((_, delta) => {
        clock.current += Math.min(delta, 0.1);
        const t = clock.current;
        reveal.current = Math.min(1, reveal.current + delta * 0.7);
        const e = 1 - Math.pow(1 - reveal.current, 3);
        const g = card.current;
        if (g) {
            const k = 1 - Math.exp(-delta * 3);
            const ty = -0.32 + pointer.x * 0.35 + Math.sin(t * 0.35) * 0.08 + (1 - e) * 0.9;
            const tx = 0.12 - pointer.y * 0.22 + Math.sin(t * 0.5) * 0.03;
            g.rotation.y += (ty - g.rotation.y) * k;
            g.rotation.x += (tx - g.rotation.x) * k;
            g.position.y = Math.sin(t * 0.7) * 0.04 - (1 - e) * 0.4;
        }
        // The specular sweep: a light gliding across the face every few seconds.
        if (sweep.current) {
            const s = ((t * 0.22) % 1) * 2 - 1;
            sweep.current.position.set(s * 4.5, 1.6 - s * 0.6, 2.4);
        }
    });

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, portrait ? 8.6 : 7]} fov={30} />
            <InkBackdrop red={0.4} density={0.5} octaves={5} core={portrait ? [0.5, 0.55] : compact ? [0.5, 0.5] : [0.72, 0.5]} />

            <Environment resolution={128} frames={1}>
                <Lightformer form="rect" intensity={3.5} position={[0, 4, 3]} rotation-x={Math.PI / 2} scale={[8, 1.5, 1]} />
                <Lightformer form="rect" intensity={2} position={[-5, 0, 2]} rotation-y={Math.PI / 2} scale={[4, 4, 1]} />
                <Lightformer form="rect" intensity={1.4} position={[5, -1, 2]} rotation-y={-Math.PI / 2} scale={[3, 2, 1]} />
            </Environment>
            <pointLight ref={sweep} position={[-4, 2, 2.4]} intensity={26} distance={8} color="#fff4dc" />
            <directionalLight position={[-2, 3, 5]} intensity={0.9} color="#fff8ea" />
            <ambientLight intensity={0.2} />

            <group position={anchor} scale={scale}>
                <group ref={card}>
                    <RoundedBox args={[CARD_W, CARD_H, 0.05]} radius={0.06} smoothness={6}>
                        <meshPhysicalMaterial color="#0a0a0a" metalness={0.2} roughness={0.35} clearcoat={1} clearcoatRoughness={0.1} />
                    </RoundedBox>
                    {tex && (
                        <mesh position={[0, 0, 0.0265]}>
                            <planeGeometry args={[CARD_W - 0.04, CARD_H - 0.04]} />
                            <meshPhysicalMaterial
                                map={tex.map}
                                metalnessMap={tex.metal}
                                roughnessMap={tex.metal}
                                metalness={1}
                                roughness={1}
                                clearcoat={1}
                                clearcoatRoughness={0.12}
                            />
                        </mesh>
                    )}
                </group>
            </group>
        </>
    );
}
