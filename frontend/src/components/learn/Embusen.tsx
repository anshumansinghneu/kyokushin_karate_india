"use client";

import { useRef } from "react";
import { useReduced, useScrollProgress } from "@/components/home/film/hooks";

/**
 * A kata's floor pattern (embusen) drawn in chalk-gold as it reaches the reader (Oddball's
 * whiteboard). Points are in kata steps, y pointing toward the front of the dojo. Reduced
 * motion and print get the finished drawing.
 */
export default function Embusen({ points, label }: { points: [number, number][]; label: string }) {
    const reduced = useReduced();
    const box = useRef<HTMLSpanElement>(null);
    const path = useRef<SVGPathElement>(null);

    useScrollProgress(
        box,
        (p) => path.current?.style.setProperty("--draw", String(1 - p)),
        { start: "top 85%", end: "top 45%", enabled: !reduced },
    );

    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => y);
    const pad = 0.5;
    const minX = Math.min(...xs) - pad;
    const minY = Math.min(...ys) - pad;
    const w = Math.max(...xs) - minX + pad;
    const h = Math.max(...ys) - minY + pad;
    const d = points.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
    const [sx, sy] = points[0];

    return (
        <span ref={box} className="inline-block">
            <svg viewBox={`${minX} ${minY} ${w} ${h}`} role="img" aria-label={label} className="h-16 w-16 overflow-visible">
                <path
                    ref={path}
                    d={d}
                    pathLength={1}
                    fill="none"
                    strokeWidth={0.12}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`stroke-secondary [stroke-dasharray:1] print:stroke-black print:[stroke-dashoffset:0] ${reduced ? "" : "[stroke-dashoffset:var(--draw,0)]"}`}
                />
                {/* Where the kata starts and ends. */}
                <circle cx={sx} cy={sy} r={0.16} className="fill-secondary print:fill-black" />
            </svg>
        </span>
    );
}
