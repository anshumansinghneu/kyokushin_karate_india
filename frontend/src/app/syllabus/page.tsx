'use client';

import { useEffect, useMemo, useState } from 'react';
import { animate, useMotionValue } from 'framer-motion';
import { ArrowRight, Printer } from 'lucide-react';
import PageHero from '@/components/brand/PageHero';
import SceneSlot from '@/components/three/SceneSlot';
import BrandLink from '@/components/brand/BrandLink';
import Reveal from '@/components/brand/Reveal';
import { SYLLABUS, type SyllabusEntry } from '@/lib/syllabus';



/** The belt's own colour, used only as a swatch: it means the rank, so it is the one colour on each section. */
const SWATCH: Record<string, string> = {
    White: '#ffffff',
    Orange: '#f97316',
    Blue: '#3b82f6',
    Yellow: '#eab308',
    Green: '#22c55e',
    Brown: '#92400e',
    Black: '#161616',
};

const SECTIONS = [
    { key: 'kihon', label: 'Kihon', gloss: 'Basics' },
    { key: 'kumite', label: 'Kumite', gloss: 'Sparring' },
    { key: 'fitness', label: 'Fitness', gloss: 'Requirements' },
    { key: 'additional', label: 'Additional', gloss: 'Knowledge and etiquette' },
] as const;

const anchor = (belt: string) => `belt-${belt.toLowerCase()}`;

function Swatch({ belt, className = 'h-3 w-8' }: { belt: string; className?: string }) {
    return (
        <span
            aria-hidden="true"
            className={`inline-block shrink-0 rounded-sm ring-1 print:ring-black/40 ${belt === 'Black' ? 'ring-secondary/70' : 'ring-white/30'} ${className}`}
            style={{ backgroundColor: SWATCH[belt] }}
        />
    );
}

