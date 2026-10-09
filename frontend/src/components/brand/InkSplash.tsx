"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { KANKU_CARDINAL, KANKU_DIAGONAL } from "@/components/KankuMark";

/*
 * First-visit intro. A drop of ink lands, a brush paints the Kanku stroke by
 * stroke, 極真 is written beneath it, then the ink opens around the emblem and
 * the emblem settles exactly where the homepage hero keeps it. About two
 * seconds, skippable with any click or key, never shown under reduced motion
 * (the caller decides that).
 *
 * Pure CSS keyframes (see .ink-splash in globals.css): deterministic timing,
 * no JS animation loop competing with hydration, immune to double mounting.
 * Pixel targets are handed to the keyframes as custom properties.
 */

const DURATION_MS = 2400;

/** Where the hero keeps the emblem: matches HeroSectionV2's poster and the 3D scene. */
function heroTarget(w: number, h: number) {
    if (w < 768) return null;
    return { x: w * 0.735, y: h * 0.5, size: h * 0.58 };
}

export default function InkSplash({ onFinish }: { onFinish: () => void }) {
    const [vp, setVp] = useState<{ w: number; h: number } | null>(null);
    const done = useRef(false);

    const finish = useCallback(() => {
        if (done.current) return;
        done.current = true;
        onFinish();
    }, [onFinish]);

    useEffect(() => {
        const id = requestAnimationFrame(() => setVp({ w: window.innerWidth, h: window.innerHeight }));
        const t = window.setTimeout(finish, DURATION_MS);
        const skip = () => finish();
        window.addEventListener("keydown", skip, { once: true });
        return () => {
            cancelAnimationFrame(id);
            window.clearTimeout(t);
            window.removeEventListener("keydown", skip);
        };
    }, [finish]);

    // First frame: plain black, so server and client agree and nothing flashes.
    if (!vp) return <div className="fixed inset-0 z-[200] bg-black" aria-hidden="true" />;
    // Portalled to <body>: inside <main> (z-[1]) it would sit under the navbar.
    return createPortal(<Splash vp={vp} finish={finish} />, document.body);
}

function Splash({ vp, finish }: { vp: { w: number; h: number }; finish: () => void }) {

    const { w, h } = vp;
    const start = Math.min(h * 0.42, w * 0.62);
    const target = heroTarget(w, h);
    const radius = Math.hypot(w, h);
    const cx = target ? target.x : w / 2;
    const cy = target ? target.y : h * 0.42;
    const x0 = w / 2 - start / 2;
    const y0 = h * 0.42 - start / 2;

    const emblemVars = {
        width: start,
        height: start,
        "--x0": `${x0}px`,
        "--y0": `${y0}px`,
        "--x1": `${target ? target.x - start / 2 : x0}px`,
        "--y1": `${target ? target.y - start / 2 : y0}px`,
        "--s1": target ? target.size / start : 1.12,
    } as React.CSSProperties;

    return (
        <div className="ink-splash fixed inset-0 z-[200] cursor-pointer" role="presentation" onClick={finish}>
            <p className="sr-only">Kyokushin Karate Foundation of India</p>

            {/* The ink field, opening around the emblem at the end. */}
            <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
                <defs>
                    <filter id="splash-edge" x="-30%" y="-30%" width="160%" height="160%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="3" seed="7" />
                        <feDisplacementMap in="SourceGraphic" scale="140" />
                    </filter>
                    <mask id="splash-mask">
                        <rect width="100%" height="100%" fill="white" />
                        <circle className="sp-hole" cx={cx} cy={cy} r={radius} fill="black" filter="url(#splash-edge)" />
                    </mask>
                </defs>
                <rect width="100%" height="100%" fill="#000" mask="url(#splash-mask)" />
            </svg>

            {/* The emblem: painted at centre, then carried to the hero's emblem position. */}
            <div aria-hidden="true" className={`sp-emblem absolute left-0 top-0 ${target ? "" : "sp-emblem--fade"}`} style={emblemVars}>
                <svg viewBox="0 0 200 200" className="h-full w-full overflow-visible">
                    <defs>
                        <filter id="brush" x="-5%" y="-5%" width="110%" height="110%">
                            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="2" />
                            <feDisplacementMap in="SourceGraphic" scale="2.4" />
                        </filter>
                    </defs>
                    <circle className="sp-drop" cx="100" cy="100" r="14" fill="#ffffff" filter="url(#brush)" />
                    <g filter="url(#brush)" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round">
                        <circle className="sp-ring" cx="100" cy="100" r="95" fill="none" strokeWidth="3" strokeOpacity="0.7" pathLength={1} />
                        {KANKU_CARDINAL.map((d, i) => (
                            <path
                                key={d}
                                d={d}
                                className="sp-petal"
                                strokeWidth="2.2"
                                fill="#ffffff"
                                pathLength={1}
                                style={{ "--d": `${0.25 + i * 0.09}s`, "--f": `${0.95 + i * 0.05}s`, "--fo": 0.95 } as React.CSSProperties}
                            />
                        ))}
                        {KANKU_DIAGONAL.map((d, i) => (
                            <path
                                key={d}
                                d={d}
                                className="sp-petal"
                                strokeWidth="1.6"
                                fill="#ffffff"
                                pathLength={1}
                                style={{ "--d": `${0.55 + i * 0.07}s`, "--f": `${1.1 + i * 0.04}s`, "--fo": 0.5 } as React.CSSProperties}
                            />
                        ))}
                    </g>
                    {/* The one red mark, set last. */}
                    <circle className="sp-core" cx="100" cy="100" r="12" fill="#c00000" />
                </svg>
            </div>

            {/* 極真, brushed on, then lifting away as the ink opens. */}
            <div aria-hidden="true" className="sp-words absolute inset-x-0 flex flex-col items-center" style={{ top: h * 0.42 + start / 2 + 24 }}>
                <span lang="ja" className="sp-kanji block text-4xl font-black text-white md:text-5xl [filter:url(#splash-brush-text)]">
                    極真
                </span>
                <span className="sp-name mt-3 text-sm font-semibold text-white/60">Kyokushin Karate Foundation of India</span>
            </div>

            <svg aria-hidden="true" className="absolute h-0 w-0">
                <filter id="splash-brush-text" x="-5%" y="-10%" width="110%" height="120%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="5" />
                    <feDisplacementMap in="SourceGraphic" scale="3" />
                </filter>
            </svg>
        </div>
    );
}
