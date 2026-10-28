"use client";

import Link from "next/link";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import IndiaDojoMap from "./IndiaDojoMap";
import { body, focusRing, h2, panelTitle, section, wrap } from "./ui";

const image = "absolute inset-0 h-full w-full object-cover";

/** Three options, not steps, so no numbers. Each panel is one link. */
const paths = [
    {
        title: "Learn the Way",
        text: "Where Kyokushin comes from: Mas Oyama's mountain years, the founding in 1964, and why it is still called the strongest karate.",
        href: "/what-is-kyokushin",
        // eslint-disable-next-line @next/next/no-img-element
        visual: <img src={mediaUrl("stills/mountain.jpg")} alt="" loading="lazy" decoding="async" className={image} />,
    },
    {
        title: "Earn the Belt",
        text: "Every rank from white belt to the dan grades, what each one asks of you, and how long it usually takes.",
        href: "/belt-system",
        // eslint-disable-next-line @next/next/no-img-element
        visual: <img src={mediaUrl("stills/belts.jpg")} alt="" loading="lazy" decoding="async" className={image} />,
    },
    {
        title: "Find your Dojo",
        text: "Official KKFI dojos across India. Choose your city, see who teaches there, and book a first class.",
        href: "/find-a-dojo",
        visual: (
            <IndiaDojoMap
                fallback={
                    // eslint-disable-next-line @next/next/no-img-element
 <img src="/gallery-thumbs/ring-08.jpg" alt="" loading="lazy" decoding="async" className={cn(image, "")} />
                }
            />
        ),
    },
];

export default function ThreeWays() {
    return (
        <section aria-labelledby="three-ways" className={section}>
            <div className={wrap}>
                <h2 id="three-ways" className={h2}>Three ways in.</h2>
                <ul className="mt-12 grid gap-12 md:mt-16 md:grid-cols-3 md:gap-6 lg:gap-10">
                    {paths.map((p) => (
                        <li key={p.href}>
                            <Link href={p.href} className={cn("group block", focusRing)}>
                                <div className="relative aspect-[3/4] overflow-hidden bg-night">{p.visual}</div>
                                <h3 className="mt-6 font-mincho text-[1.953rem] font-extrabold leading-tight text-canvas">
                                    <span className={panelTitle}>{p.title}</span>
                                </h3>
                                <p className={cn(body, "mt-3")}>{p.text}</p>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
