"use client";

import ScrubFilm from "./ScrubFilm";
import ProgressWindow from "./ProgressWindow";
import ChapterMark from "./ChapterMark";
import Callouts from "./Callouts";
import { karateka, overlay } from "./films";

/**
 * Chapter one: the lone karateka, after the exhibit. The chapter mark, then the
 * four callouts; the punch in the last fifth plays with nothing on top. (The
 * hero copy and the page's H1 now live in the exhibit.)
 */
export default function ChapterKarateka() {
    return (
        <ScrubFilm film={karateka} label="The karateka">
            <ProgressWindow show={overlay(karateka, "chapter-mark")} className="pointer-events-none">
                <ChapterMark numeral="一" kanji="空手家" name="The karateka" />
            </ProgressWindow>

            {/* On the static poster the hero copy is up, and the belt label would sit on the H1. */}
            <Callouts callouts={karateka.callouts} reducedSkip={["obi"]} />
        </ScrubFilm>
    );
}
