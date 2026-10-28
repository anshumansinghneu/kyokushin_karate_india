"use client";

import { useMemo } from "react";
import { ArrowRight, Mail, Phone } from "lucide-react";
import PageHero from "@/components/brand/PageHero";
import Reveal from "@/components/brand/Reveal";
import Section, { Heading } from "@/components/brand/Section";
import BrandLink from "@/components/brand/BrandLink";
import SceneSlot from "@/components/three/SceneSlot";

/* ── Data ─────────────────────────────────────────────────────────── */
const csrPrograms = [
    {
        title: "School Outreach Program",
        description: "Free self-defense & discipline workshops in government schools, teaching confidence and resilience to every child across India.",
    },
    {
        title: "Free Training for Underprivileged",
        description: "Full scholarships — training, gi, and gear — for underprivileged youth who show the fire of a true karateka.",
    },
    {
        title: "Women's Self-Defense Initiative",
        description: "Dedicated camps for women and girls in rural and semi-urban areas — building unshakable confidence one punch at a time.",
    },
    {
        title: "Community Health & Fitness",
        description: "Free fitness sessions and health awareness camps promoting physical and mental well-being through martial arts discipline.",
    },
    {
        title: "Youth Empowerment Program",
        description: "Anti-bullying workshops and character development through Kyokushin philosophy — respect, perseverance, integrity.",
    },
    {
        title: "Rural Karate Development",
        description: "Building karate training centers where none exist — nurturing champions from India's grassroots.",
    },
];

const missionPoints = ["Empower youth through martial arts", "Build healthier communities", "Nurture future champions"];

const partners = [
    {
        name: "Goldiee Group",
        tagline: "The Epitome of Quality Since 1980",
        description: "One of India's largest producers of quality spices and food products — powering our community health and nutrition programs.",
        logo: "/sponsors/goldiee.png",
        mono: "/sponsors/goldiee-mono.png",
        website: "https://goldiee.com/",
        location: "Kanpur, UP",
    },
    {
        name: "Frontier Alloys",
        tagline: "Trailblazers in Rolling Stock Components",
        description: "Leading manufacturer serving Indian Railways for 38+ years — supporting our youth empowerment and school outreach programs.",
        logo: "/sponsors/frontier.png",
        mono: "/sponsors/frontier-mono.png",
        website: "https://www.frontieralloy.com/",
        location: "Kanpur, UP",
    },
    {
        name: "Shri Gang Industries",
        tagline: "Excellence in Distillery & Food Products Since 1990",
        description: "A committed CSR partner fueling our scholarship and rural karate development programs across northern India.",
        logo: "/sponsors/shrigang.png",
        mono: "/sponsors/shrigang-mono.png",
        website: "https://www.shrigangindustries.com/",
        location: "Sikandrabad, UP",
    },
];

const processSteps = [
    { step: "01", title: "Connect", description: "Reach out to our CSR team" },
    { step: "02", title: "Align", description: "We match programs to your CSR goals" },
    { step: "03", title: "Impact", description: "Your contribution creates change" },
    { step: "04", title: "Report", description: "Receive detailed impact reports" },
];

