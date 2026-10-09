"use client";

import { motion } from "framer-motion";
import Image, { type StaticImageData } from "next/image";
import Reveal from "@/components/brand/Reveal";
import Section, { Heading } from "@/components/brand/Section";
import { useTilt } from "@/hooks/useTilt";
// Imported rather than referenced by path so Next can measure them and
// generate a blur placeholder at build time.
import ryukoTake from "../../public/ryuko-take.png";
import shihanVasant from "../../public/shihan-vasant.png";

function Portrait({ src, alt, name, role, rank }: { src: StaticImageData; alt: string; name: string; role: string; rank: string }) {
    const { ref: tiltRef, handlers: tiltHandlers, style: tiltStyle } = useTilt(5);
    return (
        <Reveal kind="depth">
            <motion.figure
                ref={tiltRef as React.Ref<HTMLElement>}
                {...tiltHandlers}
                style={tiltStyle}
                className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-surface"
            >
                <Image
                    src={src}
                    alt={alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    placeholder="blur"
                    className="object-cover object-top grayscale transition-[filter,transform] duration-700 ease-out group-hover:scale-[1.03] group-hover:grayscale-0"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-6 pt-24 md:p-8 md:pt-28">
                    <p className="text-sm font-semibold text-secondary">{rank}</p>
                    <p className="mt-1 text-2xl font-black uppercase leading-tight text-white md:text-3xl">{name}</p>
                    <p className="mt-1 text-sm text-white/70">{role}</p>
                </figcaption>
            </motion.figure>
        </Reveal>
    );
}

/** The line of authority, from the world headquarters to India. */
export default function LeadershipSection() {
    return (
        <Section rhythm="open" width="wide" className="bg-black">
            <Reveal>
                <Heading className="max-w-[20ch]">
                    One lineage, from the Honbu dojo to India<span className="text-primary">.</span>
                </Heading>
            </Reveal>

            <div className="mt-16 grid gap-16 lg:mt-24 lg:grid-cols-2 lg:gap-12">
                <article>
                    <Portrait
                        src={ryukoTake}
                        alt="Daihyo Ryuko Take, President of IKO World Kyokushin Kaikan"
                        name="Daihyo Ryuko Take"
                        role="President, IKO World Kyokushin Kaikan"
                        rank="8th Dan"
                    />
                    <Reveal delay={0.1} className="mt-8 max-w-[56ch] space-y-5 text-lg leading-relaxed text-white/75">
                        <p>
                            Born in Kagoshima Prefecture, he entered the Honbu Dojo at 18 and trained directly
                            under <span className="text-white">Sosai Masutatsu Oyama</span>.
                        </p>
                        <p>
                            Renowned for his tsuki and gedan, he founded a branch dojo in Kagoshima in 1981 that
                            has grown to 59 dojos. Today he leads the International Karate Organization World
                            Kyokushin Kaikan.
                        </p>
                    </Reveal>
                </article>

                {/* Offset down on wide screens: the second generation follows the first. */}
                <article className="lg:mt-40">
                    <Portrait
                        src={shihanVasant}
                        alt="Shihan Vasant Kumar Singh, Country Director for India"
                        name="Shihan Vasant K. Singh"
                        role="Country Director, India"
                        rank="Founder of KKFI, 2013"
                    />
                    <Reveal delay={0.1} className="mt-8 max-w-[56ch] space-y-5 text-lg leading-relaxed text-white/75">
                        <p>
                            <span className="text-white">Shihan Vasant Kumar Singh</span> began training in 1987.
                            Seeing the need for authentic Kyokushin in India, he founded the Kyokushin Karate
                            Foundation of India in 2013.
                        </p>
                        <p>
                            Under his leadership the foundation has grown to{" "}
                            <span className="font-semibold text-white">more than 100 dojos</span> across the
                            country, raising a new generation of strong spirits and disciplined minds.
                        </p>
                    </Reveal>
                </article>
            </div>
        </Section>
    );
}