function BeltSection({ entry }: { entry: SyllabusEntry }) {
    return (
        <section
            id={anchor(entry.belt)}
            aria-labelledby={`${anchor(entry.belt)}-title`}
            className="scroll-mt-40 border-t border-white/15 py-14 first:border-t-0 first:pt-0 md:scroll-mt-32 print:break-inside-avoid print:border-black/20 print:py-6"
        >
            <Reveal>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <Swatch belt={entry.belt} className="h-4 w-12" />
                    <p className="text-sm font-semibold text-white/60 print:text-black/60">
                        {entry.kata.length} kata
                    </p>
                </div>
                <h2
                    id={`${anchor(entry.belt)}-title`}
                    className="mt-4 text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[0.95] tracking-[-0.02em] text-white print:text-black"
                >
                    {entry.belt} belt{entry.belt === 'Black' ? <span className="text-secondary print:text-black">.</span> : <span className="text-white/35 print:text-black">.</span>}
                </h2>
                <p className="mt-4 max-w-[60ch] text-pretty text-lg leading-relaxed text-white/80 print:text-black">{entry.overview}</p>
            </Reveal>

            {/* Kata gets a table: name, Japanese, and what it trains. */}
            <div className="mt-10">
                <h3 className="text-sm font-bold tracking-[0.1em] text-white print:text-black">
                    Kata <span className="font-semibold normal-case tracking-normal text-white/55 print:text-black/60">· Forms</span>
                </h3>
                <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left">
                        <thead>
                            <tr className="border-b border-white/20 text-sm text-white/55 print:border-black/30 print:text-black/60">
                                <th scope="col" className="py-2 pr-6 font-semibold">Kata</th>
                                <th scope="col" className="py-2 pr-6 font-semibold">Japanese</th>
                                <th scope="col" className="py-2 font-semibold">Focus</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10 print:divide-black/15">
                            {entry.kata.map((k) => (
                                <tr key={k.name}>
                                    <th scope="row" className="py-3 pr-6 font-bold text-white print:text-black">{k.name}</th>
                                    <td lang="ja" className="py-3 pr-6 text-white/75 print:text-black">{k.japanese}</td>
                                    <td className="py-3 text-white/75 print:text-black">{k.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-10 grid gap-x-12 gap-y-10 md:grid-cols-2">
                {SECTIONS.map(({ key, label, gloss }) => (
                    <div key={key}>
                        <h3 className="text-sm font-bold tracking-[0.1em] text-white print:text-black">
                            {label} <span className="font-semibold normal-case tracking-normal text-white/55 print:text-black/60">· {gloss}</span>
                        </h3>
                        <ul className="mt-3 divide-y divide-white/10 border-y border-white/10 print:divide-black/15 print:border-black/15">
                            {entry[key].map((item) => (
                                <li key={item} className="flex gap-3 py-2.5 leading-snug text-white/85 print:text-black">
                                    <span aria-hidden="true" className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-white/50 print:bg-black" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </section>
    );
}

/**
 * The hero belt steps through the syllabus belts on its own: it holds each rank,
 * then turns over to the next, the way a grading is a moment rather than a blend.
 */
function useBeltSteps(count: number, holdMs = 2600) {
    const mv = useMotionValue(0);
    useEffect(() => {
        let i = 0;
        let dir = 1;
        let controls: ReturnType<typeof animate> | null = null;
        const id = window.setInterval(() => {
            if (i + dir < 0 || i + dir > count - 1) dir = -dir;
            i += dir;
            controls?.stop();
            controls = animate(mv, i / (count - 1), { duration: 0.9, ease: [0.65, 0, 0.35, 1] });
        }, holdMs);
        return () => {
            window.clearInterval(id);
            controls?.stop();
        };
    }, [mv, count, holdMs]);
    return mv;
}

export default function SyllabusPage() {
    const drift = useBeltSteps(SYLLABUS.length);
    // Phones: the belt gets its own band above the copy, framed centred (decided after mount;
    // the scene itself only ever renders on the client, so this cannot cause a mismatch).
    const [narrow, setNarrow] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        const sync = () => setNarrow(mq.matches);
        const id = requestAnimationFrame(sync);
        mq.addEventListener('change', sync);
        return () => {
            cancelAnimationFrame(id);
            mq.removeEventListener('change', sync);
        };
    }, []);
    const beltProps = useMemo(
        () => ({
            progress: drift,
            compact: narrow,
            stops: SYLLABUS.map((e) => ({ color: SWATCH[e.belt] ?? '#ffffff', bars: e.belt === 'Black' ? 1 : 0 })),
        }),
        [drift, narrow],
    );

    return (
        <div className="min-h-screen text-white print:bg-white print:text-black">
            {/* Printing: keep only the syllabus itself, black on white. */}
            <style>{`@media print {
                body { background: #fff !important; }
                nav, footer, [data-print-hide] { display: none !important; }
                main { padding: 0 !important; }
            }`}</style>

            <div data-print-hide>
                <PageHero
                    height="tall"
                    title={<>Belt syllabus.</>}
                    lede="Your complete guide to the Kyokushin Karate belt progression — from White to Black belt."
                    media={
                        <SceneSlot
                            scene="belt"
                            sceneProps={beltProps}
                            className="absolute inset-x-0 top-0 h-[44svh] md:inset-0 md:h-auto"
                            fallback={
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src="/history/belt-grip.jpg" alt="" className="h-full w-full object-cover object-center opacity-70 grayscale" />
                            }
                        />
                    }
                    actions={
                        <>
                            <BrandLink href="/belt-system">
                                See the belt path <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </BrandLink>
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/25 px-7 text-sm font-bold tracking-[0.1em] text-white transition-colors hover:border-white/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                            >
                                <Printer className="h-4 w-4" aria-hidden="true" /> Print
                            </button>
                        </>
                    }
                />
            </div>

            <h1 className="sr-only print:not-sr-only print:mb-6 print:text-3xl print:font-extrabold">KKFI belt syllabus</h1>

            <div className="mx-auto max-w-[1400px] px-4 pb-24 sm:px-6 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16 lg:px-8 print:block print:p-0">
                {/* Belt index: a swatch rail that stays with you while you read. */}
                <nav
                    aria-label="Belts"
                    data-print-hide
                    className="sticky top-16 z-10 -mx-4 mb-10 overflow-x-auto border-b border-white/10 bg-black px-4 py-3 md:top-28 lg:mx-0 lg:mb-0 lg:self-start lg:overflow-visible lg:border-b-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none"
                >
                    <ol className="flex gap-1 lg:flex-col lg:gap-0 lg:pt-14">
                        {SYLLABUS.map((entry) => (
                            <li key={entry.belt}>
                                <a
                                    href={`#${anchor(entry.belt)}`}
                                    className="flex min-h-11 items-center gap-3 whitespace-nowrap px-3 text-sm font-bold text-white/70 transition-colors hover:text-white lg:border-t lg:border-white/10 lg:px-0 lg:py-3"
                                >
                                    <Swatch belt={entry.belt} className="h-2.5 w-6" />
                                    {entry.belt}
                                    
                                </a>
                            </li>
                        ))}
                    </ol>
                </nav>

                <div className="lg:pt-14">
                    {SYLLABUS.map((entry) => (
                        <BeltSection key={entry.belt} entry={entry} />
                    ))}
                </div>
            </div>
        </div>
    );
}
