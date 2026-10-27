"use client";

import { useEffect, useState } from "react";
import { useMotionValueEvent, type MotionValue } from "framer-motion";
import { useReduced } from "@/components/home/film/hooks";

const ROUND = 180;
/** How much of the hero's scroll the opening round takes. */
const ROUND_SPAN = 0.3;

const pad = (n: number) => String(n).padStart(2, "0");

function useTimeLeft(target: string) {
    const [left, setLeft] = useState<number | null>(null);
    useEffect(() => {
        const end = new Date(target).getTime();
        const tick = () => setLeft(Math.max(0, Math.floor((end - Date.now()) / 1000)));
        const first = requestAnimationFrame(tick);
        const id = setInterval(tick, 1000);
        return () => {
            cancelAnimationFrame(first);
            clearInterval(id);
        };
    }, [target]);
    return left;
}

function Segment({ value, label }: { value: string; label: string }) {
    return (
        <span className="flex flex-col items-start">
            <span className="tabular-nums">{value}</span>
            <span className="mt-2 font-gothic text-sm font-semibold tracking-normal text-white/55">{label}</span>
        </span>
    );
}

const Colon = () => <span className="text-white/30">:</span>;

/**
 * The countdown as a kumite round clock (Oddball's shot clock). It opens on a 3:00
 * round that runs down as the reader scrolls into the hero; at 0:00 the round ends and
 * the clock goes live, ticking down to the event itself. The ring is the round, then
 * the running minute. Reduced motion starts live. Screen readers get the plain countdown.
 */
export default function RoundClock({ target, progress }: { target: string; progress: MotionValue<number> }) {
    const reduced = useReduced();
    const [roundLeft, setRoundLeft] = useState(ROUND);
    const [ended, setEnded] = useState(false);
    const live = reduced || ended;

    useMotionValueEvent(progress, "change", (p) => {
        if (ended) return;
        const left = Math.max(0, Math.round(ROUND * (1 - p / ROUND_SPAN)));
        setRoundLeft(left);
        if (left === 0) setEnded(true);
    });

    // Always running, so screen readers have the real countdown before the round ends.
    const secs = useTimeLeft(target);
    const d = secs === null ? 0 : Math.floor(secs / 86400);
    const h = secs === null ? 0 : Math.floor((secs % 86400) / 3600);
    const m = secs === null ? 0 : Math.floor((secs % 3600) / 60);
    const s = secs === null ? 0 : secs % 60;

    // The ring: what is left of the round, then the running minute once live.
    const fill = live ? (secs === null ? 1 : s / 60) : roundLeft / ROUND;
    const C = 2 * Math.PI * 42;

    return (
        <div className="mt-8 flex items-center gap-4 sm:gap-8">
            <svg viewBox="0 0 100 100" aria-hidden="true" className="h-14 w-14 shrink-0 -rotate-90 sm:h-24 sm:w-24">
                <circle cx="50" cy="50" r="42" fill="none" strokeWidth="5" className="stroke-white/10" />
                <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    strokeWidth="5"
                    strokeLinecap="butt"
                    strokeDasharray={C}
                    strokeDashoffset={C * (1 - fill)}
                    className="stroke-primary transition-[stroke-dashoffset] duration-300 ease-linear motion-reduce:transition-none"
                />
            </svg>
            <div>
                <p className="text-sm font-semibold text-white/60">{live ? "Until it begins" : "One kumite round"}</p>
                <p
                    aria-hidden="true"
                    className="mt-1 flex items-start gap-2 font-mincho text-[clamp(2.25rem,7vw,4.75rem)] font-extrabold leading-none tracking-[-0.02em] text-white sm:gap-3"
                >
                    {live ? (
                        <>
                            <Segment value={pad(d)} label="days" />
                            <Colon />
                            <Segment value={pad(h)} label="hours" />
                            <Colon />
                            <Segment value={pad(m)} label="min" />
                            <Colon />
                            <Segment value={pad(s)} label="sec" />
                        </>
                    ) : (
                        <>
                            <Segment value={String(Math.floor(roundLeft / 60))} label="min" />
                            <Colon />
                            <Segment value={pad(roundLeft % 60)} label="sec" />
                        </>
                    )}
                </p>
                {/* Announced once a minute at most, not every tick. */}
                <p role="timer" className="sr-only">
                    {secs !== null && `${d} days, ${h} hours and ${m} minutes until the event.`}
                </p>
            </div>
        </div>
    );
}
