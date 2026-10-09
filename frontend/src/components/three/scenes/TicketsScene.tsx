"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";
import InkBackdrop from "../materials/InkBackdrop";
import { pointer } from "../pointer";
import { useLoadedTexture, useReadySignal } from "./sceneUtils";

export interface Ticket {
    id: string;
    title: string;
    /** e.g. "Seminar" */
    type: string;
    /** e.g. "3–5 May 2026" */
    dates: string;
    day: number;
    month: string;
    year: number;
    location: string;
    status: "UPCOMING" | "ONGOING" | "COMPLETED";
}

interface TicketsSceneProps {
    tickets: Ticket[];
    /** 0 at the top of the hero, 1 once it has scrolled away: the stack fans open. */
    progress?: MotionValue<number>;
    /** One event, not a stack: the first ticket alone, turning slowly (event detail pages). */
    single?: boolean;
    /** An image carried in the ink behind the ticket (e.g. the event poster). Must be CORS-readable. */
    backdropImage?: string;
    /** Centre the stack in its slot (used when the slot is a band above the copy on phones). */
    centered?: boolean;
    onReady?: () => void;
}

const W = 2.3;
const H = 1.0;
const STUB = 0.62; // width of the tear-off stub on the right
const DEPTH = 0.018;
const TEX_W = 1150;
const TEX_H = 500;

/** A ticket outline with two half-moon notches where the stub tears off. */
function ticketShape() {
    const s = new THREE.Shape();
    const r = 0.07;
    const x0 = -W / 2;
    const x1 = W / 2;
    const y0 = -H / 2;
    const y1 = H / 2;
    const notchX = x1 - STUB;
    const c = 0.06; // corner radius
    s.moveTo(x0 + c, y0);
    s.lineTo(notchX - r, y0);
    s.absarc(notchX, y0, r, Math.PI, 0, true);
    s.lineTo(x1 - c, y0);
    s.quadraticCurveTo(x1, y0, x1, y0 + c);
    s.lineTo(x1, y1 - c);
    s.quadraticCurveTo(x1, y1, x1 - c, y1);
    s.lineTo(notchX + r, y1);
    s.absarc(notchX, y1, r, 0, Math.PI, true);
    s.lineTo(x0 + c, y1);
    s.quadraticCurveTo(x0, y1, x0, y1 - c);
    s.lineTo(x0, y0 + c);
    s.quadraticCurveTo(x0, y0, x0 + c, y0);
    return s;
}

function fontFamily() {
    return getComputedStyle(document.body).fontFamily || "sans-serif";
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, weight: number, size: number, family: string) {
    let s = size;
    ctx.font = `${weight} ${s}px ${family}`;
    while (ctx.measureText(text).width > maxWidth && s > 18) {
        s -= 2;
        ctx.font = `${weight} ${s}px ${family}`;
    }
    return s;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = w;
            if (lines.length === maxLines) break;
        } else line = test;
    }
    if (lines.length < maxLines && line) lines.push(line);
    if (lines.length === maxLines && words.join(" ") !== lines.join(" ")) {
        let last = lines[maxLines - 1];
        while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 1) last = last.slice(0, -1);
        lines[maxLines - 1] = `${last.trimEnd()}…`;
    }
    return lines;
}

