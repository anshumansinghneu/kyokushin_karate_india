"use client";

import { useRef } from "react";
import { mediaUrl } from "@/lib/media";
import FilmLink from "./FilmLink";
import { useReduced, useScrollProgress } from "./hooks";

/**
 * A child's hands tie a white belt; scroll, and the same knot is a worn black
 * belt in an old man's hands. The crossfade runs across a 200vh pin. Under
 * reduced motion the two stills sit side by side instead.
 */
export default function FinalCta() {
    const section = useRef<HTMLElement>(null);
    const black = useRef<HTMLImageElement>(null);
    const reduced = useReduced();

    useScrollProgress(
        section,
        (p) => {
            // Hold each end a little, so both pictures are seen whole.
            const t = Math.min(1, Math.max(0, (p - 0.15) / 0.6));
            if (black.current) black.current.style.opacity = String(t);
        },
        { enabled: !reduced },
    );

    const copy = (
        <div className="relative isolate px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:px-10 md:pb-[clamp(3rem,10vh,6rem)]">
            <span aria-hidden="true" className="absolute -left-[10%] bottom-0 -z-10 h-[150%] w-[120%] bg-[radial-gradient(ellipse_at_10%_100%,rgba(0,0,0,0.9),rgba(0,0,0,0.55)_45%,transparent_75%)] md:w-[70%]" />
            <h2 className="max-w-[14ch] font-mincho text-[clamp(2.75rem,7vw,6.5rem)] font-extrabold leading-[1] tracking-[-0.02em] text-canvas">
                Every black belt began as a white belt.
            </h2>
            <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-8">
                <FilmLink href="/register">Become a member</FilmLink>
                <FilmLink href="/belt-system" variant="quiet">See the belt path</FilmLink>
            </div>
        </div>
    );

    const still = "absolute inset-0 h-full w-full object-cover";

    if (reduced) {
        return (
            <section aria-label="Become a member" className="relative bg-night">
                <div className="grid md:grid-cols-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaUrl("stills/hands-white.jpg")} alt="A child's hands tying a new white belt" loading="lazy" className="aspect-video w-full object-cover" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaUrl("stills/hands-black.jpg")} alt="An old man's hands tying a worn black belt" loading="lazy" className="aspect-video w-full object-cover" />
                </div>
                <div className="pt-12">{copy}</div>
            </section>
        );
    }

    return (
        <section ref={section} aria-label="Become a member" className="relative h-[200vh] bg-night">
            <div className="sticky top-0 flex h-[100svh] items-end overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl("stills/hands-white.jpg")} alt="A child's hands tying a new white belt" loading="lazy" className={still} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    ref={black}
                    src={mediaUrl("stills/hands-black.jpg")}
                    alt="The same knot years later: an old man's hands tying a worn black belt"
                    loading="lazy"
                    className={still}
                    style={{ opacity: 0 }}
                />
                <div className="relative w-full">{copy}</div>
            </div>
        </section>
    );
}
