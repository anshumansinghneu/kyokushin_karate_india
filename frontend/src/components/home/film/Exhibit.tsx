"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { mediaUrl } from "@/lib/media";
import FilmLink from "./FilmLink";
import { useReduced, useScrollProgress } from "./hooks";
import { loadDojos, type PublicDojo } from "./dojos";
import { focusRing } from "./ui";

/*
 * The exhibit (docs/superpowers/specs/2026-10-19-full-site-redesign-design.md, Home): Sosai
 * Masutatsu Oyama on a black stage, like a portrait in a gallery, and one pinned scroll in four acts.
 *   I    0.00–0.20  極真 rises behind him; the hero copy.
 *   II   0.20–0.50  the founder: leader lines draw from his portrait to sourced facts about him.
 *   III  0.50–0.78  the four weapons burst from behind him and lock in either side.
 *   IV   0.78–1.00  he steps aside and the first step opens: start at white belt.
 * The knockdown rules live in the kumite film chapter, not on the founder.
 * Phones and reduced motion get the same content as a plain stacked page.
 */

// The portrait of Sosai. Swap in a licensed archival photograph at this path (same framing) when KKFI has one.
const PORTRAIT = "/history/oyama.jpg";
const PORTRAIT_ALT = "Sosai Masutatsu Oyama, founder of Kyokushin, in his gi";
const SRC = { w: 1024, h: 1024 };
const STAGE_VH = 520;

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const range = (v: number, a: number, b: number) => clamp((v - a) / (b - a));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/** Sourced facts about the founder, pinned to his portrait (source px on the portrait). */
const RULES = [
    { id: "sosai", kanji: "総裁", name: "Sosai, 1923–1994", text: "Masutatsu Oyama, the founder. Sosai, president, is the title Kyokushin gives him.", side: "right" as const, x: 520, y: 150 },
    { id: "eyes", kanji: "目", name: "Head low, eyes high", text: "His motto: keep your head low and your eyes high.", side: "left" as const, x: 470, y: 268 },
    { id: "kanji", kanji: "極真", name: "The ultimate truth", text: "Kyokushin, the name he gave his karate.", side: "right" as const, x: 693, y: 757 },
    { id: "1964", kanji: "会館", name: "Kyokushinkaikan, 1964", text: "He founded the International Karate Organization Kyokushinkaikan in Tokyo.", side: "left" as const, x: 470, y: 720 },
];

/** The four weapons, and where each locks in around him (fractions of the stage, from its centre). */
const WEAPONS = [
    { id: "eyes", kanji: "目", name: "Me", text: "The eyes. Head low, eyes high.", src: "stills/weapon-eyes.jpg", alt: "Close-up of a karateka's eyes under a lowered brow", at: [-0.31, -0.2] },
    { id: "fist", kanji: "正拳", name: "Seiken", text: "The fist. The first two knuckles, bare.", src: "stills/weapon-fist.jpg", alt: "A karate fist striking toward the camera", at: [0.31, -0.2] },
    { id: "shin", kanji: "脛", name: "Sune", text: "The shin. Conditioned to kick and to block.", src: "stills/weapon-shin.jpg", alt: "A shin meeting a raised forearm in a kumite exchange", at: [-0.31, 0.22] },
    { id: "obi", kanji: "帯", name: "Obi", text: "The belt. Earned one grading at a time.", src: "stills/weapon-knot.jpg", alt: "The square knot of a worn black belt", at: [0.31, 0.22] },
] as const;

const DESKTOP = "(min-width: 768px)";
const subscribeWide = (fn: () => void) => {
    const mq = window.matchMedia(DESKTOP);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
};

function useCities() {
    const [dojos, setDojos] = useState<PublicDojo[]>([]);
    useEffect(() => {
        loadDojos().then(setDojos).catch(() => setDojos([]));
    }, []);
    return useMemo(() => {
        const byCity = new Map<string, PublicDojo[]>();
        for (const d of dojos) {
            const city = d.city?.trim();
            if (!city) continue;
            byCity.set(city, [...(byCity.get(city) ?? []), d]);
        }
        return [...byCity.entries()].sort((a, b) => b[1].length - a[1].length);
    }, [dojos]);
}