/* ── Page ─────────────────────────────────────────────────────────── */
export default function CSRPage() {
    const ringProps = useMemo(() => ({ logos: partners.map((p) => p.mono), centered: true }), []);

    return (
        <div className="min-h-screen text-white selection:bg-primary selection:text-white">
            <PageHero
                height="screen"
                kicker="Corporate social responsibility"
                title={<span className="uppercase">Strength beyond the dojo<span className="text-primary">.</span></span>}
                lede="At KKFI, we channel the warrior spirit into community upliftment — empowering youth, defending the vulnerable, and building a stronger India, one dojo at a time."
                media={
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src="/csr/youth-kumite.jpg"
                        alt="Two young karateka in helmets and body guards exchanging techniques at a KKFI tournament"
                        className="h-full w-full object-cover object-[60%_30%] opacity-60 grayscale"
                    />
                }
                actions={
                    <>
                        <BrandLink href="#partner">Partner with us</BrandLink>
                        <BrandLink href="#programs" variant="outline">See the programs</BrandLink>
                    </>
                }
            />

            {/* ── Mission ── */}
            <Section rhythm="open" width="wide" className="bg-black">
                <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
                    <div>
                        <Reveal>
                            <Heading>Why we fight beyond the ring</Heading>
                        </Reveal>
                        <Reveal delay={0.08}>
                            <p className="mt-8 max-w-[56ch] text-pretty text-lg leading-relaxed text-white/75 md:text-xl">
                                Kyokushin means <span className="font-semibold text-white">&quot;the ultimate truth&quot;</span>. Our truth? That
                                martial arts is the most powerful tool for social change. Every punch teaches discipline, every kata
                                builds character, and every belt earned proves that <span className="font-semibold text-white">anyone can rise</span>.
                            </p>
                        </Reveal>
                        <ul className="mt-10 divide-y divide-white/10 border-y border-white/10">
                            {missionPoints.map((m, i) => (
                                <Reveal as="li" key={m} delay={0.1 + i * 0.06} className="py-5 text-lg font-semibold text-white">
                                    {m}
                                </Reveal>
                            ))}
                        </ul>
                    </div>
                    <Reveal kind="depth">
                        <figure className="overflow-hidden rounded-xl bg-surface">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/csr/referee-and-child.jpg"
                                alt="A referee guides a young fighter in a red helmet at a KKFI tournament"
                                loading="lazy"
                                className="aspect-[4/3] w-full object-cover grayscale"
                            />
                        </figure>
                    </Reveal>
                </div>
            </Section>

            {/* ── Programs ── */}
            <Section id="programs" rhythm="base" width="wide" className="scroll-mt-24 bg-black">
                <Reveal className="mb-12 max-w-2xl">
                    <Heading>Six programs</Heading>
                    <p className="mt-4 text-lg text-white/70">
                        Six initiatives that prove the strongest punch is the one that lifts someone up.
                    </p>
                </Reveal>
                <ul className="grid gap-x-14 border-t border-white/15 md:grid-cols-2">
                    {csrPrograms.map((program, i) => (
                        <Reveal as="li" key={program.title} delay={(i % 2) * 0.06} className="border-b border-white/10 py-8">
                            <h3 className="text-xl font-extrabold text-white md:text-2xl">{program.title}</h3>
                            <p className="mt-3 max-w-[52ch] leading-relaxed text-white/70">{program.description}</p>
                        </Reveal>
                    ))}
                </ul>
            </Section>

            {/* ── Partners: the same lacquer ring as the sponsors page, then the real list ── */}
            <section aria-labelledby="partners-heading">
                <div className="relative h-[52svh] min-h-[320px]">
                    <SceneSlot
                        scene="sponsor-ring"
                        sceneProps={ringProps}
                        className="absolute inset-0"
                        fallback={
                            <div className="absolute inset-0 flex items-center justify-center gap-12 bg-black px-6 opacity-70">
                                {partners.map((p) => (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img key={p.name} src={p.mono} alt="" className="h-8 w-auto md:h-12" />
                                ))}
                            </div>
                        }
                    />
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
                </div>
                <Section rhythm="tight" width="wide" className="bg-black">
                    <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
                        <h2 id="partners-heading" className="text-balance text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.02] tracking-[-0.02em] text-white">
                            Proudly supported by
                        </h2>
                        <BrandLink href="/sponsors" variant="outline">All sponsors</BrandLink>
                    </Reveal>
                    <ul className="grid gap-10 md:grid-cols-3">
                        {partners.map((partner, i) => (
                            <Reveal as="li" key={partner.name} kind="depth" delay={i * 0.08} className="flex flex-col">
                                <a
                                    href={partner.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex aspect-[16/9] items-center justify-center rounded-xl bg-white p-8 transition-transform duration-500 hover:-translate-y-1"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={partner.logo} alt={`${partner.name} logo`} className="max-h-full w-auto object-contain" />
                                </a>
                                <h3 className="mt-6 text-xl font-extrabold text-white">{partner.name}</h3>
                                <p className="mt-1 text-sm font-semibold text-white/70">{partner.tagline}</p>
                                <p className="mt-3 leading-relaxed text-white/70">{partner.description}</p>
                                <p className="mt-3 text-sm text-white/60">{partner.location}</p>
                                <a
                                    href={partner.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-white"
                                >
                                    Visit website <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                                    <span className="sr-only">(opens in a new tab)</span>
                                </a>
                            </Reveal>
                        ))}
                    </ul>
                </Section>
            </section>

            {/* ── How it works: four real steps, in order ── */}
            <Section rhythm="base" width="wide" className="bg-black">
                <Reveal>
                    <Heading>How a partnership works</Heading>
                    <p className="mt-4 text-lg text-white/70">Simple and transparent.</p>
                </Reveal>
                <ol className="mt-12 grid gap-10 border-t border-white/15 pt-10 sm:grid-cols-2 lg:grid-cols-4">
                    {processSteps.map((step, i) => (
                        <Reveal as="li" key={step.step} delay={i * 0.06}>
                            <span className="text-5xl font-black leading-none text-white/20">{step.step}</span>
                            <h3 className="mt-4 text-xl font-extrabold text-white">{step.title}</h3>
                            <p className="mt-2 text-white/70">{step.description}</p>
                        </Reveal>
                    ))}
                </ol>
            </Section>

            {/* ── CTA ── */}
            <Section id="partner" rhythm="open" width="wide" className="scroll-mt-24 bg-black">
                <Reveal kind="mask">
                    <p className="mb-5 text-sm font-semibold text-white/70">We accept CSR contributions</p>
                    <Heading size="display" className="max-w-[12ch] uppercase">
                        Partner with us<span className="text-primary">.</span>
                    </Heading>
                </Reveal>
                <Reveal delay={0.1}>
                    <p className="mt-6 max-w-[56ch] text-pretty text-lg leading-relaxed text-white/75">
                        Your CSR contributions can expand our reach and the programs above. Write to us and we will
                        set out what a partnership involves.
                    </p>
                    <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                        <a
                            href="mailto:kyokushinkarateindia@gmail.com?subject=CSR%20Partnership%20Inquiry"
                            className="inline-flex min-h-12 items-center justify-center gap-2 bg-primary px-7 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                        >
                            <Mail className="h-4 w-4" aria-hidden="true" /> Enquire for CSR
                        </a>
                        <a
                            href="tel:+919956745114"
                            className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/25 px-7 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                        >
                            <Phone className="h-4 w-4" aria-hidden="true" /> Call us
                        </a>
                    </div>
                </Reveal>
            </Section>
        </div>
    );
}
