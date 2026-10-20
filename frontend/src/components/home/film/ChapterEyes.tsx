"use client";

import { useRef } from "react";
import ScrubFilm from "./ScrubFilm";
import ProgressWindow from "./ProgressWindow";
import { useFilmFrame } from "./FilmContext";
import { interp, toScreen } from "./geometry";
import { eyes, overlay } from "./films";

// Where his eyes sit in the frame (source px), so the line can frame them at any crop.
const EYE_LINE = [
    { p: 0, y: 330 },
    { p: 0.6, y: 330 },
    { p: 1, y: 360 },
];

/** Positions the two halves of the line just above and just below the eyes. */
function FramedLine() {
    const top = useRef<HTMLDivElement>(null);
    const bottom = useRef<HTMLDivElement>(null);

    useFilmFrame(({ p, layout, height }) => {
        const y = toScreen(layout, 960, interp(EYE_LINE, p, (k) => k.y)).y;
        const gap = Math.max(40, height * 0.1);
        if (top.current) top.current.style.transform = `translate3d(0, ${y - gap}px, 0) translateY(-100%)`;
        if (bottom.current) bottom.current.style.transform = `translate3d(0, ${y + gap}px, 0)`;
    });

    const line = "font-mincho text-[clamp(2.75rem,8.5vw,8.5rem)] font-extrabold leading-[0.95] tracking-[-0.02em] text-canvas [text-shadow:0_0_40px_rgba(0,0,0,0.7)]";
    return (
        <>
            <div ref={top} className="absolute inset-x-0 top-0 px-4 md:px-10">
                <ProgressWindow show={overlay(eyes, "head-low")} className="pointer-events-none static">
                    <p className={line}>Keep your head low,</p>
                </ProgressWindow>
            </div>
            <div ref={bottom} className="absolute inset-x-0 top-0 px-4 md:px-10">
                <ProgressWindow show={overlay(eyes, "eyes-high")} className="pointer-events-none static">
                    <p className={line}>eyes high.</p>
                </ProgressWindow>
            </div>
        </>
    );
}

/** "Keep your head low, eyes high." set around the eyes themselves. */
export default function ChapterEyes() {
    return (
        <ScrubFilm film={eyes} label="Keep your head low, eyes high">
            <FramedLine />
        </ScrubFilm>
    );
}
