'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Section from '@/components/brand/Section';
import Reveal from '@/components/brand/Reveal';

const RECENT_FORMATS = [
    'KKI-2025-MUM-00001',
    'KKI-2025-DEL-00042',
    'KKI-2026-BLR-00103',
];

const STEPS = [
    { title: 'Enter the ID', desc: 'Type the membership number exactly as it appears on the card or certificate.' },
    { title: 'Checked against the register', desc: 'The number is looked up in the official KKFI membership database.' },
    { title: 'Read the record', desc: 'Belt rank, dojo, years of training and the full promotion history.' },
];

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
            <header data-bleed className="relative flex min-h-[78svh] overflow-hidden bg-black">
                <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col justify-end px-4 pb-[clamp(3rem,8vh,5rem)] pt-36 sm:px-6 md:pt-44 lg:px-8">
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
                                placeholder="KKI-2025-MUM-00001"
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
                        <p className="mt-1 text-sm text-white/50">Pattern: KKI-YEAR-CITY-NUMBER</p>
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
