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
        { id: "eyes", kanji: "目", name: "Eyes", text: "Head low, eyes high: stay humble, aim high.", side: "right", show: [0.12, 0.32], track: [{ p: 0.12, x: 950, y: 215 }, { p: 0.32, x: 920, y: 208 }], rise: 40 },
        { id: "ibuki", kanji: "息吹", name: "Ibuki", text: "A slow, forced exhale that braces the body to take a strike.", side: "left", show: [0.25, 0.45], track: [{ p: 0.25, x: 947, y: 460 }, { p: 0.32, x: 945, y: 470 }, { p: 0.45, x: 960, y: 500 }] },
        { id: "seiken", kanji: "正拳", name: "Seiken", text: "Strikes land on the first two knuckles, bare.", side: "right", show: [0.4, 0.62], track: [{ p: 0.4, x: 1005, y: 315 }, { p: 0.45, x: 1015, y: 325 }, { p: 0.55, x: 995, y: 335 }, { p: 0.62, x: 1015, y: 350 }] },
        { id: "obi", kanji: "帯", name: "Obi", text: "The black belt test ends with 20 full-contact fights in a row.", side: "left", show: [0.55, 0.75], track: [{ p: 0.55, x: 910, y: 690 }, { p: 0.62, x: 920, y: 725 }, { p: 0.75, x: 860, y: 795 }] },
    ],
};

export const kumite: Film = {
    name: "kumite",
    pinVh: 350,
    // On a phone only ~500 source px are visible: follow the point of contact.
    focal: [{ p: 0, fx: 975 }, { p: 0.22, fx: 1060 }, { p: 0.32, fx: 1070 }, { p: 0.45, fx: 1000 }, { p: 0.6, fx: 1080 }, { p: 0.75, fx: 1050 }, { p: 1, fx: 975 }],
    overlays: [
        { id: "chapter-mark", show: [0, 0.1] },
        { id: "rules", show: [0.65, 0.95] },
    ],
    callouts: [
        // The kick in the footage lands at body height (chudan), not the head (jodan).
        { id: "chudan", kanji: "中段回し蹴り", name: "Chudan mawashi geri", text: "The roundhouse kick to the body, driven through with the shin.", side: "left", show: [0.2, 0.36], track: [{ p: 0.2, x: 950, y: 455 }, { p: 0.24, x: 970, y: 450 }, { p: 0.3, x: 1020, y: 470 }, { p: 0.36, x: 1000, y: 490 }], rise: 270 },
        { id: "uke", kanji: "受け", name: "Uke", text: "The block. Forearm meets shin.", side: "right", show: [0.26, 0.4], track: [{ p: 0.26, x: 1130, y: 410 }, { p: 0.3, x: 1110, y: 450 }, { p: 0.4, x: 1110, y: 450 }], rise: 150 },
    ],
};

export const osu: Film = {
    name: "osu",
    pinVh: 200,
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