/** Act IV: choose a city, see its KKFI dojos. Same block in the static layout. */
function FirstStep() {
    const cities = useCities();
    const [city, setCity] = useState("");
    const chosen = cities.find(([c]) => c === city)?.[1] ?? [];
    return (
        <div className="max-w-[30rem]">
            <h2 className="font-mincho text-[clamp(2rem,4vw,3.052rem)] font-extrabold leading-[1.05] tracking-[-0.01em] text-canvas">Start at white belt.</h2>
            <p className="mt-5 font-gothic text-base leading-[1.6] text-ash">
                Every Kyokushin karateka began here. Choose your city to see the KKFI dojos there.
            </p>
            <label className="mt-8 block">
                <span className="font-gothic text-[0.8rem] text-ash">Your city</span>
                <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={`mt-2 block w-full appearance-none rounded-none border-b border-worn-belt bg-night py-3 font-gothic text-canvas ${focusRing}`}
                >
                    <option value="">{cities.length ? "Choose a city" : "Loading cities"}</option>
                    {cities.map(([c, list]) => (
                        <option key={c} value={c}>
                            {c}, {list.length} {list.length === 1 ? "dojo" : "dojos"}
                        </option>
                    ))}
                </select>
            </label>
            {chosen.length > 0 && (
                <ul className="mt-6 border-t border-worn-belt">
                    {chosen.slice(0, 4).map((d) => (
                        <li key={d.id} className="border-b border-worn-belt">
                            <Link href={`/dojos/${d.id}`} className={`block py-3 font-gothic text-canvas underline decoration-transparent underline-offset-[6px] transition-colors duration-500 ease-dojo hover:decoration-dan-gold ${focusRing}`}>
                                {d.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-8">
                <FilmLink href="/register">Join KKFI</FilmLink>
                <FilmLink href="/find-a-dojo" variant="quiet">Every dojo on the map</FilmLink>
            </div>
        </div>
    );
}

function HeroCopy() {
    return (
        <>
            <h1 className="max-w-[12ch] font-mincho text-[clamp(3rem,8vw,7.5rem)] font-extrabold leading-[0.95] tracking-[-0.02em] text-canvas">Forge your spirit.</h1>
            <p className="mt-6 max-w-[40ch] font-gothic text-base leading-[1.6] text-canvas md:text-[1.25rem]">
                Full-contact karate in the lineage of Sosai Mas Oyama. Discipline, respect, and the relentless pursuit of strength, taught in dojos across India.
            </p>
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-8">
                <FilmLink href="/register">Join the dojo</FilmLink>
                <FilmLink href="/find-a-dojo" variant="quiet">Find a dojo near you</FilmLink>
            </div>
        </>
    );
}

function RuleLabel({ rule, i }: { rule: (typeof RULES)[number]; i: number }) {
    return (
        <div className="flex gap-3">
            <span className="font-gothic text-[0.8rem] tabular-nums text-dan-gold">0{i + 1}</span>
            <span lang="ja" aria-hidden="true" className="font-mincho text-lg leading-none text-canvas [writing-mode:vertical-rl]">{rule.kanji}</span>
            <span className="block max-w-[24ch] font-gothic">
                <span className="block font-bold text-canvas">{rule.name}</span>
                <span className="mt-1 block text-sm leading-snug text-ash">{rule.text}</span>
            </span>
        </div>
    );
}

/** Phones and reduced motion: the same four acts as a plain page. */
function StaticExhibit() {
    return (
        <section aria-label="Sosai Masutatsu Oyama" data-bleed className="bg-night pb-20 font-gothic text-canvas">
            <div className="pt-16">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={PORTRAIT} alt={PORTRAIT_ALT} fetchPriority="high" className="mx-auto aspect-square w-full max-w-[40rem] object-cover grayscale [mask-image:radial-gradient(ellipse_50%_55%_at_50%_45%,#000_55%,transparent_100%)]" />
                <div className="-mt-12 px-4 sm:px-6">
                    <HeroCopy />
                </div>
            </div>
            <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
                <h2 className="mt-16 font-mincho text-[clamp(2rem,6vw,3.052rem)] font-extrabold leading-[1.1] text-canvas">The founder.</h2>
                <ol className="mt-8 grid gap-8 sm:grid-cols-2">
                    {RULES.map((r, i) => (
                        <li key={r.id}><RuleLabel rule={r} i={i} /></li>
                    ))}
                </ol>
                <h2 className="mt-20 font-mincho text-[clamp(2rem,6vw,3.052rem)] font-extrabold leading-[1.1] text-canvas">The four weapons.</h2>
                <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {WEAPONS.map((w) => (
                        <li key={w.id}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={mediaUrl(w.src)} alt={w.alt} loading="lazy" className="aspect-square w-full object-cover" />
                            <p className="mt-3 font-bold text-canvas">
                                <span lang="ja" className="font-mincho">{w.kanji}</span> {w.name}
                            </p>
                            <p className="text-sm text-ash">{w.text}</p>
                        </li>
                    ))}
                </ul>
                <div className="mt-20"><FirstStep /></div>
            </div>
        </section>
    );
}

export default function Exhibit() {
    const reduced = useReduced();
    const wide = useSyncExternalStore(subscribeWide, () => window.matchMedia(DESKTOP).matches, () => true);
    const section = useRef<HTMLElement>(null);
    const stage = useRef<HTMLDivElement>(null);
    const statue = useRef<HTMLDivElement>(null);
    const title = useRef<HTMLSpanElement>(null);
    const hero = useRef<HTMLDivElement>(null);
    const panel = useRef<HTMLDivElement>(null);
    const counter = useRef<HTMLSpanElement>(null);
    const bar = useRef<HTMLSpanElement>(null);
    const ruleDots = useRef<(HTMLSpanElement | null)[]>([]);
    const rulePaths = useRef<(SVGPathElement | null)[]>([]);
    const ruleTags = useRef<(HTMLDivElement | null)[]>([]);
    const weapons = useRef<(HTMLLIElement | null)[]>([]);
    const size = useRef({ w: 1440, h: 900 });

    useEffect(() => {
        const el = stage.current;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            size.current = { w: el.clientWidth, h: el.clientHeight };
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [wide, reduced]);

    useScrollProgress(
        section,
        (p) => {
            const { w: vw, h: vh } = size.current;
            // The statue: 86% of the stage tall, centred, then stepping aside in act IV.
            const glide = ease(range(p, 0.78, 0.9));
            const sh = vh * 0.8;
            const sw = (sh * SRC.w) / SRC.h;
            const intro = ease(range(p, 0, 0.18));
            const scale = 1.08 - 0.08 * intro - 0.08 * glide;
            const left = vw / 2 - sw / 2 - glide * vw * 0.22;
            const top = vh - sh;
            if (statue.current) {
                statue.current.style.transform = `translate3d(${left}px, ${top}px, 0) scale(${scale})`;
                statue.current.style.width = `${sw}px`;
                statue.current.style.height = `${sh}px`;
            }
            const toScreen = (x: number, y: number) => {
                // Same transform as the statue, scale about its centre.
                const cx = left + sw / 2;
                const cy = top + sh / 2;
                return { x: cx + (x / SRC.w - 0.5) * sw * scale, y: cy + (y / SRC.h - 0.5) * sh * scale };
            };

            // Act I: 極真 rises behind him; the hero copy holds, then gives way.
            if (title.current) {
                title.current.style.transform = `translate3d(-50%, ${(1 - intro) * 30}vh, 0)`;
                title.current.style.opacity = String(intro * (1 - range(p, 0.16, 0.22)));
            }
            const heroA = 1 - range(p, 0.14, 0.2);
            if (hero.current) {
                hero.current.style.opacity = String(heroA);
                hero.current.style.visibility = heroA > 0 ? "visible" : "hidden";
                hero.current.inert = heroA < 0.5;
            }

            // Act II: the rules draw in one after another, out together.
            const colL = vw * 0.06;
            const colR = vw * 0.94;
            RULES.forEach((r, i) => {
                const a = Math.min(range(p, 0.22 + i * 0.045, 0.27 + i * 0.045), 1 - range(p, 0.47, 0.5));
                const dot = ruleDots.current[i];
                const path = rulePaths.current[i];
                const tag = ruleTags.current[i];
                if (!dot || !path || !tag) return;
                const vis = a > 0 ? "visible" : "hidden";
                dot.style.visibility = vis;
                path.style.visibility = vis;
                tag.style.visibility = vis;
                const pt = toScreen(r.x, r.y);
                const edge = r.side === "left" ? colL + 300 : colR - 300;
                const ty = pt.y;
                dot.style.transform = `translate3d(${pt.x}px, ${pt.y}px, 0)`;
                path.setAttribute("d", `M${pt.x} ${pt.y}L${edge} ${ty}`);
                path.style.strokeDashoffset = String(1 - clamp(a / 0.7));
                tag.style.transform = `translate3d(${r.side === "left" ? colL : colR - 300}px, ${ty - 14}px, 0)`;
                tag.style.opacity = String(clamp((a - 0.5) / 0.5));
            });

            // Act III: the weapons burst from behind him, pass in front once they clear his outline,
            // and lock into a diamond.
            const card = Math.min(vh * 0.24, vw * 0.16);
            WEAPONS.forEach((wpn, i) => {
                const li = weapons.current[i];
                if (!li) return;
                const t = ease(range(p, 0.5 + i * 0.025, 0.64 + i * 0.025));
                const out = range(p, 0.74, 0.8);
                const cx = vw / 2 + wpn.at[0] * vw * t;
                const cy = vh * 0.52 + wpn.at[1] * vh * t;
                li.style.transform = `translate3d(${cx - card / 2}px, ${cy - card / 2}px, 0) scale(${0.4 + 0.6 * t})`;
                li.style.width = `${card}px`;
                li.style.opacity = String(t > 0 ? Math.min(1, t * 3) * (1 - out) : 0);
                li.style.zIndex = t > 0.45 ? "30" : "5";
                li.style.visibility = t > 0 && out < 1 ? "visible" : "hidden";
            });

            // Act IV: the first step.
            const panelA = range(p, 0.84, 0.94);
            if (panel.current) {
                panel.current.style.opacity = String(panelA);
                panel.current.style.transform = `translate3d(${(1 - panelA) * 40}px, -50%, 0)`;
                panel.current.style.visibility = panelA > 0 ? "visible" : "hidden";
                panel.current.inert = panelA < 0.5;
            }

            const act = p < 0.2 ? 1 : p < 0.5 ? 2 : p < 0.78 ? 3 : 4;
            if (counter.current) counter.current.textContent = `0${act}`;
            if (bar.current) bar.current.style.transform = `scaleX(${p})`;
        },
        { enabled: wide && !reduced },
    );

    if (reduced || !wide) return <StaticExhibit />;

    return (
        <section ref={section} aria-label="Sosai Masutatsu Oyama" data-bleed className="relative bg-night font-gothic text-canvas" style={{ height: `${STAGE_VH}vh` }}>
            <div ref={stage} className="sticky top-0 h-[100svh] overflow-hidden">
                {/* Act I: the title behind him. */}
                <span
                    ref={title}
                    aria-hidden="true"
                    lang="ja"
                    className="pointer-events-none absolute left-1/2 top-[14vh] whitespace-nowrap font-mincho text-[min(52vh,30vw)] font-extrabold leading-none text-worn-belt"
                    style={{ opacity: 0 }}
                >
                    極真
                </span>

                {/* The statue. */}
                <div ref={statue} className="absolute left-0 top-0 z-10 origin-center will-change-transform">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={PORTRAIT}
                        alt={PORTRAIT_ALT}
                        fetchPriority="high"
                        className="h-full w-full object-cover grayscale [mask-image:radial-gradient(ellipse_50%_55%_at_50%_45%,#000_55%,transparent_100%)]"
                    />
                </div>

                {/* Act I copy. */}
                <div ref={hero} className="absolute inset-x-0 bottom-0 z-20 isolate px-10 pb-[clamp(2.5rem,9vh,6rem)]">
                    <span aria-hidden="true" className="absolute -left-[10%] bottom-0 -z-10 h-[130%] w-[75%] bg-[radial-gradient(ellipse_at_10%_100%,rgba(0,0,0,0.85),rgba(0,0,0,0.5)_45%,transparent_75%)]" />
                    <HeroCopy />
                </div>

                {/* Act II: the rules. */}
                <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible">
                    {RULES.map((r, i) => (
                        <path
                            key={r.id}
                            ref={(el) => {
                                rulePaths.current[i] = el;
                            }}
                            pathLength={1}
                            strokeDasharray="1"
                            strokeDashoffset="1"
                            fill="none"
                            strokeWidth={1}
                            className={`invisible stroke-dan-gold`}
                        />
                    ))}
                </svg>
                {RULES.map((r, i) => (
                    <span
                        key={r.id}
                        ref={(el) => {
                            ruleDots.current[i] = el;
                        }}
                        aria-hidden="true"
                        className={`invisible absolute left-0 top-0 z-20 -ml-[4px] -mt-[4px] h-2 w-2 rounded-full bg-dan-gold`}
                    />
                ))}
                <h2 className="sr-only">The founder</h2>
                <ol>
                    {RULES.map((r, i) => (
                        <li key={r.id}>
                            <div
                                ref={(el) => {
                                    ruleTags.current[i] = el;
                                }}
                                className="invisible absolute left-0 top-0 z-20 w-[300px] [text-shadow:0_0_2px_rgba(0,0,0,0.95),0_0_12px_rgba(0,0,0,0.9)]"
                            >
                                <RuleLabel rule={r} i={i} />
                            </div>
                        </li>
                    ))}
                </ol>

                {/* Act III: the four weapons. */}
                <h2 className="sr-only">The four weapons</h2>
                <ul>
                    {WEAPONS.map((wpn, i) => (
                        <li
                            key={wpn.id}
                            ref={(el) => {
                                weapons.current[i] = el;
                            }}
                            className="invisible absolute left-0 top-0 will-change-transform"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={mediaUrl(wpn.src)} alt={wpn.alt} loading="lazy" className="aspect-square w-full object-cover" />
                            <p className="mt-2 font-gothic text-sm text-canvas [text-shadow:0_0_8px_rgba(0,0,0,0.9)]">
                                <span lang="ja" className="font-mincho">{wpn.kanji}</span> <span className="font-bold">{wpn.name}</span>
                                <span className="block text-ash">{wpn.text}</span>
                            </p>
                        </li>
                    ))}
                </ul>

                {/* Act IV: the first step. */}
                <div ref={panel} className="invisible absolute right-[6vw] top-1/2 z-30 w-[min(30rem,38vw)]" style={{ opacity: 0 }}>
                    <FirstStep />
                </div>

                {/* Where you are in the exhibit. */}
                <div aria-hidden="true" className="absolute bottom-6 right-10 z-20 flex items-center gap-3 font-gothic text-[0.8rem] text-ash">
                    <span ref={counter} className="tabular-nums text-canvas">01</span> / 04
                    <span className="relative h-px w-24 bg-worn-belt">
                        <span ref={bar} className="absolute inset-0 origin-left bg-dan-gold" style={{ transform: "scaleX(0)" }} />
                    </span>
                </div>
            </div>
        </section>
    );
}
