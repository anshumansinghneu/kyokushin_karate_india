import type { FilmName } from "@/lib/media";

/*
 * All scroll-film config in one place (KKFI_REDESIGN.md, 4.5). Coordinates are
 * source pixels on the 1920×1080 frame; progress runs 0 to 1 across the pin.
 * First-pass coordinates read off the real frames (Phase 4); fine-tune with
 * ?debug=1 (click the film to log { p, x, y }).
 */

export type Key = { p: number; x: number; y: number };

export type Callout = {
    id: string;
    kanji: string; // set vertically
    name: string; // romaji, sentence case
    text: string; // one plain sentence
    side: "left" | "right";
    show: [number, number]; // progress window
    track: Key[]; // source px, 1920×1080
    rise?: number; // lift the label this far (source px) above the anchor, into empty space
};

export type Overlay = { id: string; show: [number, number] }; // text tied to progress, content in the component

export type Film = {
    name: FilmName;
    pinVh: number;
    focal?: { p: number; fx: number }[];
    callouts: Callout[];
    overlays: Overlay[];
};

export const karateka: Film = {
    name: "karateka",
    pinVh: 400,
    overlays: [
        { id: "hero", show: [0, 0.1] },
        { id: "chapter-mark", show: [0.1, 0.18] },
    ],
    callouts: [
        { id: "eyes", kanji: "目", name: "Eyes", text: "Head low, eyes high: stay humble, aim high.", side: "right", show: [0.12, 0.32], track: [{ p: 0.12, x: 966, y: 204 }, { p: 0.32, x: 966, y: 200 }], rise: 40 },
        { id: "ibuki", kanji: "息吹", name: "Ibuki", text: "A slow, forced exhale that braces the body to take a strike.", side: "left", show: [0.25, 0.45], track: [{ p: 0.25, x: 984, y: 655 }, { p: 0.45, x: 985, y: 656 }] },
        { id: "seiken", kanji: "正拳", name: "Seiken", text: "Strikes land on the first two knuckles, bare.", side: "right", show: [0.4, 0.62], track: [{ p: 0.4, x: 1041, y: 373 }, { p: 0.62, x: 1042, y: 371 }] },
        { id: "obi", kanji: "帯", name: "Obi", text: "The black belt test ends with 20 full-contact fights in a row.", side: "left", show: [0.55, 0.75], track: [{ p: 0.55, x: 929, y: 763 }, { p: 0.75, x: 929, y: 766 }] },
    ],
};

export const kumite: Film = {
    name: "kumite",
    pinVh: 350,
    // On a phone only ~500 source px are visible: follow the point of contact.
    focal: [{ p: 0, fx: 960 }, { p: 0.2, fx: 1060 }, { p: 0.4, fx: 1060 }, { p: 0.75, fx: 960 }],
    overlays: [
        { id: "chapter-mark", show: [0, 0.1] },
        { id: "rules", show: [0.65, 0.95] },
    ],
    callouts: [
        // The kick lands at body height (chudan), not the head (jodan).
        { id: "chudan", kanji: "中段回し蹴り", name: "Chudan mawashi geri", text: "The roundhouse kick to the body, driven through with the shin.", side: "left", show: [0.2, 0.36], track: [{ p: 0.2, x: 1005, y: 464 }, { p: 0.36, x: 1006, y: 463 }], rise: 270 },
        { id: "uke", kanji: "受け", name: "Uke", text: "The block. Forearm meets shin.", side: "right", show: [0.26, 0.4], track: [{ p: 0.26, x: 1106, y: 413 }, { p: 0.4, x: 1107, y: 411 }], rise: 150 },
    ],
};

export const osu: Film = {
    name: "osu",
    pinVh: 200,
    // On a phone the two fighters sit off either edge: hold on one, then pan to the other.
    focal: [{ p: 0, fx: 620 }, { p: 0.4, fx: 620 }, { p: 0.75, fx: 1330 }, { p: 1, fx: 1330 }],
    overlays: [
        { id: "chapter-mark", show: [0, 0.12] },
        { id: "full-contact", show: [0.2, 1] },
        { id: "full-respect", show: [0.5, 1] },
    ],
    callouts: [],
};

export const eyes: Film = {
    name: "eyes",
    pinVh: 150,
    overlays: [
        { id: "head-low", show: [0.15, 1] },
        { id: "eyes-high", show: [0.3, 1] },
    ],
    callouts: [],
};

export function overlay(film: Film, id: string): [number, number] {
    const o = film.overlays.find((x) => x.id === id);
    if (!o) throw new Error(`${film.name} has no overlay "${id}"`);
    return o.show;
}
