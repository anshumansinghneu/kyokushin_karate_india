import Link from "next/link";
import { ArrowRight } from "lucide-react";

const FRAMES = Array.from({ length: 16 }, (_, i) => `/gallery-thumbs/ring-${String(i + 1).padStart(2, "0")}.jpg`);

/**
 * Real tournament photographs on a slow loop, grey until you look at one.
 * Reuses the existing seamless marquee (two copies, translate -50%); reduced
 * motion turns it into an ordinary scrollable row.
 */
export default function FilmStrip() {
    return (
        <section aria-label="From the gallery" className="relative overflow-hidden bg-black py-[clamp(3rem,7vw,6rem)]">
            <div className="mx-auto mb-8 flex max-w-[1400px] flex-wrap items-end justify-between gap-4 px-4 sm:px-6 lg:px-8">
                <h2 className="text-balance text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.02] tracking-[-0.02em] text-white">
                    On the mats<span className="text-primary">.</span>
                </h2>
                <Link href="/gallery" className="group inline-flex min-h-11 items-center gap-2 font-semibold text-white/75 transition-colors hover:text-white">
                    Open the gallery <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
            </div>
            <div className="kkfi-marquee flex w-max gap-3" style={{ animationDuration: "90s" }}>
                {[...FRAMES, ...FRAMES].map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        key={i}
                        src={src}
                        alt=""
                        aria-hidden={i >= FRAMES.length || undefined}
                        loading="lazy"
                        decoding="async"
                        className="h-[clamp(11rem,22vw,17rem)] w-auto shrink-0 rounded-md object-cover grayscale transition duration-500 hover:grayscale-0"
                    />
                ))}
            </div>
        </section>
    );
}
