"use client";

import ScrubFilm from "./ScrubFilm";
import ProgressWindow from "./ProgressWindow";
import ChapterMark from "./ChapterMark";
import { osu, overlay } from "./films";

/** Builds a line word by word from `start`, each word a step of scroll further on. */
function Words({ text, start }: { text: string; start: number }) {
    return (
        <span className="block">
            {text.split(" ").map((word, i) => (
                <ProgressWindow key={word + i} as="span" show={[start + i * 0.06, 1]} fade={0.04} className="pointer-events-none static inline-block">
                    {word}
                    {"\u00a0"}
                </ProgressWindow>
            ))}
        </span>
    );
}

/** Chapter three: the bow. Full contact, full respect. */
export default function ChapterOsu() {
    return (
        <ScrubFilm film={osu} label="Osu">
            <ProgressWindow show={overlay(osu, "chapter-mark")} className="pointer-events-none">
                <ChapterMark numeral="三" kanji="押忍" name="Osu" />
            </ProgressWindow>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 isolate px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:px-10 md:pb-[clamp(2.5rem,9vh,6rem)]">
                <span aria-hidden="true" className="absolute -left-[10%] bottom-0 -z-10 h-[140%] w-[120%] bg-[radial-gradient(ellipse_at_10%_100%,rgba(0,0,0,0.8),rgba(0,0,0,0.45)_45%,transparent_75%)] md:w-[70%]" />
                <p className="font-mincho text-[clamp(3rem,8vw,7.5rem)] font-extrabold leading-[1] tracking-[-0.02em] text-canvas">
                    <Words text="Full contact." start={overlay(osu, "full-contact")[0]} />
                    <Words text="Full respect." start={overlay(osu, "full-respect")[0]} />
                </p>
            </div>
        </ScrubFilm>
    );
}
