"use client";

import { useEffect, useRef } from "react";
import { useFilm, useFilmFrame } from "./FilmContext";
import { interp, toScreen, windowAlpha } from "./geometry";
import type { Callout } from "./films";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Hairline callouts pinned to the body (KKFI_REDESIGN.md, 4.5): a dan-gold
 * anchor, a 1px line with one elbow, and a label with the kanji set vertically.
 * They draw in and out with scroll progress, never with timers, and flip sides
 * when the label would leave the viewport.
 */
export default function Callouts({
    callouts,
    reducedSkip = [],
}: {
    callouts: Callout[];
    /** Callouts left off the static (reduced-motion) poster, where they would collide with copy. Still in the screen-reader list. */
    reducedSkip?: string[];
}) {
    const { reduced } = useFilm();
    const anchors = useRef<(HTMLSpanElement | null)[]>([]);
    const paths = useRef<(SVGPathElement | null)[]>([]);
    const labels = useRef<(HTMLDivElement | null)[]>([]);
    // Label sizes, measured off the frame loop so drawing never forces layout.
    const sizes = useRef<{ w: number; h: number }[]>([]);

    useEffect(() => {
        const ro = new ResizeObserver(() => {
            labels.current.forEach((el, i) => {
                if (el) sizes.current[i] = { w: el.offsetWidth, h: el.offsetHeight };
            });
        });
        labels.current.forEach((el) => el && ro.observe(el));
        return () => ro.disconnect();
    }, [callouts]);

    useFilmFrame(({ p, layout, width, height }) => {
        const narrow = width < 640;
        const run = narrow ? 20 : 36; // diagonal leg
        const reach = narrow ? 24 : 64; // horizontal leg

        callouts.forEach((c, i) => {
            const anchor = anchors.current[i];
            const path = paths.current[i];
            const label = labels.current[i];
            if (!anchor || !path || !label) return;

            const a = reduced ? (reducedSkip.includes(c.id) ? 0 : 1) : windowAlpha(p, c.show, 0.04);
            const visible = a > 0 ? "visible" : "hidden";
            anchor.style.visibility = visible;
            path.style.visibility = visible;
            label.style.visibility = visible;
            if (a <= 0) return;

            // Under reduced motion the poster frame is shown, so pin to the track's start.
            const at = reduced ? c.track[0].p : p;
            const pt = toScreen(layout, interp(c.track, at, (k) => k.x), interp(c.track, at, (k) => k.y));
            const { w: lw = 0, h: lh = 0 } = sizes.current[i] ?? {};

            const fits = (side: "left" | "right") =>
                side === "right" ? pt.x + run + reach + 8 + lw <= width - 12 : pt.x - run - reach - 8 - lw >= 12;
            let side = c.side;
            if (!fits(side)) {
                const other = side === "right" ? "left" : "right";
                if (fits(other)) side = other;
            }
            const dirX = side === "right" ? 1 : -1;
            const ex = pt.x + dirX * run;
            const ey = pt.y - run - (c.rise ?? 0) * layout.s;
            const hx = ex + dirX * reach;

            // One shared parameter: anchor first, then the line draws, then the label.
            const lineT = clamp(a / 0.6, 0, 1);
            const labelT = clamp((a - 0.5) / 0.5, 0, 1);

            anchor.style.transform = `translate3d(${pt.x}px, ${pt.y}px, 0)`;
            anchor.style.opacity = String(clamp(a / 0.2, 0, 1));
            path.setAttribute("d", `M${pt.x} ${pt.y}L${ex} ${ey}L${hx} ${ey}`);
            path.style.strokeDashoffset = String(1 - lineT);

            const lx = clamp(side === "right" ? hx + 8 : hx - 8 - lw, 12, Math.max(12, width - 12 - lw));
            const ly = clamp(ey - 12, 80, Math.max(80, height - lh - 16));
            label.style.transform = `translate3d(${lx}px, ${ly}px, 0)`;
            label.style.opacity = String(labelT);
        });
    });

    return (
        <>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
                <svg className="absolute inset-0 h-full w-full overflow-visible">
                    {callouts.map((c, i) => (
                        <path
                            key={c.id}
                            ref={(el) => {
                                paths.current[i] = el;
                            }}
                            pathLength={1}
                            strokeDasharray="1"
                            strokeDashoffset="1"
                            fill="none"
                            className="invisible stroke-dan-gold"
                            strokeWidth={1}
                        />
                    ))}
                </svg>
                {callouts.map((c, i) => (
                    <span
                        key={c.id}
                        ref={(el) => {
                            anchors.current[i] = el;
                        }}
                        className="invisible absolute -left-[3px] -top-[3px] h-1.5 w-1.5 rounded-full bg-dan-gold"
                    />
                ))}
                {callouts.map((c, i) => (
                    <div
                        key={c.id}
                        ref={(el) => {
                            labels.current[i] = el;
                        }}
                        className="invisible absolute left-0 top-0 flex gap-3 [text-shadow:0_0_2px_rgba(0,0,0,0.95),0_0_10px_rgba(0,0,0,0.9),0_0_24px_rgba(0,0,0,0.7)]"
                    >
                        <span lang="ja" className="font-mincho text-xl font-medium leading-none text-canvas [writing-mode:vertical-rl]">
                            {c.kanji}
                        </span>
                        <span className="block max-w-[28ch] font-gothic">
                            <span className="block font-bold text-canvas">{c.name}</span>
                            <span className="mt-1 block text-sm leading-snug text-ash">{c.text}</span>
                        </span>
                    </div>
                ))}
            </div>
            <ul className="sr-only">
                {callouts.map((c) => (
                    <li key={c.id}>
                        {c.name} (<span lang="ja">{c.kanji}</span>): {c.text}
                    </li>
                ))}
            </ul>
        </>
    );
}
