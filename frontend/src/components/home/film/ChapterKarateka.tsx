"use client";

import ScrubFilm from "./ScrubFilm";
import ProgressWindow from "./ProgressWindow";
import ChapterMark from "./ChapterMark";
import Callouts from "./Callouts";
import FilmLink from "./FilmLink";
import { karateka, overlay } from "./films";

/**
 * Chapter one, and the hero: the lone karateka. The hero copy holds for the
 * first tenth of the scroll, then the chapter mark and the four callouts; the
 * punch in the last fifth plays with nothing on top.
 */
export default function ChapterKarateka({ onLoadProgress }: { onLoadProgress?: (fraction: number) => void }) {
    return (
        <ScrubFilm film={karateka} label="The karateka" priority bleed onLoadProgress={onLoadProgress}>
            <ProgressWindow show={overlay(karateka, "hero")}>
                <div className="absolute left-4 top-24 flex flex-col items-center gap-4 md:left-10 md:top-28">
                    <span aria-hidden="true" lang="ja" className="font-mincho text-[clamp(2.75rem,min(7vw,8vh),6rem)] font-extrabold leading-none text-canvas [writing-mode:vertical-rl]">
                        極真
                    </span>
                    <span className="font-gothic text-[0.8rem] text-canvas [writing-mode:vertical-rl]">Kyokushin Karate Foundation of India</span>
                </div>

                <div className="absolute inset-x-0 bottom-0 isolate px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:px-10 md:pb-[clamp(2.5rem,9vh,6rem)]">
                    {/* Local scrim: holds the copy at 4.5:1 whatever frame is behind it. */}
                    <span aria-hidden="true" className="absolute -left-[10%] bottom-0 -z-10 h-[130%] w-[110%] bg-[radial-gradient(ellipse_at_10%_100%,rgba(0,0,0,0.85),rgba(0,0,0,0.5)_45%,transparent_75%)] md:w-[75%]" />
                    <h1 className="max-w-[12ch] font-mincho md:max-w-none text-[clamp(3.5rem,9vw,9rem)] font-extrabold leading-[0.95] tracking-[-0.02em] text-canvas">
                        Forge your spirit.
                    </h1>
                    <p className="mt-6 max-w-[46ch] font-gothic text-base leading-[1.6] text-canvas md:text-[1.25rem]">
                        Full-contact karate in the lineage of Sosai Mas Oyama. Discipline, respect, and the relentless pursuit of strength,
                        taught in dojos across India.
                    </p>
                    <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-8">
                        <FilmLink href="/register">Join the dojo</FilmLink>
                        <FilmLink href="/find-a-dojo" variant="quiet">Find a dojo near you</FilmLink>
                    </div>
                </div>
            </ProgressWindow>

            <ProgressWindow show={overlay(karateka, "chapter-mark")} className="pointer-events-none">
                <ChapterMark numeral="一" kanji="空手家" name="The karateka" />
            </ProgressWindow>

            {/* On the static poster the hero copy is up, and the belt label would sit on the H1. */}
            <Callouts callouts={karateka.callouts} reducedSkip={["obi"]} />
        </ScrubFilm>
    );
}
