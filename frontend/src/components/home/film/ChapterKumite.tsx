"use client";

import ScrubFilm from "./ScrubFilm";
import ProgressWindow from "./ProgressWindow";
import ChapterMark from "./ChapterMark";
import Callouts from "./Callouts";
import { kumite, overlay } from "./films";

/** Chapter two: the exchange. The kick, the block, then the rules of the fight. */
export default function ChapterKumite() {
    return (
        <ScrubFilm film={kumite} label="Kumite">
            <ProgressWindow show={overlay(kumite, "chapter-mark")} className="pointer-events-none">
                <ChapterMark numeral="二" kanji="組手" name="Kumite" />
            </ProgressWindow>

            <Callouts callouts={kumite.callouts} />

            <ProgressWindow show={overlay(kumite, "rules")} className="pointer-events-none">
                <div className="absolute inset-x-0 bottom-0 isolate px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:px-10 md:pb-[clamp(2.5rem,9vh,6rem)]">
                    <span aria-hidden="true" className="absolute -left-[10%] bottom-0 -z-10 h-[140%] w-[120%] bg-[radial-gradient(ellipse_at_10%_100%,rgba(0,0,0,0.85),rgba(0,0,0,0.5)_45%,transparent_75%)] md:w-[70%]" />
                    <p className="max-w-[24ch] font-mincho text-[clamp(1.563rem,3.2vw,2.441rem)] font-medium leading-[1.25] text-canvas">
                        Bare knuckles to the body. Kicks to the legs, body and head. No punches to the face.
                    </p>
                </div>
            </ProgressWindow>
        </ScrubFilm>
    );
}
