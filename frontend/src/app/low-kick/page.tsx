"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Reveal from "@/components/brand/Reveal";
import Section, { Heading } from "@/components/brand/Section";
import BrandLink from "@/components/brand/BrandLink";
import SceneSlot from "@/components/three/SceneSlot";

// Stable props: the event's own logo, floating with depth over its own artwork.
const LOGO_SCENE = { logo: "/low-kick-logo-v2.png", backdrop: "/low-kick-source-bg.jpg" };

/** Still composition (reduced motion, slow devices, and before the canvas loads): artwork plus logo, flat. */
function LowKickPoster() {
    return (
        <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/low-kick-source-bg.jpg" alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.15),rgba(0,0,0,0.75)_75%)]" />
            <div className="absolute inset-x-0 top-[13%] flex justify-center md:inset-y-0 md:left-auto md:right-[9vw] md:top-0 md:items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/low-kick-logo-v2.png" alt="" className="w-[min(62vw,19rem)] md:w-[min(30vw,25rem)]" />
            </div>
        </div>
    );
}

/*
 * Low Kick Championship is a partner event with its own brand: the red-and-blue
 * logo and the smoke artwork stay exactly as they are. The page around them
 * follows the KKFI system so it still reads as part of the site.
 */
export default function LowKickPage() {
    return (
        <div className="min-h-screen text-white selection:bg-primary selection:text-white">
            {/* HERO: the event's own artwork and lockup. */}
            <header data-bleed className="relative flex min-h-[100svh] overflow-hidden">
                {/* The official logo floats with real depth over the event artwork, both drawn in 3D;
                    the flat poster underneath is the same artwork and logo, untouched. */}
                <SceneSlot scene="showcase" sceneProps={LOGO_SCENE} className="absolute inset-0" fallback={<LowKickPoster />} />
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
                <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/2 bg-gradient-to-r from-black/60 to-transparent md:block" />

                <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col justify-end px-4 pb-20 pt-[52svh] sm:px-6 md:justify-center md:pt-44 lg:px-8">
                    <div className="max-w-[40rem]">
                        <h1 className="text-[clamp(2.1rem,8.6vw,6rem)] font-black uppercase leading-[0.9] tracking-[-0.03em] text-white">
                            Low kick
                            <span className="block text-primary">Championship</span>
                        </h1>
                        <p className="mt-6 flex items-center gap-4">
                            <span className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold uppercase tracking-[0.15em] text-white">India</span>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/india-flag.png" alt="Flag of India" className="h-8 w-auto md:h-11" />
                        </p>
                        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                            <BrandLink href="/register">Register</BrandLink>
                            <BrandLink href="#founder" variant="outline">The event</BrandLink>
                        </div>
                    </div>
                </div>
            </header>

            {/* FOUNDER */}
            <Section rhythm="open" width="wide" className="bg-black" id="founder">
                <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20">
                    <Reveal kind="depth">
                        <figure className="relative overflow-hidden rounded-xl bg-surface">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/founder-abraham.jpg"
                                alt="Abraham Gallart (centre) with fighters at a Low Kick Championship event"
                                className="aspect-[4/5] w-full object-cover"
                            />
                            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-6 pt-20">
                                <span className="block text-sm font-semibold text-white/70">Founder</span>
                                <span className="mt-1 block text-2xl font-black uppercase text-white md:text-3xl">Abraham Gallart</span>
                            </figcaption>
                        </figure>
                    </Reveal>

                    <div>
                        <Reveal>
                            <Heading className="uppercase">The visionary<span className="text-primary">.</span></Heading>
                        </Reveal>
                        <Reveal delay={0.1} className="mt-8 space-y-6 text-pretty text-lg leading-relaxed text-white/75">
                            <p>
                                <span className="font-bold text-white">Abraham Gallart</span>, born in Valencia in 1974, is passionate about martial arts and combat sports. Throughout his life, he has practiced a wide variety of styles, ranging from Taekwondo, Jiu-Jitsu, Kickboxing, and MMA to Kyokushin Karate.
                            </p>
                            <p>
                                An entrepreneur at heart, he has undertaken projects such as creating a successful surf brand and organizing various combat sports events.
                            </p>
                        </Reveal>
                        <Reveal delay={0.2}>
                            <blockquote className="mt-10 border-t border-white/15 pt-8 text-balance text-[clamp(1.25rem,2.4vw,1.75rem)] font-extrabold leading-snug text-white">
                                &ldquo;Leading a small but highly professional team, Abraham brings us a new, fresh, and original event like few others.&rdquo;
                            </blockquote>
                        </Reveal>
                    </div>
                </div>
            </Section>

            {/* REGISTRATION / REGULATION: the event's two doors, in its own photography. */}
            <Section rhythm="base" width="wide" className="bg-black">
                <div className="grid gap-4 md:grid-cols-2">
                    <Reveal kind="depth">
                        <Link
                            href="/register"
                            className="group relative block h-[clamp(20rem,45vw,32rem)] overflow-hidden rounded-xl bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/registration-bg.jpg"
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                            />
                            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
                            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-8 md:p-10">
                                <span>
                                    <span className="block text-[clamp(2rem,4vw,3rem)] font-black uppercase leading-none tracking-[-0.02em] text-white">Registration</span>
                                    <span aria-hidden="true" className="mt-4 block h-1 w-24 origin-left bg-secondary transition-transform duration-500 group-hover:scale-x-150" />
                                </span>
                                <ArrowUpRight className="h-7 w-7 text-white/70 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white" aria-hidden="true" />
                            </div>
                        </Link>
                    </Reveal>

                    <Reveal kind="depth" delay={0.1}>
                        {/* Not a link: there is no regulations page yet, so it does not pretend to be one. */}
                        <div className="relative h-[clamp(20rem,45vw,32rem)] overflow-hidden rounded-xl bg-surface">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/regulation-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
                            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
                            <div className="absolute inset-x-0 bottom-0 p-8 md:p-10">
                                <span className="block text-[clamp(2rem,4vw,3rem)] font-black uppercase leading-none tracking-[-0.02em] text-white">Regulation</span>
                                <span aria-hidden="true" className="mt-4 block h-1 w-24 bg-primary" />
                            </div>
                        </div>
                    </Reveal>
                </div>
            </Section>
        </div>
    );
}
