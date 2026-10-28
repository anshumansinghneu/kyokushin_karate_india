"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { useReduced, useScrollProgress } from "@/components/home/film/hooks";

export interface Chapter {
    year: string;
    title: string;
    body: string;
    image: string;
    alt: string;
}

/**
 * A history read like a hanging scroll (House): the page pins, a dan-gold rod
 * unrolls down the years as you scroll, and each year opens its chapter beside
 * a photograph. Reduced motion gets the same chapters as a plain list.
 */
export default function HistoryScroll({ chapters, label }: { chapters: Chapter[]; label: string }) {
    const reduced = useReduced();
    const section = useRef<HTMLElement>(null);
    const rod = useRef<HTMLSpanElement>(null);
    const [active, setActive] = useState(0);
    const n = chapters.length;

    useScrollProgress(
        section,
        (p) => {
            if (rod.current) rod.current.style.transform = `scaleY(${p})`;
            const i = Math.min(n - 1, Math.floor(p * n));
            setActive((prev) => (prev === i ? prev : i));
        },
        { enabled: !reduced },
    );

    if (reduced) {
        return (
            <section aria-label={label} className="bg-night px-4 py-20 sm:px-6 lg:px-8">
                <ol className="mx-auto max-w-[1400px] space-y-16">
                    {chapters.map((c) => (
                        <li key={c.year} className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-14">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
 <img src={c.image} alt={c.alt} loading="lazy" className="aspect-[4/3] w-full object-cover " />
                            <div>
                                <p className="font-mincho text-[2.441rem] font-extrabold leading-none text-ash">{c.year}</p>
                                <h2 className="mt-3 font-mincho text-[1.953rem] font-extrabold text-canvas">{c.title}</h2>
                                <p className="mt-4 max-w-[52ch] font-gothic leading-[1.6] text-ash">{c.body}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </section>
        );
    }

    const c = chapters[active];
    return (
        <section ref={section} aria-label={label} className="relative bg-night" style={{ height: `${n * 70 + 30}vh` }}>
            <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden px-4 sm:px-6 lg:px-8">
                <div className="mx-auto grid w-full max-w-[1400px] items-center gap-8 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] md:gap-14">
                    {/* The rod: every year, unrolled as far as you have read. */}
                    <ol aria-hidden="true" className="relative hidden pl-6 md:block">
                        <span className="absolute bottom-0 left-0 top-0 w-px bg-worn-belt" />
                        <span ref={rod} className="absolute bottom-0 left-0 top-0 w-px origin-top bg-dan-gold" style={{ transform: "scaleY(0)" }} />
                        {chapters.map((ch, i) => (
                            <li key={ch.year} className={`py-2 font-gothic text-sm tabular-nums transition-colors duration-500 ease-dojo ${i === active ? "text-canvas" : i < active ? "text-ash" : "text-worn-belt"}`}>
                                {ch.year}
                            </li>
                        ))}
                    </ol>

                    <div className="order-2 md:order-none">
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={c.year}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.45, ease: [0.2, 0.7, 0.1, 1] }}
                            >
                                <p className="font-mincho text-[clamp(3rem,8vw,6rem)] font-extrabold leading-none text-worn-belt">{c.year}</p>
                                <h2 className="mt-2 font-mincho text-[clamp(1.953rem,3.5vw,3.052rem)] font-extrabold leading-[1.1] text-canvas">{c.title}</h2>
                                <p className="mt-5 max-w-[48ch] font-gothic text-base leading-[1.6] text-ash md:text-[1.125rem]">{c.body}</p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="relative order-1 aspect-[4/3] w-full overflow-hidden bg-worn-belt md:order-none md:aspect-[4/5]">
                        <AnimatePresence initial={false}>
                            <motion.img
                                key={c.image}
                                src={c.image}
                                alt={c.alt}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.6, ease: [0.2, 0.7, 0.1, 1] }}
 className="absolute inset-0 h-full w-full object-cover "
                            />
                        </AnimatePresence>
                    </div>
                </div>
            </div>
            {/* Every chapter, readable without the scroll stage. */}
            <ol className="sr-only">
                {chapters.map((ch) => (
                    <li key={ch.year}>
                        {ch.year}: {ch.title}. {ch.body}
                    </li>
                ))}
            </ol>
        </section>
    );
}
