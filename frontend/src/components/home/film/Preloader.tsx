"use client";

import { useEffect, useState } from "react";
import { useReduced } from "./hooks";

const READY = 0.3; // share of the karateka frames needed before the film can open
const GIVE_UP_MS = 9000; // a stalled network shouldn't hold the page hostage

/**
 * Vertical 極真 and a real percentage while the first film loads. Rendered on
 * the server so nothing flashes before it; fades into the hero once 30% of the
 * karateka frames are in. Without JavaScript the noscript style hides it, and
 * under reduced motion it steps aside at once: the films show posters, so
 * there are no frames to wait for.
 */
export default function Preloader({ subscribe }: { subscribe: (fn: (fraction: number) => void) => () => void }) {
    const [pct, setPct] = useState(0);
    const [state, setState] = useState<"loading" | "leaving" | "gone">("loading");
    const reduced = useReduced();

    useEffect(() => {
        if (state !== "loading" || reduced) return;
        const leave = () => setState("leaving");
        const off = subscribe((f) => {
            setPct((prev) => Math.max(prev, Math.min(100, Math.round((f / READY) * 100))));
            if (f >= READY) leave();
        });
        const timer = window.setTimeout(leave, GIVE_UP_MS);
        return () => {
            off();
            window.clearTimeout(timer);
        };
    }, [subscribe, state, reduced]);

    if (state === "gone" || reduced) return null;

    return (
        <div
            id="film-preloader"
            role="progressbar"
            aria-label="Loading the film"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            onTransitionEnd={() => state === "leaving" && setState("gone")}
            className={`fixed inset-0 z-[80] flex items-center justify-center bg-night transition-opacity duration-700 ease-dojo ${state === "leaving" ? "pointer-events-none opacity-0" : "opacity-100"}`}
        >
            <noscript>
                <style>{"#film-preloader{display:none}"}</style>
            </noscript>
            <div className="flex flex-col items-center gap-6">
                <span aria-hidden="true" lang="ja" className="font-mincho text-[clamp(3.052rem,8vw,5rem)] font-extrabold leading-none text-canvas [writing-mode:vertical-rl]">
                    極真
                </span>
                <span className="font-gothic text-[0.8rem] tabular-nums text-ash">{pct}%</span>
            </div>
        </div>
    );
}
