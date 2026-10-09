"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronRight } from "lucide-react";
import PageHero from "@/components/brand/PageHero";
import BrandLink from "@/components/brand/BrandLink";
import Reveal from "@/components/brand/Reveal";
import Section, { Heading } from "@/components/brand/Section";
import KankuMark from "@/components/KankuMark";
import HistoryHeroSlot from "@/components/three/HistoryHeroSlot";
import { useState } from "react";

// The lineage as a corridor of portraits, in order. Module scope keeps the scene's props stable.
const LINEAGE_PRINTS = ["/history/oyama.jpg", "/history/ryuko-take.jpg", "/history/shihan-vasant.jpg"];
// Imported so Next can size them and generate blur placeholders at build time.
import ryukoTake from "../../../public/ryuko-take.png";
import shihanVasant from "../../../public/shihan-vasant.png";

/* The line of authority, in order. A real sequence, so it is numbered. */
const LINEAGE: { years: string; name: string; role: string; body: string; image: string | StaticImageData }[] = [
    {
        years: "1923–1994",
        name: "Sosai Masutatsu Oyama",
        role: "Founder of Kyokushin",
        body: "Founded the International Karate Organization Kyokushinkaikan in Tokyo in 1964: full-contact fighting, extreme conditioning, and the Osu spirit.",
        image: "/history/oyama.jpg",
    },
    {
        years: "8th Dan",
        name: "Daihyo Ryuko Take",
        role: "President, IKO World Kyokushin Kaikan",
        body: "Trained directly under Sosai Oyama from the age of 18, founded the Kagoshima branch in 1981, and today leads the world organisation KKFI belongs to.",
        image: ryukoTake,
    },
    {
        years: "Since 2013",
        name: "Shihan Vasant Kumar Singh",
        role: "Country Director, India",
        body: "Training since 1987, he founded the Kyokushin Karate Foundation of India in 2013 to bring authentic Kyokushin to the country.",
        image: shihanVasant,
    },
];

const WORK = [
    { title: "Train", body: "Dojos across India teaching one syllabus, from white belt to the dan grades.", href: "/find-a-dojo", cta: "Find a dojo" },
    { title: "Grade", body: "Belt gradings held to the same standard in every dojo, recorded and verifiable.", href: "/belt-system", cta: "The belt path" },
    { title: "Compete", body: "National tournaments, camps and seminars, announced on one calendar.", href: "/events", cta: "Events" },
    { title: "Represent", body: "Team India: the karateka selected to fight for the country abroad.", href: "/team-india", cta: "Team India" },
];

