"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import type { Layout } from "./geometry";

/**
 * What a film shares with the text and callouts drawn over it. Updates arrive
 * once per animation frame through subscribe(), never through React state, so
 * scrubbing doesn't re-render anything.
 */
export interface FilmFrame {
    p: number;
    layout: Layout;
    width: number;
    height: number;
}

export interface FilmApi {
    subscribe(fn: (frame: FilmFrame) => void): () => void;
    reduced: boolean;
}

export const FilmContext = createContext<FilmApi | null>(null);

export function useFilm(): FilmApi {
    const api = useContext(FilmContext);
    if (!api) throw new Error("useFilm must be used inside <ScrubFilm>");
    return api;
}

/** Runs fn on every film frame, with the latest fn (no resubscribe on render). */
export function useFilmFrame(fn: (frame: FilmFrame) => void) {
    const api = useFilm();
    const fnRef = useRef(fn);
    useEffect(() => {
        fnRef.current = fn;
    });
    useEffect(() => api.subscribe((f) => fnRef.current(f)), [api]);
}
