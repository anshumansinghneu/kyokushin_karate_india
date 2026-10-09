"use client";

import { ArrowRight, ExternalLink, Mail, MapPin } from "lucide-react";
import { useMemo } from "react";
import SceneSlot from "@/components/three/SceneSlot";
import Reveal from "@/components/brand/Reveal";
import Section, { Heading } from "@/components/brand/Section";
import BrandLink from "@/components/brand/BrandLink";

const sponsors = [
    {
        name: "Goldiee Group",
        tagline: "The Epitome of Quality Since 1980",
        description: "One of India's largest producers of quality spices and food products. Founded in 1980, Goldiee Group has grown into a household name with 4000+ employees, 1500+ distributors, and 500,000+ retailers across India. Winner of The Economic Times Best Brands 2020.",
        website: "https://goldiee.com/",
        // Hosted locally: the brand's old remote logo URL now 404s, and the WebGL ring needs same-origin images.
        logo: "/sponsors/goldiee.png",
        mono: "/sponsors/goldiee-mono.png",
        stats: [
            { label: "Founded", value: "1980" },
            { label: "Employees", value: "4000+" },
            { label: "Distributors", value: "1500+" },
            { label: "Products", value: "100+" },
        ],
        achievements: ["ET Best Brands 2020", "FSSAI Certified", "AGMARK Certified", "Govt. Recognized"],
        location: "Kanpur, Uttar Pradesh",
    },
    {
        name: "Frontier Alloys",
        tagline: "Trailblazers in Rolling Stock Components",
        description: "Leading manufacturer of railway rolling stock components including couplers, buffers, bogies, wheels, and draft gears. With 38+ years of service to Indian Railways and state-of-the-art facilities in Kanpur and Paonta Sahib. ISO 9001 & IRIS certified.",
        website: "https://www.frontieralloy.com/",
        logo: "/sponsors/frontier.png",
        mono: "/sponsors/frontier-mono.png",
        stats: [
            { label: "Years of Service", value: "38+" },
            { label: "Facilities", value: "3" },
            { label: "Certifications", value: "ISO/IRIS" },
            { label: "Sector", value: "Railways" },
        ],
        achievements: ["ISO 9001 Certified", "IRIS Certified", "Class A Foundry", "Indian Railways Approved"],
        location: "Kanpur, UP & Paonta Sahib, HP",
    },
    {
        name: "Shri Gang Industries",
        tagline: "Excellence in Distillery & Food Products Since 1990",
        description: "Shri Gang Industries & Allied Products Limited (earlier Suraj Vanaspati Ltd) is a leading manufacturer of Vanaspati, Refined Oils, and operates modern Distillery & Bottling facilities. With ISO certification and a commitment to green initiatives, they deliver quality products with powerful management and timely delivery.",
        website: "https://www.shrigangindustries.com/",
        logo: "/sponsors/shrigang.png",
        mono: "/sponsors/shrigang-mono.png",
        stats: [
            { label: "Founded", value: "1990" },
            { label: "Divisions", value: "4+" },
            { label: "HQ", value: "New Delhi" },
            { label: "Certified", value: "ISO" },
        ],
        achievements: ["ISO Certified", "CSR Committed", "Green Initiatives", "Quality Assured"],
        location: "Sikandrabad, UP & New Delhi",
    },
];

/** Static-tier poster: the same logos, still, in a quiet row. */
function LogoWall() {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-10 px-8 opacity-70 md:translate-x-[18%]">
                {sponsors.map((s) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={s.name} src={s.mono} alt="" className="h-10 w-auto md:h-14" />
                ))}
            </div>
        </div>
    );
}

