'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Section from '@/components/brand/Section';
import Reveal from '@/components/brand/Reveal';
import SceneSlot from '@/components/three/SceneSlot';
import KankuMark from '@/components/KankuMark';

// An instructor's public record as the worked example; students are never showcased.
const RECENT_FORMATS = ['KKFI-INS-0005'];

const STEPS = [
    { title: 'Enter the ID', desc: 'Type the membership number exactly as it appears on the card or certificate.' },
    { title: 'Checked against the register', desc: 'The number is looked up in the official KKFI membership database.' },
    { title: 'Read the record', desc: 'Belt rank, dojo, years of training and the full promotion history.' },
];

/** The generic card: no holder yet. Stable object so the slot never re-registers. */
const CARD_PROPS = {};

/** Static stand-in for the 3D card: a flat black card with the gold Kanku. */
function CardPoster() {
    return (
        <div className="absolute inset-0 bg-black">
            <div className="absolute left-1/2 top-1/2 flex aspect-[1.6] w-[min(78vw,30rem)] -translate-x-1/2 -translate-y-1/2 -rotate-6 items-center gap-6 rounded-xl border border-secondary/50 bg-[#0b0b0b] p-6 md:left-auto md:right-[8%] md:translate-x-0">
                <KankuMark className="h-2/3 w-auto text-secondary" />
                <div className="min-w-0">
                    <p className="text-[10px] font-bold text-white/60">KYOKUSHIN KARATE FOUNDATION OF INDIA</p>
                    <p className="mt-2 text-xl font-black text-white">KKFI MEMBER</p>
                    <p className="mt-1 text-sm font-bold text-secondary">KKFI · MEMBERSHIP</p>
                </div>
            </div>
        </div>
    );
}

export default function VerifyIndexPage() {
    const router = useRouter();
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/verify/${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <div className="min-h-screen text-white selection:bg-primary selection:text-white">
            <header data-bleed className="relative flex min-h-[86svh] overflow-hidden md:min-h-[82svh]">
                <SceneSlot
                    scene="certificate"
                    sceneProps={CARD_PROPS}
                    className="absolute inset-x-0 top-0 h-[40svh] md:inset-0 md:h-auto"
                    fallback={<CardPoster />}
                />
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,black_52%,transparent_70%)] md:bg-gradient-to-r md:from-black/90 md:via-black/40 md:via-45% md:to-transparent" />
                <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col justify-end px-4 pb-[clamp(3rem,8vh,5rem)] pt-[36svh] sm:px-6 md:pt-44 lg:px-8">
                    <div className="mb-8 flex items-center gap-3 text-sm font-semibold text-white/75">
                        <Image src="/kkfi-logo.avif" alt="" width={36} height={36} className="h-9 w-9" />
                        <span>The official KKFI membership register</span>
                    </div>
                    <h1 className="max-w-[14ch] text-balance text-[clamp(2.75rem,8vw,6rem)] font-black uppercase leading-[0.92] tracking-[-0.035em]">
                        Verify a member<span className="text-primary">.</span>
                    </h1>
                    <p className="mt-6 max-w-[46ch] text-pretty text-lg leading-relaxed text-white/80 md:text-xl">
                        Confirm that a KKFI membership, rank and dojo are genuine. Public lookup, no account needed.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-12 max-w-2xl" role="search" aria-label="Verify a membership number">
                        <label htmlFor="verify-id" className="mb-3 block text-sm font-semibold text-white/80">
                            Membership number
                        </label>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                            <input
                                id="verify-id"
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="KKFI-STD-00001"
                                autoComplete="off"
                                autoCapitalize="characters"
                                spellCheck={false}
                                className="min-h-14 flex-1 rounded-none border-0 border-b-2 border-white/30 bg-transparent px-1 text-2xl font-bold uppercase tracking-[0.04em] text-white tabular-nums placeholder:font-semibold placeholder:normal-case placeholder:tracking-normal placeholder:text-white/40 transition-colors focus:outline-none focus-visible:border-primary"
                            />
                            <button
                                type="submit"
                                disabled={!query.trim()}
                                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-none bg-primary px-8 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/50"
                            >
                                Verify
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                            </button>
                        </div>
                        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-white/60">
                            <span>Try an example:</span>
                            {RECENT_FORMATS.map((fmt) => (
                                <button
                                    key={fmt}
                                    type="button"
                                    onClick={() => setQuery(fmt)}
                                    className="min-h-11 font-semibold tabular-nums text-white/80 underline decoration-white/25 underline-offset-4 transition-colors hover:text-white hover:decoration-white"
                                >
                                    {fmt}
                                </button>
                            ))}
                        </div>
                        <p className="mt-1 text-sm text-white/50">Students: KKFI-STD-00001 · Instructors: KKFI-INS-0001</p>
                    </form>
                </div>
            </header>

            {/* A real sequence, so it is numbered. */}
            <Section rhythm="base" width="wide" className="bg-black">
                <Reveal>
                    <h2 className="flex items-center gap-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-extrabold leading-[1.05] tracking-[-0.02em]">
                        <ShieldCheck className="h-7 w-7 text-secondary" aria-hidden="true" />
                        How verification works
                    </h2>
                </Reveal>
                <ol className="mt-12 grid gap-10 border-t border-white/10 pt-10 md:grid-cols-3 md:gap-12">
                    {STEPS.map((step, i) => (
                        <Reveal as="li" key={step.title} delay={i * 0.08}>
                            <span className="text-sm font-bold tabular-nums text-white/45">0{i + 1}</span>
                            <h3 className="mt-3 text-xl font-extrabold text-white">{step.title}</h3>
                            <p className="mt-2 max-w-[36ch] leading-relaxed text-white/70">{step.desc}</p>
                        </Reveal>
                    ))}
                </ol>
            </Section>
        </div>
    );
}
