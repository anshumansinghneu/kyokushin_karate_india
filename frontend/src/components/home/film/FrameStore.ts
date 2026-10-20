/*
 * Loads one film's frames and keeps memory bounded (KKFI_REDESIGN.md, 4.4).
 * Every frame stays an HTMLImageElement (compressed in memory); only a sliding
 * window of about 24 frames around the playhead is held decoded as ImageBitmap.
 * Decoding all 192 frames at 1600×900 would take about 1 GB.
 */

const CONCURRENCY = 6;
const AHEAD = 16;
const BEHIND = 8;
const KEEP = 28;

export class FrameStore {
    readonly count: number;
    loadedCount = 0;
    /** Called whenever a frame finishes loading. */
    onLoad: ((index: number) => void) | null = null;

    private imgs: (HTMLImageElement | null)[];
    private loaded: Uint8Array;
    private bitmaps = new Map<number, ImageBitmap>();
    private decoding = new Set<number>();
    private queue: number[] = [];
    private active = 0;
    private started = false;
    private destroyed = false;
    private lastFocus = -100;

    constructor(private urlFor: (index: number) => string, count: number) {
        this.count = count;
        this.imgs = new Array(count).fill(null);
        this.loaded = new Uint8Array(count);
    }

    /**
     * Coarse to fine: every 8th frame first, then every 4th, 2nd, 1st, so the
     * whole film scrubs (roughly) long before every frame is in. Frames around
     * `focus` jump the queue.
     */
    start(focus = 0) {
        if (this.started || this.destroyed) return;
        this.started = true;
        const order: number[] = [];
        const seen = new Uint8Array(this.count);
        for (const stride of [8, 4, 2, 1]) {
            for (let i = 0; i < this.count; i += stride) {
                if (!seen[i]) {
                    seen[i] = 1;
                    order.push(i);
                }
            }
        }
        this.queue = order;
        this.prioritize(focus);
        this.pump();
    }

    /** Pull the frames around the playhead to the front of the queue. */
    prioritize(focus: number) {
        if (!this.started || Math.abs(focus - this.lastFocus) < 6) return;
        this.lastFocus = focus;
        const near = new Set<number>();
        for (let d = -BEHIND; d <= AHEAD; d++) {
            const i = focus + d;
            if (i >= 0 && i < this.count && !this.loaded[i]) near.add(i);
        }
        this.queue = [...near, ...this.queue.filter((i) => !near.has(i))];
    }

    /** Share of frames loaded, 0 to 1 (drives the preloader). */
    fraction(): number {
        return this.loadedCount / this.count;
    }

    isLoaded(i: number): boolean {
        return this.loaded[i] === 1;
    }

    /**
     * The best thing to draw for frame i: its bitmap, the element itself, or
     * failing that the nearest loaded frame, so the canvas never goes blank.
     */
    pick(i: number): CanvasImageSource | null {
        const exact = this.bitmaps.get(i) ?? (this.loaded[i] ? this.imgs[i] : null);
        if (exact) return exact;
        for (let d = 1; d < this.count; d++) {
            for (const j of [i - d, i + d]) {
                if (j < 0 || j >= this.count) continue;
                const src = this.bitmaps.get(j) ?? (this.loaded[j] ? this.imgs[j] : null);
                if (src) return src;
            }
        }
        return null;
    }

    /** Keep decoded bitmaps for the frames around i, biased in the scroll direction. */
    updateWindow(i: number, dir: number) {
        if (typeof createImageBitmap !== "function") return;
        const lo = Math.max(0, i - (dir >= 0 ? BEHIND : AHEAD));
        const hi = Math.min(this.count - 1, i + (dir >= 0 ? AHEAD : BEHIND));
        for (let j = lo; j <= hi; j++) {
            const img = this.imgs[j];
            if (!this.loaded[j] || !img || this.bitmaps.has(j) || this.decoding.has(j)) continue;
            this.decoding.add(j);
            createImageBitmap(img)
                .then((bmp) => {
                    this.decoding.delete(j);
                    if (this.destroyed) bmp.close();
                    else this.bitmaps.set(j, bmp);
                })
                .catch(() => this.decoding.delete(j));
        }
        for (const [j, bmp] of this.bitmaps) {
            if (Math.abs(j - i) > KEEP) {
                bmp.close();
                this.bitmaps.delete(j);
            }
        }
    }

    destroy() {
        this.destroyed = true;
        this.queue = [];
        this.onLoad = null;
        this.bitmaps.forEach((b) => b.close());
        this.bitmaps.clear();
        for (const img of this.imgs) {
            if (img && !img.complete) img.src = "";
        }
    }

    private pump() {
        while (!this.destroyed && this.active < CONCURRENCY && this.queue.length) {
            const i = this.queue.shift()!;
            if (this.loaded[i] || this.imgs[i]) continue;
            this.active++;
            const img = new Image();
            img.decoding = "async";
            this.imgs[i] = img;
            const done = (ok: boolean) => {
                this.active--;
                if (this.destroyed) return;
                if (ok) {
                    this.loaded[i] = 1;
                    this.loadedCount++;
                    this.onLoad?.(i);
                } else {
                    this.imgs[i] = null;
                }
                this.pump();
            };
            img.onload = () => done(true);
            img.onerror = () => done(false);
            img.src = this.urlFor(i);
        }
    }
}