function SponsorEntry({ sponsor }: { sponsor: (typeof sponsors)[number] }) {
    return (
        <article className="grid gap-10 border-t border-white/15 pt-12 lg:grid-cols-[22rem_1fr] lg:gap-16">
            <Reveal kind="depth">
                {/* Logos keep their real colours, so they sit on a white plate as the brands intend. */}
                <a
                    href={sponsor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex aspect-[16/9] items-center justify-center rounded-xl bg-white p-8 transition-transform duration-500 hover:-translate-y-1"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sponsor.logo} alt={`${sponsor.name} logo`} className="max-h-full w-auto object-contain" />
                </a>
            </Reveal>
            <Reveal delay={0.08}>
                <h2 className="text-[clamp(2rem,4vw,3.25rem)] font-black uppercase leading-[0.95] tracking-[-0.02em] text-white">{sponsor.name}</h2>
                <p className="mt-3 text-lg font-semibold text-white/80">{sponsor.tagline}</p>
                <p className="mt-5 max-w-[62ch] text-pretty leading-relaxed text-white/70">{sponsor.description}</p>

                <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-5">
                    {sponsor.stats.map((stat) => (
                        <div key={stat.label}>
                            <dt className="text-sm text-white/60">{stat.label}</dt>
                            <dd className="mt-1 text-2xl font-black text-white">{stat.value}</dd>
                        </div>
                    ))}
                </dl>

                <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/70">
                    {sponsor.achievements.map((a) => (
                        <li key={a} className="flex items-center gap-2">
                            <span aria-hidden="true" className="h-1 w-1 bg-white/40" />
                            {a}
                        </li>
                    ))}
                </ul>

                <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="flex items-center gap-2 text-sm text-white/60">
                        <MapPin className="h-4 w-4" aria-hidden="true" /> {sponsor.location}
                    </p>
                    <a
                        href={sponsor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/25 px-7 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    >
                        Visit website <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">(opens in a new tab)</span>
                    </a>
                </div>
            </Reveal>
        </article>
    );
}

export default function SponsorsPage() {
    const sceneProps = useMemo(() => ({ logos: sponsors.map((s) => s.mono) }), []);

    return (
        // Transparent so the ring scene shows through from the canvas behind <main>.
        <div className="min-h-screen text-white selection:bg-primary selection:text-white">
            <header data-bleed className="relative flex min-h-[88svh] overflow-hidden">
                <SceneSlot scene="sponsor-ring" sceneProps={sceneProps} className="absolute inset-0" fallback={<LogoWall />} />
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/40 via-35% to-transparent" />
                <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col justify-end px-4 pb-[clamp(3rem,8vh,6rem)] pt-40 sm:px-6 lg:px-8">
                    <h1 className="text-[clamp(2.75rem,8vw,6rem)] font-black uppercase leading-[0.92] tracking-[-0.035em] text-white">
                        Our sponsors<span className="text-primary">.</span>
                    </h1>
                    <p className="mt-6 max-w-[48ch] text-pretty text-lg leading-relaxed text-white/80 md:text-xl">
                        Empowering the spirit of Kyokushin Karate in India. We are honoured to be supported by these
                        industry leaders.
                    </p>
                </div>
            </header>

            <Section rhythm="base" width="base" className="bg-black">
                <div className="space-y-20">
                    {sponsors.map((sponsor) => (
                        <SponsorEntry key={sponsor.name} sponsor={sponsor} />
                    ))}
                </div>
            </Section>

            <Section rhythm="open" width="wide" className="bg-black">
                <Reveal kind="mask">
                    <Heading size="display" className="max-w-[13ch] uppercase">
                        Stand behind the fighters<span className="text-primary">.</span>
                    </Heading>
                </Reveal>
                <Reveal delay={0.1}>
                    <p className="mt-6 max-w-[56ch] text-pretty text-lg leading-relaxed text-white/75">
                        Support the growth of Kyokushin Karate in India and connect with our dedicated community of
                        martial artists, families, and fans across the nation.
                    </p>
                    <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                        <a
                            href="mailto:kyokushinkarateindia@gmail.com"
                            className="inline-flex min-h-12 items-center justify-center gap-2 bg-primary px-7 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                        >
                            <Mail className="h-4 w-4" aria-hidden="true" /> Become a sponsor
                        </a>
                        <BrandLink href="/contact" variant="outline">
                            Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </BrandLink>
                    </div>
                </Reveal>
            </Section>
        </div>
    );
}
