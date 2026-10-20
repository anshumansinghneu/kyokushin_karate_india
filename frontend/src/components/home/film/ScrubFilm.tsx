"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { onLenis } from "@/lib/lenis";
import { frameUrl, loadManifest, mediaUrl, type MediaManifest } from "@/lib/media";
import staticManifest from "../../../../public/media/manifest.json";
import { FilmContext, type FilmApi, type FilmFrame } from "./FilmContext";
import { FrameStore } from "./FrameStore";
import { computeLayout, interp, pickSet, toSource, type FrameSet, type Layout } from "./geometry";
import type { Film } from "./films";
import { useReduced } from "./hooks";

gsap.registerPlugin(ScrollTrigger);

const noSubscribe = () => () => {};
const readDebug = () => new URLSearchParams(window.location.search).get("debug") === "1";

/**
 * A film whose playhead is the scrollbar (KKFI_REDESIGN.md, 4.4). The section
 * is pinVh tall; inside it a 100svh stage sticks to the top while the frame
 * index follows scroll progress. Sticky rather than ScrollTrigger's fixed pin:
 * PageTransition leaves a filter on an ancestor, which breaks position: fixed.
 */
export default function ScrubFilm({
    film,
    label,
    priority = false,
    bleed = false,
    onLoadProgress,
    children,
}: {
    film: Film;
    /** Accessible name for the section. */
    label: string;
    /** The first film: poster is the LCP image and frames load immediately. */
    priority?: boolean;
    /** Opens the page full-bleed (main drops its navbar padding). */
    bleed?: boolean;
    onLoadProgress?: (fraction: number) => void;
    children?: ReactNode;
}) {
    const sectionRef = useRef<HTMLElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const posterRef = useRef<HTMLImageElement>(null);
    const hudRef = useRef<HTMLDivElement>(null);
    const listeners = useRef(new Set<(f: FilmFrame) => void>());
    const progressCb = useRef(onLoadProgress);
    const reduced = useReduced();
    const debug = useSyncExternalStore(noSubscribe, readDebug, () => false);

    useEffect(() => {
        progressCb.current = onLoadProgress;
    });

    const api = useMemo<FilmApi>(
        () => ({
            subscribe(fn) {
                listeners.current.add(fn);
                return () => {
                    listeners.current.delete(fn);
                };
            },
            reduced,
        }),
        [reduced],
    );

    useEffect(() => {
        const section = sectionRef.current;
        const stage = stageRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d", { alpha: false });
        if (!section || !stage || !canvas || !ctx) return;

        let manifest: MediaManifest | null = null;
        let set: FrameSet = pickSet(window.innerWidth, window.innerHeight);
        let store: FrameStore | null = null;
        // While a new frame set loads after a resize, keep drawing from the old one.
        let fallback: { store: FrameStore; set: FrameSet } | null = null;
        let w = 0;
        let h = 0;
        let dpr = 1;
        let p = 0;
        let lastIndex = -1;
        let dir = 1;
        let raf = 0;
        let started = priority && !reduced;
        let drew = false;
        let layout: Layout | null = null;

        const target = () => (store ? Math.round(p * (store.count - 1)) : 0);
        const schedule = () => {
            if (!raf) raf = requestAnimationFrame(tick);
        };

        const makeStore = (focus: number) => {
            if (!manifest) return;
            const n = manifest.films[film.name]?.[set] ?? 0;
            if (!n) return;
            const m = manifest;
            const s = new FrameStore((i) => frameUrl(m, film.name, set, i + 1), n);
            s.onLoad = (i) => {
                progressCb.current?.(s.fraction());
                if (i === target() || !drew) schedule();
            };
            store = s;
            if (started) s.start(focus);
        };

        const draw = (src: CanvasImageSource, l: Layout) => {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(src, l.ox, l.oy, l.srcW * l.s, l.srcH * l.s);
            if (!drew && posterRef.current) posterRef.current.style.opacity = "0";
            drew = true;
        };

        function tick() {
            raf = 0;
            if (!manifest || !w) return;
            const fx = film.focal ? interp(film.focal, p, (k) => k.fx) : undefined;
            const l = computeLayout(w, h, set, manifest.src, manifest.mCropX, fx);
            layout = l;
            if (store && started) {
                const i = target();
                if (i !== lastIndex) {
                    dir = i > lastIndex ? 1 : -1;
                    lastIndex = i;
                    store.prioritize(i);
                }
                store.updateWindow(i, dir);
                const src = store.pick(i);
                if (src) {
                    draw(src, l);
                    if (fallback) {
                        fallback.store.destroy();
                        fallback = null;
                    }
                } else if (fallback) {
                    const old = fallback.store.pick(Math.round(p * (fallback.store.count - 1)));
                    if (old) draw(old, computeLayout(w, h, fallback.set, manifest.src, manifest.mCropX, fx));
                }
            }
            const frame: FilmFrame = { p, layout: l, width: w, height: h };
            listeners.current.forEach((fn) => fn(frame));
            if (hudRef.current) {
                hudRef.current.textContent = `p ${p.toFixed(3)}   frame ${Math.max(lastIndex, 0) + 1}/${store?.count ?? "?"}   ${set}   loaded ${store?.loadedCount ?? 0}`;
            }
        }

        const resize = () => {
            const r = stage.getBoundingClientRect();
            w = r.width;
            h = r.height;
            dpr = Math.min(2, window.devicePixelRatio || 1);
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            drew = false;
            const next = pickSet(w, h);
            if (manifest && next !== set) {
                fallback?.store.destroy();
                fallback = store ? { store, set } : null;
                set = next;
                makeStore(Math.max(lastIndex, 0));
            }
            schedule();
        };
        const ro = new ResizeObserver(resize);
        ro.observe(stage);

        // Films after the first start loading one viewport before they arrive.
        const io = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting || started || reduced) return;
                started = true;
                store?.start(Math.max(lastIndex, 0));
                io.disconnect();
            },
            { rootMargin: "100% 0px 100% 0px" },
        );
        if (!started && !reduced) io.observe(section);

        const st = reduced
            ? null
            : ScrollTrigger.create({
                  trigger: section,
                  start: "top top",
                  end: "bottom bottom",
                  onUpdate: (self) => {
                      p = self.progress;
                      schedule();
                  },
              });
        p = st?.progress ?? 0;

        let offScroll: (() => void) | undefined;
        const offLenis = onLenis((lenis) => {
            offScroll?.();
            offScroll = lenis?.on("scroll", ScrollTrigger.update);
        });

        // ?debug=1: click the film to log { p, x, y } in source pixels for authoring tracks.
        const onClick = (e: MouseEvent) => {
            if (!debug || !layout) return;
            const r = stage.getBoundingClientRect();
            const s = toSource(layout, e.clientX - r.left, e.clientY - r.top);
            console.log({ film: film.name, p: +p.toFixed(3), x: Math.round(s.x), y: Math.round(s.y) });
        };
        stage.addEventListener("click", onClick);

        let disposed = false;
        loadManifest()
            .then((m) => {
                if (disposed) return;
                manifest = m;
                makeStore(0);
                schedule();
            })
            .catch((err) => console.warn("scroll film:", err));

        return () => {
            disposed = true;
            cancelAnimationFrame(raf);
            st?.kill();
            ro.disconnect();
            io.disconnect();
            offLenis();
            offScroll?.();
            stage.removeEventListener("click", onClick);
            store?.destroy();
            fallback?.store.destroy();
        };
    }, [film, priority, reduced, debug]);

    const poster = (set: FrameSet) => mediaUrl(`seq/${film.name}/${set}/0001.${staticManifest.ext}`);

    return (
        <section
            ref={sectionRef}
            aria-label={label}
            data-bleed={bleed || undefined}
            data-film={film.name}
            className="relative bg-night"
            style={{ height: reduced ? undefined : `${film.pinVh}vh` }}
        >
            <div ref={stageRef} className={`${reduced ? "relative" : "sticky top-0"} h-[100svh] overflow-hidden`}>
                <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
                <picture>
                    <source media="(orientation: portrait), (max-width: 767px)" srcSet={poster("m")} />
                    <img
                        ref={posterRef}
                        src={poster("d")}
                        alt=""
                        aria-hidden="true"
                        fetchPriority={priority ? "high" : "auto"}
                        loading={priority ? "eager" : "lazy"}
                        decoding="async"
                        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                    />
                </picture>
                <FilmContext.Provider value={api}>{children}</FilmContext.Provider>
                {debug && (
                    <div
                        ref={hudRef}
                        className="pointer-events-none absolute bottom-24 right-4 z-20 bg-night/80 px-3 py-2 font-gothic text-xs text-dan-gold"
                    />
                )}
            </div>
        </section>
    );
}