/** Prints the ticket face: black lacquer stock, white type, red only for what is still to come. */
function printTicket(t: Ticket, family: string) {
    const c = document.createElement("canvas");
    c.width = TEX_W;
    c.height = TEX_H;
    const ctx = c.getContext("2d")!;
    const past = t.status === "COMPLETED";
    const ink = past ? "rgba(255,255,255,0.55)" : "#ffffff";
    const stubX = TEX_W * (1 - STUB / W);

    // Stock.
    ctx.fillStyle = "#0c0c0c";
    ctx.fillRect(0, 0, TEX_W, TEX_H);
    // Paper grain.
    const img = ctx.getImageData(0, 0, TEX_W, TEX_H);
    for (let i = 0; i < img.data.length; i += 4) {
        const g = (Math.random() - 0.5) * 10;
        img.data[i] += g;
        img.data[i + 1] += g;
        img.data[i + 2] += g;
    }
    ctx.putImageData(img, 0, 0);

    // Hairline frame.
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, TEX_W - 48, TEX_H - 48);

    // Perforation.
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.moveTo(stubX, 40);
    ctx.lineTo(stubX, TEX_H - 40);
    ctx.stroke();
    ctx.setLineDash([]);

    // Main face.
    const left = 64;
    const mainW = stubX - left - 48;
    ctx.fillStyle = past ? "rgba(255,255,255,0.5)" : "#ff4d4d";
    ctx.font = `700 26px ${family}`;
    ctx.fillText(`${t.type.toUpperCase()}  ·  ${past ? "COMPLETED" : t.status === "ONGOING" ? "IN PROGRESS" : t.day ? "ADMIT ONE" : "TO BE ANNOUNCED"}`, left, 92);

    ctx.fillStyle = ink;
    ctx.font = `900 50px ${family}`;
    const lines = wrap(ctx, t.title.toUpperCase(), mainW, 4);
    lines.forEach((l, i) => ctx.fillText(l, left, 160 + i * 54));

    ctx.fillStyle = past ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.75)";
    const locSize = fitText(ctx, t.location, mainW, 600, 28, family);
    ctx.font = `600 ${locSize}px ${family}`;
    ctx.fillText(t.location, left, TEX_H - 70);

    // Stub: the date, big.
    const cx = stubX + (TEX_W - stubX) / 2;
    ctx.textAlign = "center";
    ctx.fillStyle = past ? "rgba(255,255,255,0.5)" : "#ffffff";
    if (t.day) {
        ctx.font = `700 30px ${family}`;
        ctx.fillText(t.month, cx, 150);
        ctx.font = `900 150px ${family}`;
        ctx.fillText(String(t.day), cx, 300);
        ctx.font = `700 30px ${family}`;
        ctx.fillText(String(t.year), cx, 352);
    } else {
        // Undated: an empty date box waiting to be filled in.
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.setLineDash([8, 8]);
        ctx.lineWidth = 3;
        ctx.strokeRect(cx - 90, 130, 180, 200);
        ctx.setLineDash([]);
        ctx.font = `800 40px ${family}`;
        ctx.fillText("TBA", cx, 245);
    }
    ctx.font = `600 22px ${family}`;
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText("KKFI", cx, TEX_H - 70);
    ctx.textAlign = "left";

    // Completed: a rubber stamp across the face.
    if (past) {
        ctx.save();
        ctx.translate(stubX - 210, TEX_H - 96);
        ctx.rotate(-0.12);
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 4;
        ctx.strokeRect(-150, -36, 300, 72);
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = `900 40px ${family}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("COMPLETED", 0, 4);
        ctx.restore();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    // ExtrudeGeometry caps use shape coordinates as UVs: map [-W/2, W/2] x [-H/2, H/2] onto 0..1.
    tex.repeat.set(1 / W, 1 / H);
    tex.offset.set(0.5, 0.5);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
}

/** An event with nothing printed yet: the next dates are being set. */
const BLANK: Ticket = {
    id: "blank",
    title: "Next dates being set",
    type: "KKFI",
    dates: "",
    day: 0,
    month: "",
    year: 0,
    location: "Camps · Seminars · Gradings",
    status: "UPCOMING",
};

function useTicketTextures(tickets: Ticket[]) {
    const [textures, setTextures] = useState<THREE.CanvasTexture[]>([]);
    useEffect(() => {
        let alive = true;
        let made: THREE.CanvasTexture[] = [];
        // Wait for the web font so the print is in Montserrat, not a fallback.
        document.fonts.ready.then(() => {
            if (!alive) return;
            const family = fontFamily();
            made = tickets.map((t) => printTicket(t, family));
            setTextures(made);
        });
        return () => {
            alive = false;
            made.forEach((t) => t.dispose());
        };
    }, [tickets]);
    return textures;
}

/**
 * The calendar as a stack of tickets. They drop in one by one, sit squared
 * up, and fan open as the visitor scrolls past the hero. Past events print
 * dimmer and carry a COMPLETED stamp; only what is still to come uses red.
 */
export default function TicketsScene({ tickets, progress, single = false, backdropImage, centered = false, onReady }: TicketsSceneProps) {
    // With nothing upcoming, an undated ticket sits on top of the stack: the next one is coming.
    // A single event shows its own ticket, whatever its status.
    const list = useMemo(() => {
        if (single) return tickets.slice(0, 1);
        const upcoming = tickets.some((t) => t.status !== "COMPLETED");
        return (upcoming ? tickets : [BLANK, ...tickets]).slice(0, 6);
    }, [tickets, single]);
    const backdrop = useLoadedTexture(backdropImage);
    const shape = useMemo(() => ticketShape(), []);
    const geometry = useMemo(
        () =>
            new THREE.ExtrudeGeometry(shape, {
                depth: DEPTH,
                bevelEnabled: true,
                bevelThickness: 0.004,
                bevelSize: 0.004,
                bevelSegments: 2,
                curveSegments: 16,
            }),
        [shape],
    );
    const textures = useTicketTextures(list);
    const groups = useRef<(THREE.Group | null)[]>([]);
    const stage = useRef<THREE.Group>(null);
    const clock = useRef(0);
    const fan = useRef(0);
    const size = useThree((s) => s.size);
    const portrait = size.width < size.height * 0.9;

    useEffect(() => () => geometry.dispose(), [geometry]);

    useReadySignal(textures.length ? onReady : undefined);

    useFrame((_, delta) => {
        clock.current += Math.min(delta, 0.1);
        const t = clock.current;
        const p = progress ? THREE.MathUtils.clamp(progress.get(), 0, 1) : 0;
        // Partly open at rest so the stack reads as several tickets, fully open as you scroll.
        const target = 0.5 + p * 0.5;
        fan.current += (target - fan.current) * (1 - Math.exp(-delta * 4));
        const f = fan.current;

        if (single) {
            const g = groups.current[0];
            if (g) {
                // Drops in once, then turns slowly on its own axis, never quite showing its back.
                const local = THREE.MathUtils.clamp(t / 1.2, 0, 1);
                const land = 1 - Math.pow(1 - local, 4);
                g.position.set(0, (1 - land) * 2.2, 0);
                // Cancel the stage's resting yaw so the ticket sways around facing the viewer,
                // never far enough for the lacquer to mirror a softbox and wash out the print.
                g.rotation.set(-0.06 + (1 - land) * 0.6 + Math.sin(t * 0.5) * 0.04, 0.32 + Math.sin(t * 0.32) * 0.3 * land, (1 - land) * 0.4 + Math.sin(t * 0.27) * 0.03);
                g.visible = local > 0;
            }
        }

        if (!single) groups.current.forEach((g, i) => {
            if (!g) return;
            // Staggered drop-in.
            const local = THREE.MathUtils.clamp((t - 0.15 * i) / 1.1, 0, 1);
            const land = 1 - Math.pow(1 - local, 4);
            // Front ticket stays centred; the ones behind alternate out to either side.
            const k = i === 0 ? 0 : (i % 2 ? -1 : 1) * Math.ceil(i / 2);
            // Fan around a pivot below the stack, like cards spread in a hand.
            const angle = k * 0.2 * f;
            const pivot = 3.4;
            const x = Math.sin(angle) * pivot + k * 0.18 * f;
            const y = Math.cos(angle) * pivot - pivot + (1 - land) * 2.2;
            g.position.set(x, y, -i * 0.05 + k * 0.02 * f);
            g.rotation.set(-0.08 + (1 - land) * 0.6, 0.18 * f * Math.sign(k) * 0.4, -angle + (1 - land) * 0.4 * (i % 2 ? 1 : -1));
            g.visible = local > 0;
        });

        const s = stage.current;
        if (s) {
            const k = 1 - Math.exp(-delta * 2.5);
            s.rotation.x += (pointer.y * 0.12 + Math.sin(t * 0.4) * 0.02 - s.rotation.x) * k;
            s.rotation.y += (-0.32 + pointer.x * 0.25 - s.rotation.y) * k;
            s.position.y = Math.sin(t * 0.7) * 0.04;
        }
    });

    return (
        <>
            <PerspectiveCamera makeDefault position={portrait ? [0, 0, 7.4] : [0, 0, 6]} fov={34} />
            <InkBackdrop red={0} density={0.4} octaves={5} texture={backdrop} />
            <Environment resolution={128} frames={1}>
                <Lightformer form="rect" intensity={3} position={[0, 4, 4]} rotation-x={Math.PI / 3} scale={[8, 2, 1]} />
                <Lightformer form="rect" intensity={1.5} position={[-5, 0, 2]} rotation-y={Math.PI / 2} scale={[4, 4, 1]} />
            </Environment>
            <directionalLight position={[2, 3, 5]} intensity={1.4} />
            <ambientLight intensity={0.4} />

            <group ref={stage} position={centered ? [0, 0.05, 0] : portrait ? [0, 1.25, 0] : [single ? 1.75 : 1.1, single ? 0.15 : 0.05, 0]} scale={centered ? 0.95 : portrait ? (single ? 0.9 : 1) : single ? 0.85 : 1.05}>
                {list.map((ticket, i) => (
                    <group
                        key={ticket.id}
                        ref={(g) => {
                            groups.current[i] = g;
                        }}
                        visible={false}
                    >
                        <mesh geometry={geometry}>
                            <meshPhysicalMaterial
                                map={textures[i] ?? null}
                                color={textures[i] ? "#ffffff" : "#0c0c0c"}
                                roughness={0.38}
                                clearcoat={0.7}
                                clearcoatRoughness={0.25}
                                side={THREE.DoubleSide}
                            />
                        </mesh>
                    </group>
                ))}
            </group>
        </>
    );
}
