'use client';

import { useEffect, useMemo, useState } from 'react';
import { animate, useMotionValue } from 'framer-motion';
import { ArrowRight, Printer } from 'lucide-react';
import PageHero from '@/components/brand/PageHero';
import SceneSlot from '@/components/three/SceneSlot';
import BrandLink from '@/components/brand/BrandLink';
import Reveal from '@/components/brand/Reveal';

interface KataInfo {
    name: string;
    japanese?: string;
    description?: string;
}

interface SyllabusEntry {
    belt: string;
    color: string;
    bgColor: string;
    borderColor: string;
    timeRequired: string;
    overview: string;
    kihon: string[];
    kata: KataInfo[];
    kumite: string[];
    fitness: string[];
    additional: string[];
}

const SYLLABUS: SyllabusEntry[] = [
    {
        belt: 'White',
        color: 'text-gray-200',
        bgColor: 'bg-white/10',
        borderColor: 'border-gray-300/30',
        timeRequired: 'Beginner',
        overview: 'Foundation of Kyokushin — learn basic stances, strikes, and etiquette.',
        kihon: [
            'Seiken Chudan Tsuki (Middle punch)',
            'Seiken Jodan Tsuki (Upper punch)',
            'Seiken Ago Uchi (Jaw strike)',
            'Shuto Ganmen Uchi (Knife-hand strike)',
            'Mae Geri (Front kick)',
            'Hiza Geri (Knee kick)',
            'Kin Geri (Groin kick)',
        ],
        kata: [
            { name: 'Taikyoku Sono Ichi', japanese: '太極その一', description: 'First basic kata — straight punches in Zenkutsu Dachi' },
            { name: 'Taikyoku Sono Ni', japanese: '太極その二', description: 'Second basic kata — upper blocks and punches' },
        ],
        kumite: ['Basic 3-step sparring (Sanbon Kumite)', 'Distance and timing basics'],
        fitness: ['50 push-ups', '30 sit-ups', '20 squats', '1-minute plank'],
        additional: ['Dojo etiquette and bowing', 'Japanese counting (Ichi to Ju)', 'Mokuso (meditation basics)', 'Understanding OSU'],
    },
    {
        belt: 'Orange',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        timeRequired: '3-6 months',
        overview: 'Build on basics with combination techniques and first sparring experience.',
        kihon: [
            'All White belt techniques +',
            'Uraken Shomen Ganmen Uchi (Backfist strike)',
            'Shuto Sakotsu Uchi (Collarbone strike)',
            'Yoko Geri (Side kick)',
            'Mawashi Geri (Roundhouse kick)',
            'Chudan Soto Uke (Outside block)',
            'Chudan Uchi Uke (Inside block)',
            'Gedan Barai (Low sweep block)',
        ],
        kata: [
            { name: 'Taikyoku Sono San', japanese: '太極その三', description: 'Third basic kata — inside blocks' },
            { name: 'Pinan Sono Ichi', japanese: 'ピナンその一', description: 'First Pinan kata — introduces turning and combinations' },
        ],
        kumite: ['5-step sparring', 'Introduction to free sparring (Jiyu Kumite)', 'Basic combinations'],
        fitness: ['70 push-ups', '50 sit-ups', '30 squats', '2-minute plank'],
        additional: ['History of Mas Oyama', 'Kyokushin Kaikan meaning', 'Basic Japanese terminology'],
    },
    {
        belt: 'Blue',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        timeRequired: '6-9 months',
        overview: 'Develop kicking power and begin advanced kata patterns.',
        kihon: [
            'All previous techniques +',
            'Ushiro Geri (Back kick)',
            'Jodan Mawashi Geri (High roundhouse)',
            'Shuto Jodan Uke (Knife-hand upper block)',
            'Morote Tsuki (Double punch)',
            'Tobi Mae Geri (Jumping front kick)',
        ],
        kata: [
            { name: 'Pinan Sono Ni', japanese: 'ピナンその二', description: 'Second Pinan — more complex stance transitions' },
            { name: 'Pinan Sono San', japanese: 'ピナンその三', description: 'Third Pinan — introduces elbow strikes' },
            { name: 'Sanchin', japanese: '三戦', description: 'Breathing kata — develops internal power and rooting' },
        ],
        kumite: ['Free sparring (1 round)', 'Combination counters', 'Distance management'],
        fitness: ['80 push-ups', '60 sit-ups', '40 squats', '3 x 1-min plank'],
        additional: ['Dojo Kun (Training oath)', 'Basic tournament rules'],
    },
    {
        belt: 'Yellow',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        timeRequired: '9-12 months',
        overview: 'Intermediate level — refine technique and develop fighting strategy.',
        kihon: [
            'All previous techniques +',
            'Ura Mawashi Geri (Reverse roundhouse)',
            'Kakato Geri (Axe kick)',
            'Chudan Morote Uke (Augmented block)',
            'Gyaku Tsuki combinations',
        ],
        kata: [
            { name: 'Pinan Sono Yon', japanese: 'ピナンその四', description: 'Fourth Pinan — open-hand techniques' },
            { name: 'Pinan Sono Go', japanese: 'ピナンその五', description: 'Fifth Pinan — jumping techniques' },
        ],
        kumite: ['Free sparring (2 rounds)', 'Counter-attack strategies', 'Clinch techniques'],
        fitness: ['100 push-ups', '80 sit-ups', '50 squats', '5-minute plank'],
        additional: ['Judging criteria awareness', 'Senpai/Kohai etiquette', 'Understanding Zanshin'],
    },
    {
        belt: 'Green',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        timeRequired: '1.5-2 years',
        overview: 'Advanced intermediate — demonstrate power, precision, and fighting spirit.',
        kihon: [
            'All previous techniques +',
            'Tobi Yoko Geri (Jumping side kick)',
            'Tobi Mawashi Geri (Jumping roundhouse)',
            'Ushiro Mawashi Geri (Spinning hook kick)',
            'Advanced combination sequences',
        ],
        kata: [
            { name: 'Gekisai Dai', japanese: '撃砕大', description: 'Attack and destroy — powerful techniques' },
            { name: 'Yantsu', japanese: 'ヤンツー', description: 'Balance and stability focus' },
        ],
        kumite: ['3-round free sparring', 'Multiple opponent defense concepts', 'Tournament-level sparring'],
        fitness: ['100+ push-ups', '100 sit-ups', '60 squats', 'Running 3km'],
        additional: ['Teaching basics to juniors', 'Tameshiwari (board breaking) intro'],
    },
    {
        belt: 'Brown',
        color: 'text-amber-600',
        bgColor: 'bg-amber-700/10',
        borderColor: 'border-amber-600/30',
        timeRequired: '2-3 years',
        overview: 'Pre-black belt — master all fundamentals and develop leadership.',
        kihon: [
            'All techniques with full power and precision',
            'Complex combination sequences (10+ move chains)',
            'Both side execution of all techniques',
        ],
        kata: [
            { name: 'Tsuki No Kata', japanese: '突きの型', description: 'Punching kata — rapid technique execution' },
            { name: 'Tensho', japanese: '転掌', description: 'Rotating palms — soft/hard contrast' },
            { name: 'Saifa', japanese: '砕破', description: 'Destroy and defeat — close-range combat' },
        ],
        kumite: ['5-round sparring', 'Continuous sparring (20 opponents)', 'Self-defense scenarios'],
        fitness: ['150 push-ups', '100 sit-ups', '100 squats', 'Running 5km'],
        additional: ['Tameshiwari (breaking boards/tiles)', 'Referee qualifications', 'Teaching certification fundamentals'],
    },
    {
        belt: 'Black',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        timeRequired: '3-5+ years total',
        overview: 'Shodan — the true beginning. Mastery of all fundamentals and fighting spirit.',
        kihon: [
            'Perfect execution of all Kyokushin techniques',
            'Demonstration of power, speed, and accuracy',
            'Teaching ability for all levels',
        ],
        kata: [
            { name: 'Kanku Dai', japanese: '観空大', description: 'Looking at the sky — the most important Kyokushin kata' },
            { name: 'Garyu', japanese: '臥竜', description: 'Reclining dragon — ground techniques' },
            { name: 'Seienchin', japanese: '征遠鎮', description: 'Control and calm in the storm' },
        ],
        kumite: ['50-man kumite (Hyakunin Kumite path)', '10+ consecutive fights', 'Full-contact tournament experience required'],
        fitness: ['200 push-ups', '150 sit-ups', '150 squats', 'Running 10km'],
        additional: ['Written exam on Kyokushin history and philosophy', 'Tameshiwari demonstration', 'Spirit of OSU — perseverance essay'],
    },
];

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
                        {entry.timeRequired} · {entry.kata.length} kata
                    </p>
                </div>
                <h2
                    id={`${anchor(entry.belt)}-title`}
                    className="mt-4 text-[clamp(2rem,4.5vw,3.25rem)] font-black uppercase leading-[0.95] tracking-[-0.02em] text-white print:text-black"
                >
                    {entry.belt} belt{entry.belt === 'Black' ? <span className="text-secondary print:text-black">.</span> : <span className="text-white/35 print:text-black">.</span>}
                </h2>
                <p className="mt-4 max-w-[60ch] text-pretty text-lg leading-relaxed text-white/80 print:text-black">{entry.overview}</p>
            </Reveal>

            {/* Kata gets a table: name, Japanese, and what it trains. */}
            <div className="mt-10">
                <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-white print:text-black">
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
                        <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-white print:text-black">
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
                    title={<>Belt syllabus<span className="text-primary">.</span></>}
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
                                className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/25 px-7 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                            >
                                <Printer className="h-4 w-4" aria-hidden="true" /> Print
                            </button>
                        </>
                    }
                />
            </div>

            <h1 className="sr-only print:not-sr-only print:mb-6 print:text-3xl print:font-black">KKFI belt syllabus</h1>

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
                                    <span className="hidden font-semibold text-white/40 lg:inline">{entry.timeRequired}</span>
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
