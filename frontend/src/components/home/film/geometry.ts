/*
 * One transform for the canvas, the callout anchors and debug clicks, so the
 * callouts stay glued to the body at any crop. Everything is in source pixels
 * of the 1920×1080 frame; the mobile set is its centre 1080×1080 crop.
 */

export type FrameSet = "d" | "m";

export interface Layout {
    /** CSS px per source px. */
    s: number;
    ox: number;
    oy: number;
    /** Source x where the drawn image starts (0 for d, mCropX for m). */
    srcX0: number;
    srcW: number;
    srcH: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function pickSet(w: number, h: number): FrameSet {
    return h > w || w < 768 ? "m" : "d";
}

/** Cover-fit, centred on the focal x when there is one, never past the frame edges. */
export function computeLayout(cw: number, ch: number, set: FrameSet, src: [number, number], mCropX: number, fx?: number): Layout {
    const [sw, sh] = src;
    const srcX0 = set === "m" ? mCropX : 0;
    const srcW = set === "m" ? sh : sw;
    const srcH = sh;
    const s = Math.max(cw / srcW, ch / srcH);
    const dw = srcW * s;
    const ox = fx === undefined ? (cw - dw) / 2 : clamp(cw / 2 - (fx - srcX0) * s, cw - dw, 0);
    return { s, ox, oy: (ch - srcH * s) / 2, srcX0, srcW, srcH };
}

export function toScreen(l: Layout, x: number, y: number) {
    return { x: (x - l.srcX0) * l.s + l.ox, y: y * l.s + l.oy };
}

export function toSource(l: Layout, sx: number, sy: number) {
    return { x: (sx - l.ox) / l.s + l.srcX0, y: (sy - l.oy) / l.s };
}

/** Linear interpolation over keyframes sorted by p, held flat past either end. */
export function interp<K extends { p: number }>(keys: K[], p: number, get: (k: K) => number): number {
    if (p <= keys[0].p) return get(keys[0]);
    for (let i = 1; i < keys.length; i++) {
        if (p <= keys[i].p) {
            const a = keys[i - 1];
            const b = keys[i];
            return get(a) + ((get(b) - get(a)) * (p - a.p)) / (b.p - a.p || 1);
        }
    }
    return get(keys[keys.length - 1]);
}

/**
 * How visible something tied to a progress window is: 1 inside, ramping over
 * `fade` at each edge. A window starting at 0 (or ending at 1) is already fully
 * in at that end, so hero copy is there on arrival.
 */
export function windowAlpha(p: number, [a, b]: [number, number], fade = 0.03): number {
    const fadeIn = a <= 0 ? 1 : clamp((p - a) / fade, 0, 1);
    const fadeOut = b >= 1 ? 1 : clamp((b - p) / fade, 0, 1);
    return Math.min(fadeIn, fadeOut);
}