export default function IntroPage() {
    const [front, setFront] = useState(0);
    const now = LINEAGE[front];
    return (
        <div className="min-h-screen text-white selection:bg-primary selection:text-white">
            <PageHero
                height="screen"
                align="bottom-left"
                kicker={
                    <span className="flex items-center gap-3">
                        <span lang="ja" className="text-2xl font-black text-primary-light">極真</span>
                        <span>The Ultimate Truth</span>
                    </span>
                }
                title={
                    <span className="uppercase">
                        Kyokushin<br />India<span className="text-primary">.</span>
                    </span>
                }
                lede="The Kyokushin Karate Foundation of India: the national home of full-contact Kyokushin, in the lineage of Sosai Mas Oyama."
                media={
                    <HistoryHeroSlot
                        className="absolute inset-x-0 top-0 h-[46svh] md:inset-0 md:h-auto"
                        images={LINEAGE_PRINTS}
                        seconds={6}
                        onIndex={setFront}
                        poster={
                            <Image
                                src="/history/grading-floor.jpg"
                                alt="Karateka in white gi on the mats at a KKFI tournament"
                                fill
                                priority
                                sizes="100vw"
                                className="object-cover opacity-60 grayscale"
                            />
                        }
                    />
                }
                actions={
                    <>
                        <BrandLink href="/">
                            Enter the dojo <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </BrandLink>
                        <BrandLink href="/what-is-kyokushin" variant="outline">What is Kyokushin?</BrandLink>
                    </>
                }
            >
                {/* Caption for the portrait in front: the lineage, one generation at a time. */}
                <p aria-live="polite" className="mt-10 hidden max-w-sm self-end text-right text-sm md:block">
                    <span className="tabular-nums text-white/40">0{front + 1}</span>
                    <span className="ml-3 font-semibold text-white">{now.name}</span>
                    <span className="block text-white/60">{now.role} · {now.years}</span>
                </p>
            </PageHero>

            {/* Who we are: one confident statement, then the plain facts. */}
            <Section rhythm="open" width="wide" className="bg-black">
                <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-20">
                    <Reveal kind="mask" duration={1.1}>
                        <p className="max-w-[20ch] text-balance text-[clamp(2rem,4.8vw,4rem)] font-black leading-[1.02] tracking-[-0.03em] text-white">
                            One syllabus, one standard, one lineage, in every dojo in India<span className="text-primary">.</span>
                        </p>
                    </Reveal>
                    <Reveal delay={0.1} className="space-y-6 self-end text-pretty text-lg leading-relaxed text-white/75">
                        <p>
                            <strong className="text-white">Kyokushin (極真)</strong> means &ldquo;the ultimate truth&rdquo;.
                            It is the full-contact karate Sosai Masutatsu Oyama founded in 1964: real strikes to the body
                            and legs, demanding conditioning, and a spirit that does not quit.
                        </p>
                        <p>
                            KKFI is how that karate is taught in India. Led by Shihan Vasant Kumar Singh and part of IKO World
                            Kyokushin Kaikan, it runs the dojos, gradings, tournaments and national team under one roof.
                        </p>
                    </Reveal>
                </div>
            </Section>

            {/* Lineage */}
            <Section rhythm="base" width="wide" className="bg-black">
                <Reveal>
                    <Heading className="max-w-[18ch]">From the founder to India<span className="text-primary">.</span></Heading>
                </Reveal>
                <ol className="mt-14 grid gap-14 md:grid-cols-3 md:gap-8">
                    {LINEAGE.map((p, i) => (
                        <Reveal as="li" key={p.name} kind="depth" delay={i * 0.1}>
                            <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-surface">
                                <Image
                                    src={p.image}
                                    alt={`${p.name}, ${p.role}`}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    placeholder={typeof p.image === "string" ? "empty" : "blur"}
                                    className="object-cover object-top grayscale"
                                />
                            </div>
                            <p className="mt-6 flex items-baseline gap-3 text-sm font-semibold">
                                <span className="font-bold tabular-nums text-primary-light">0{i + 1}</span>
                                <span className="text-secondary">{p.years}</span>
                            </p>
                            <h3 className="mt-2 text-2xl font-black uppercase leading-tight text-white">{p.name}</h3>
                            <p className="mt-1 text-sm text-white/65">{p.role}</p>
                            <p className="mt-4 max-w-[42ch] leading-relaxed text-white/75">{p.body}</p>
                        </Reveal>
                    ))}
                </ol>
            </Section>

            {/* What KKFI does: four rows that lead into the site. */}
            <Section rhythm="base" width="base" className="bg-black">
                <Reveal>
                    <Heading>What we do</Heading>
                </Reveal>
                <ul className="mt-10 divide-y divide-white/10 border-y border-white/10">
                    {WORK.map((w, i) => (
                        <Reveal as="li" key={w.title} delay={i * 0.05}>
                            <Link href={w.href} className="group grid items-baseline gap-2 py-7 md:grid-cols-[15rem_minmax(0,1fr)_auto] md:gap-10">
                                <span className="text-[clamp(1.75rem,3vw,2.25rem)] font-black uppercase leading-none tracking-[-0.02em] text-white transition-colors group-hover:text-primary-light">
                                    {w.title}
                                </span>
                                <span className="max-w-[52ch] text-lg leading-relaxed text-white/75">{w.body}</span>
                                <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.1em] text-white/70 transition-colors group-hover:text-white">
                                    {w.cta} <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                                </span>
                            </Link>
                        </Reveal>
                    ))}
                </ul>
            </Section>

            {/* Closing */}
            <Section rhythm="open" width="wide" className="overflow-hidden bg-black">
                <KankuMark className="pointer-events-none absolute -right-[10vw] top-1/2 h-[70vw] max-h-[720px] w-[70vw] max-w-[720px] -translate-y-1/2 text-white/[0.04]" />
                <Reveal kind="mask" duration={1.1}>
                    <p className="text-[clamp(2.75rem,8vw,6rem)] font-black uppercase leading-[0.95] tracking-[-0.03em] text-white">
                        The ultimate<br />truth<span className="text-primary">.</span>
                    </p>
                </Reveal>
                <Reveal delay={0.15} className="mt-10 flex flex-col gap-3 sm:flex-row">
                    <BrandLink href="/">
                        Enter the dojo <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </BrandLink>
                    <BrandLink href="/register" variant="outline">
                        Become a member <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </BrandLink>
                </Reveal>
            </Section>
        </div>
    );
}
