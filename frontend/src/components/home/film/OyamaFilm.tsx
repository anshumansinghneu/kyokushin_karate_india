"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { focusRing } from "./ui";

/*
 * Archive footage of Sosai Oyama, embedded from the uploader's own YouTube channel
 * (Kyokushin International Federation), never copied onto this site. The player loads
 * only when someone presses play, so the page carries no YouTube weight until then.
 */
const VIDEO_ID = "DCBhZbcL9iI";
const TITLE = "Sosai Masutatsu Oyama: archive footage of training and demonstrations";

export default function OyamaFilm() {
    const [playing, setPlaying] = useState(false);

    return (
        <figure className="mt-16 md:mt-24">
            <div className="relative aspect-video w-full overflow-hidden bg-black">
                {playing ? (
                    <iframe
                        src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                        title={TITLE}
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        allowFullScreen
                        className="absolute inset-0 h-full w-full"
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => setPlaying(true)}
                        aria-label={`Play: ${TITLE}`}
                        className={`group absolute inset-0 h-full w-full ${focusRing}`}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover opacity-70 grayscale transition-[opacity,filter] duration-700 ease-dojo group-hover:opacity-90 group-hover:grayscale-0"
                        />
                        <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)]" />
                        <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-canvas/60 bg-black/40 text-canvas backdrop-blur-sm transition-transform duration-500 ease-dojo group-hover:scale-110 md:h-24 md:w-24">
                            <Play className="ml-1 h-8 w-8 fill-current" aria-hidden="true" />
                        </span>
                    </button>
                )}
            </div>
            <figcaption className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 font-gothic text-[0.8rem] text-ash">
                <span>Sosai Oyama in the dojo: archive footage of training and demonstrations.</span>
                <a
                    href={`https://www.youtube.com/watch?v=${VIDEO_ID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`underline decoration-ash/40 underline-offset-4 hover:text-canvas ${focusRing}`}
                >
                    Video: Kyokushin International Federation, on YouTube
                </a>
            </figcaption>
        </figure>
    );
}
