"use client";

import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import SceneSlot from "@/components/three/SceneSlot";
import BrandLink from "@/components/brand/BrandLink";
import api from "@/lib/api";
import { CITY_INDEX, normalizeCity } from "@/lib/cityCoords";
import type { SceneKey } from "@/lib/three/sceneStore";

/*
 * Three paths, one stage. The section pins while the reader scrolls through
 * Learn the Way → Earn the Belt → Find your Dojo; the stage swaps to a live
 * preview of each page's own 3D scene and the copy alongside leads there.
 * It is a real sequence (how someone actually starts), so it is numbered.
 */

const HISTORY_PRINTS = ["/history/kumite-today.jpg", "/history/oyama.jpg", "/history/solitude.jpg", "/history/belt-grip.jpg"];

const BELT_STOPS = [
    { color: "#ffffff", bars: 0 },
    { color: "#f97316", bars: 0 },
    { color: "#3b82f6", bars: 0 },
    { color: "#eab308", bars: 0 },
    { color: "#22c55e", bars: 0 },
    { color: "#92400e", bars: 0 },
    { color: "#161616", bars: 1 },
    { color: "#161616", bars: 3 },
];

interface Path {
    scene: SceneKey;
    title: string;
    body: string;
    href: string;
    cta: string;
    poster: React.ReactNode;
}

interface DojoLite {
    city?: string;
    latitude?: number;
    longitude?: number;
}

/** Cities with dojos, for the map preview. Quietly empty if the list cannot load. */
function useDojoCities() {
    const [cities, setCities] = useState<{ key: string; lat: number; lon: number; count: number }[]>([]);
    useEffect(() => {
        let alive = true;
        api.get("/dojos")
            .then((res) => {
                const dojos: DojoLite[] = res.data?.data?.dojos ?? [];
                const groups = new Map<string, { key: string; lat: number; lon: number; count: number }>();
                for (const d of dojos) {
                    const coords = d.latitude && d.longitude ? ([d.latitude, d.longitude] as [number, number]) : CITY_INDEX[normalizeCity(d.city)];
                    if (!coords) continue;
                    const key = normalizeCity(d.city) || coords.join(",");
                    const g = groups.get(key);
                    if (g) g.count += 1;
                    else groups.set(key, { key, lat: coords[0], lon: coords[1], count: 1 });
                }
                if (alive) setCities([...groups.values()]);
            })
            .catch(() => {
                /* The map still shows India; beams simply do not appear. */
            });
        return () => {
            alive = false;
        };
    }, []);
    return cities;
}

