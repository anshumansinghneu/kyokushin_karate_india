"use client";

import { motion, useReducedMotion, useScroll } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import SceneSlot from "@/components/three/SceneSlot";
import KankuMark from "@/components/KankuMark";
import BrandLink from "@/components/brand/BrandLink";

interface HeroProps {
    content: Record<string, { value?: string } | undefined>;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/** Plays a load-in only when the tab is visible; otherwise the copy simply stays put. */
function useIntro() {
    const reduce = useReducedMotion();
    const [phase, setPhase] = useState<"rest" | "hidden" | "shown">("rest");
    useEffect(() => {
        if (reduce || document.visibilityState !== "visible") return;
        let id = requestAnimationFrame(() => {
            setPhase("hidden");
            id = requestAnimationFrame(() => requestAnimationFrame(() => setPhase("shown")));
        });
        return () => cancelAnimationFrame(id);
    }, [reduce]);
    return phase === "rest" ? "shown" : phase;
}

const line = {
    hidden: { clipPath: "inset(0 0 100% 0)", y: "0.35em" },
    shown: { clipPath: "inset(0 0 0% 0)", y: "0em" },
};
const fade = { hidden: { opacity: 0, y: 16 }, shown: { opacity: 1, y: 0 } };

/** Static-tier and pre-load composition: the Kanku at rest over a low red glow. */
function HeroPoster() {
    return (
        <div className="absolute inset-0 bg-black">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(139,0,0,0.4),transparent_55%)]" />
            {/* Centred where the 3D emblem and the intro both put it: 73.5% across, 58vh tall. */}
            <KankuMark className="absolute left-[73.5%] top-1/2 hidden h-[58vh] w-[58vh] -translate-x-1/2 -translate-y-1/2 text-white/80 md:block" />
        </div>
    );
}

export default function HeroSectionV2({ content }: HeroProps) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
    const state = useIntro();

    const videoUrl = content["home_hero_video"]?.value;
    const sceneProps = useMemo(() => ({ progress: scrollYProgress, videoUrl }), [scrollYProgress, videoUrl]);

    return (
        <div ref={ref} className="relative">
            <header data-bleed className="relative flex min-h-[100svh] overflow-hidden">
                <SceneSlot
                    scene="home-hero"
                    sceneProps={sceneProps}
                    className="absolute inset-0"
                    fallback={<HeroPoster />}
                />
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/60 to-transparent" />

                <motion.div
                    initial={false}
                    animate={state}
                    transition={{ staggerChildren: 0.08, delayChildren: 0.05 }}
                    className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col justify-end px-4 pb-[clamp(5rem,12vh,8rem)] pt-40 sm:px-6 lg:px-8"
                >
                    <motion.p
                        variants={fade}
                        transition={{ duration: 0.7, ease: EASE }}
                        className="mb-6 flex items-center gap-3 text-sm font-semibold text-white/75"
                    >
                        <span lang="ja" className="text-2xl font-black text-primary-light">極真</span>
                        <span>Kyokushin Karate Foundation of India</span>
                    </motion.p>

                    <h1 className="text-[clamp(3.25rem,10vw,6rem)] font-black uppercase leading-[0.9] tracking-[-0.035em] text-white">
                        <span className="block overflow-hidden pb-[0.06em]">
                            <motion.span className="block" variants={line} transition={{ duration: 0.8, ease: EASE }}>
                                Forge your
                            </motion.span>
                        </span>
                        <span className="block overflow-hidden pb-[0.06em]">
                            <motion.span className="block" variants={line} transition={{ duration: 0.8, ease: EASE }}>
                                spirit<span className="text-primary">.</span>
                            </motion.span>
                        </span>
                    </h1>

                    <motion.p
                        variants={fade}
                        transition={{ duration: 0.7, ease: EASE }}
                        className="mt-7 max-w-[44ch] text-pretty text-lg leading-relaxed text-white/80 md:text-xl"
                    >
                        Full-contact karate in the lineage of Sosai Mas Oyama. Discipline, respect, and the
                        relentless pursuit of strength, taught in dojos across India.
                    </motion.p>

                    <motion.div
                        variants={fade}
                        transition={{ duration: 0.7, ease: EASE }}
                        className="mt-10 flex flex-col gap-3 sm:flex-row"
                    >
                        <BrandLink href="/register">
                            Join the dojo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </BrandLink>
                        <BrandLink href="/find-a-dojo" variant="outline">
                            Find a dojo near you
                        </BrandLink>
                    </motion.div>
                </motion.div>

                <div aria-hidden="true" className="absolute bottom-8 right-8 z-10 hidden items-center gap-3 text-xs font-semibold text-white/60 md:flex">
                    <span>Est. 1964</span>
                    <span className="h-px w-10 bg-white/30" />
                    <span>Osu no seishin</span>
                </div>
            </header>
        </div>
    );
}
