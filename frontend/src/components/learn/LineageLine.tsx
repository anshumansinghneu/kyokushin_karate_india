"use client";

import Image, { type StaticImageData } from "next/image";
import { useRef, useState } from "react";
import { useReduced, useScrollProgress } from "@/components/home/film/hooks";

export interface Generation {
    years: string;
    name: string;
    role: string;
    body: string;
    image: string | StaticImageData;
}

/**
 * The line of authority as one dan-gold line down the page (House): it draws as you
 * read, and each generation lights as the line reaches it. Reduced motion gets the line drawn.
 */
export default function LineageLine({ generations }: { generations: Generation[] }) {
    const reduced = useReduced();
    const list = useRef<HTMLOListElement>(null);
    const line = useRef<HTMLSpanElement>(null);
    const [reached, setReached] = useState(0);
    const n = generations.length;

    useScrollProgress(
        list,
        (p) => {
            if (line.current) line.current.style.transform = `scaleY(${p})`;
            const i = Math.min(n, Math.floor(p * (n - 1) + 1.0001));
            setReached((prev) => (prev === i ? prev : i));
        },
        { start: "top 65%", end: "bottom 65%", enabled: !reduced },
    );

    return (
        <ol ref={list} className="relative mt-14 space-y-20 md:space-y-28">
            {/* The line runs from the first node to the last. */}
            <span aria-hidden="true" className="absolute bottom-3 left-[7px] top-3 w-px bg-white/10 md:left-[11px]" />
            <span
                ref={line}
                aria-hidden="true"
                className="absolute bottom-3 left-[7px] top-3 w-px origin-top bg-secondary md:left-[11px]"
                style={{ transform: reduced ? undefined : "scaleY(0)" }}
            />
            {generations.map((g, i) => {
                const lit = reduced || i < reached;
                return (
                    <li key={g.name} className="relative grid gap-6 pl-10 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-12 md:pl-16">
                        <span
                            aria-hidden="true"
                            className={`absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border transition-colors duration-500 md:h-[23px] md:w-[23px] ${lit ? "border-secondary bg-secondary" : "border-white/30 bg-black"}`}
                        />
                        <div className="relative aspect-[4/5] w-40 overflow-hidden rounded-xl bg-surface md:w-full">
                            <Image
                                src={g.image}
                                alt={`${g.name}, ${g.role}`}
                                fill
                                sizes="(max-width: 768px) 10rem, 14rem"
                                placeholder={typeof g.image === "string" ? "empty" : "blur"}
                                className={`object-cover object-top grayscale transition-opacity duration-700 ${lit ? "opacity-100" : "opacity-40"}`}
                            />
                        </div>
                        <div className="md:pt-1">
                            <p className="flex items-baseline gap-3 text-sm font-semibold">
                                <span className="font-bold tabular-nums text-primary-light">0{i + 1}</span>
                                <span className="text-secondary">{g.years}</span>
                            </p>
                            <h3 className="mt-2 font-mincho text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold leading-tight text-white">{g.name}</h3>
                            <p className="mt-1 text-sm text-white/65">{g.role}</p>
                            <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-white/75">{g.body}</p>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