/** A slow, endless 0→1→0 drift, so each preview moves on its own while it is on stage. */
function useDrift(seconds: number, run: boolean) {
    const mv = useMotionValue(0);
    useEffect(() => {
        if (!run) return;
        const controls = animate(mv, [0, 1], { duration: seconds, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" });
        return () => controls.stop();
    }, [mv, seconds, run]);
    return mv;
}

export default function PathsJourney() {
    const ref = useRef<HTMLDivElement>(null);
    const reduce = useReducedMotion();
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
    const [active, setActive] = useState(0);
    const cities = useDojoCities();
    const historyDrift = useDrift(16, active === 0);
    const beltDrift = useDrift(14, active === 1);

    useMotionValueEvent(scrollYProgress, "change", (v) => {
        const i = Math.min(2, Math.floor(v * 3));
        if (i !== active) setActive(i);
    });

    const paths: Path[] = useMemo(
        () => [
            {
                scene: "history",
                title: "Learn the Way",
                body: "Where Kyokushin comes from: Mas Oyama's mountain years, the founding in 1964, and why it is still called the strongest karate.",
                href: "/what-is-kyokushin",
                cta: "Walk the history",
                poster: (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/history/kumite-today.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-60 grayscale" />
                ),
            },
            {
                scene: "belt",
                title: "Earn the Belt",
                body: "Every rank from white belt to the dan grades, what each one asks of you, and how long it usually takes.",
                href: "/belt-system",
                cta: "See the belt path",
                poster: (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-6 w-[60%] -rotate-12 rounded-sm bg-white ring-1 ring-white/20" />
                    </div>
                ),
            },
            {
                scene: "india-map",
                title: "Find your Dojo",
                body: "Official KKFI dojos across India. Choose your city, see who teaches there, and book a first class.",
                href: "/find-a-dojo",
                cta: "Find a dojo",
                poster: (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/geo/india-poster.svg" alt="" className="absolute left-1/2 top-1/2 h-[80%] -translate-x-1/2 -translate-y-1/2 opacity-70" />
                ),
            },
        ],
        [],
    );

    const sceneProps = useMemo(() => {
        if (active === 0) return { progress: historyDrift, images: HISTORY_PRINTS, compact: true };
        if (active === 1) return { progress: beltDrift, stops: BELT_STOPS, compact: true };
        return { cities, focus: null };
    }, [active, historyDrift, beltDrift, cities]);

    const goTo = (i: number) => {
        const el = ref.current;
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY;
        const travel = el.offsetHeight - window.innerHeight;
        window.scrollTo({ top: top + (travel * (i + 0.5)) / 3, behavior: reduce ? "auto" : "smooth" });
    };

    const path = paths[active];

    return (
        <section ref={ref} aria-label="Three ways in" className="relative" style={{ height: "330svh" }}>
            <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden md:flex-row">
                {/* Stage: one live scene at a time, framed like a window into each page. */}
                <div className="relative order-1 h-[46svh] w-full md:order-2 md:h-full md:w-[58%]">
                    <SceneSlot key={path.scene} scene={path.scene} sceneProps={sceneProps} className="absolute inset-0" fallback={<div className="absolute inset-0 bg-black">{path.poster}</div>} />
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,black,transparent_35%)] md:bg-[linear-gradient(to_right,black,transparent_30%)]" />
                </div>

                {/* Copy: the three steps, the current one open. */}
                <div className="relative z-10 order-2 flex flex-1 flex-col justify-center px-4 pb-24 sm:px-6 md:order-1 md:w-[42%] md:pb-0 md:pl-[max(2rem,calc((100vw-1400px)/2+2rem))] md:pr-8">
                    <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-extrabold leading-[1.05] tracking-[-0.02em] text-white">
                        Three ways in<span className="text-primary">.</span>
                    </h2>
                    <ol className="mt-8 space-y-1 md:mt-12">
                        {paths.map((p, i) => {
                            const on = i === active;
                            return (
                                <li key={p.title} className="border-t border-white/10 last:border-b">
                                    <button
                                        type="button"
                                        onClick={() => goTo(i)}
                                        aria-current={on ? "step" : undefined}
                                        className="flex min-h-14 w-full items-baseline gap-5 py-4 text-left"
                                    >
                                        <span className={`text-sm font-bold tabular-nums transition-colors duration-300 ${on ? "text-primary-light" : "text-white/40"}`}>
                                            0{i + 1}
                                        </span>
                                        <span className={`text-[clamp(1.5rem,3vw,2.25rem)] font-black uppercase leading-none tracking-[-0.02em] transition-colors duration-300 ${on ? "text-white" : "text-white/35 hover:text-white/70"}`}>
                                            {p.title}
                                        </span>
                                    </button>
                                    <AnimatePresence initial={false}>
                                        {on && (
                                            <motion.div
                                                key="body"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: reduce ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
                                                className="overflow-hidden"
                                            >
                                                <p className="max-w-[44ch] pb-5 pl-[calc(1.25rem+1.4ch)] text-pretty leading-relaxed text-white/75">{p.body}</p>
                                                <div className="pb-6 pl-[calc(1.25rem+1.4ch)]">
                                                    <BrandLink href={p.href} variant={i === 2 ? "primary" : "outline"}>
                                                        {p.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                    </BrandLink>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            </div>
        </section>
    );
}
