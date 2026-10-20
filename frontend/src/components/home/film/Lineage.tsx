"use client";

import { useRef } from "react";
import Image, { type StaticImageData } from "next/image";
import ryukoTake from "../../../../public/ryuko-take.png";
import shihanVasant from "../../../../public/shihan-vasant.png";
import { useReduced, useScrollProgress } from "./hooks";
import { body, h2, section, wrap } from "./ui";

const people: { src: StaticImageData; alt: string; name: string; role: string; rank: string; text: string }[] = [
    {
        src: ryukoTake,
        alt: "Daihyo Ryuko Take, President of IKO World Kyokushin Kaikan",
        name: "Daihyo Ryuko Take",
        role: "President, IKO World Kyokushin Kaikan",
        rank: "8th Dan",
        text: "Trained directly under Sosai Masutatsu Oyama from the age of 18. Founded the Kagoshima branch in 1981, now 59 dojos, and today leads IKO World Kyokushin Kaikan.",
    },
    {
        src: shihanVasant,
        alt: "Shihan Vasant Kumar Singh, Country Director for India",
        name: "Shihan Vasant K. Singh",
        role: "Country Director, India",
        rank: "founder of KKFI in 2013",
        text: "Training since 1987, he founded the Kyokushin Karate Foundation of India in 2013 and has grown it to more than 100 dojos across the country.",
    },
];

/**
 * The line of authority, from the Honbu dojo to India: two real portraits
 * joined by a dan-gold hairline that draws as you scroll down it.
 */
export default function Lineage() {
    const list = useRef<HTMLOListElement>(null);
    const line = useRef<HTMLSpanElement>(null);
    const reduced = useReduced();

    useScrollProgress(
        list,
        (p) => {
            if (line.current) line.current.style.transform = `scaleY(${reduced ? 1 : p})`;
        },
        { start: "top 75%", end: "bottom 60%" },
    );

    return (
        <section aria-labelledby="lineage-heading" className={section}>
            <div className={wrap}>
                <h2 id="lineage-heading" className={`${h2} max-w-[20ch]`}>One lineage, from the Honbu dojo to India.</h2>

                <ol ref={list} className="relative mt-14 space-y-20 pl-8 md:mt-20 md:space-y-28 md:pl-16">
                    <span aria-hidden="true" className="absolute bottom-0 left-0 top-0 w-px bg-worn-belt" />
                    <span ref={line} aria-hidden="true" className="absolute bottom-0 left-0 top-0 w-px origin-top bg-dan-gold" style={{ transform: "scaleY(0)" }} />
                    {people.map((person) => (
                        <li key={person.name} className="relative grid gap-8 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:items-end md:gap-14">
                            <span aria-hidden="true" className="absolute -left-8 top-0 h-1.5 w-1.5 -translate-x-[2.5px] rounded-full bg-dan-gold md:-left-16" />
                            <div className="relative aspect-[4/5] w-full max-w-[22rem] overflow-hidden bg-worn-belt">
                                <Image src={person.src} alt={person.alt} fill sizes="(max-width: 768px) 90vw, 22rem" placeholder="blur" className="object-cover object-top grayscale" />
                            </div>
                            <div>
                                <h3 className="font-mincho text-[clamp(1.953rem,3vw,2.441rem)] font-extrabold leading-tight text-canvas">{person.name}</h3>
                                <p className="mt-1 font-gothic text-canvas">{person.role}, {person.rank}</p>
                                <p className={`${body} mt-6`}>{person.text}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
