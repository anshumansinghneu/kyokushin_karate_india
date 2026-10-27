"use client";

import { useRef } from "react";
import { useReduced, useScrollProgress } from "@/components/home/film/hooks";

export interface RunCity {
    key: string;
    label: string;
    count: number;
}

/**
 * The run (Earshot): the page pins and the cities where Kyokushin is taught pass by,
 * one huge name at a time with its dojo count, while the ground runs underfoot faster
 * than the names. Cities and counts are live from the register, never hard-coded.
 * Reduced motion gets the same cities as a plain list.
 */
export default function CityRun({ cities, onChoose }: { cities: RunCity[]; onChoose?: (key: string) => void }) {
    const reduced = useReduced();
    const section = useRef<HTMLElement>(null);
    const track = useRef<HTMLOListElement>(null);
    const ground = useRef<HTMLDivElement>(null);
    const bar = useRef<HTMLSpanElement>(null);
    const n = cities.length;

    useScrollProgress(
        section,
        (p) => {
            const x = p * (n - 1);
            if (track.current) track.current.style.transform = `translate3d(${-x * 100}vw,0,0)`;
            // The ground moves at twice the names' speed: the sense of running past them.
            if (ground.current) ground.current.style.transform = `translate3d(${-((x * 200) % 100)}vw,0,0)`;
            if (bar.current) bar.current.style.transform = `scaleX(${p})`;
        },
        { enabled: !reduced && n > 1 },
    );

    if (n === 0) return null;

    // Tabbing to a city further along the track scrolls the page to where it is in view.
    const bringIntoView = (i: number) => {
        const el = section.current;
        if (!el || reduced || n < 2) return;
        const top = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top + (i / (n - 1)) * (el.offsetHeight - window.innerHeight), behavior: "instant" });
    };

    const name = (c: RunCity, i: number) => (
        <button
            type="button"
            onClick={() => onChoose?.(c.key)}
            onFocus={() => bringIntoView(i)}
            className="group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
            <span className="block font-mincho text-[clamp(3.5rem,13vw,12rem)] font-extrabold leading-[0.9] tracking-[-0.035em] text-white transition-colors group-hover:text-primary-light">
                {c.label}
            </span>
            <span className="mt-5 block text-lg font-semibold text-white/60">
                <span className="tabular-nums text-white">{c.count}</span> {c.count === 1 ? "dojo" : "dojos"}
                <span className="mt-1 block text-sm text-white/40 transition-colors group-hover:text-white/70 sm:ml-3 sm:mt-0 sm:inline">Show on the map →</span>
            </span>
        </button>
    );

    if (reduced || n === 1) {
        return (
            <section aria-label="Cities with a KKFI dojo" className="bg-black px-4 py-20 sm:px-6 lg:px-8">
                <ol className="mx-auto max-w-[1400px] space-y-14">
                    {cities.map((c, i) => (
                        <li key={c.key}>{name(c, i)}</li>
                    ))}
                </ol>
            </section>
        );
    }

    return (
        <section ref={section} aria-label="Cities with a KKFI dojo" className="relative bg-black" style={{ height: `${n * 55 + 100}vh` }}>
            <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
                <ol ref={track} className="flex will-change-transform" style={{ width: `${n * 100}vw` }}>
                    {cities.map((c, i) => (
                        <li key={c.key} className="w-screen shrink-0 px-4 sm:px-6 lg:px-8">
                            <div className="mx-auto max-w-[1400px]">
                                <p className="mb-6 text-sm font-semibold tabular-nums text-white/40">
                                    {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
                                </p>
                                {name(c, i)}
                            </div>
                        </li>
                    ))}
                </ol>

                {/* The ground underfoot: a dashed lane line running past. */}
                <div aria-hidden="true" className="absolute inset-x-0 bottom-[14vh] overflow-hidden">
                    <div
                        ref={ground}
                        className="h-px w-[200vw] will-change-transform"
                        style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.35) 0 3vw, transparent 3vw 6vw)" }}
                    />
                </div>
                <div aria-hidden="true" className="absolute inset-x-4 bottom-10 h-px bg-white/10 sm:inset-x-6 lg:inset-x-8">
                    <span ref={bar} className="block h-full origin-left bg-primary" style={{ transform: "scaleX(0)" }} />
                </div>
            </div>
        </section>
    );
}
