"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MosaicTile from "./MosaicTile";
import type { GalleryPhoto } from "@/app/gallery/page";

interface HeroMosaicProps {
    pool: GalleryPhoto[];
    /** Pause swap timer when true (e.g., lightbox open). */
    paused: boolean;
    onTileClick: (photoId: string) => void;
    /** Called whenever the tile selection changes, so siblings (e.g. marquee) can avoid rendering duplicates. */
    onTileIdsChange?: (ids: string[]) => void;
}

const DESKTOP_TILE_COUNT = 6;
const MOBILE_TILE_COUNT = 4;
const SWAP_INTERVAL_MS = 5000;

/** Layout: 3 columns × 3 rows. Tile 1 is large (col 1-2, row 1-2). */
const DESKTOP_GRID_AREAS: Array<{ col: string; row: string }> = [
    { col: '1 / span 2', row: '1 / span 2' }, // tile 1 (large)
    { col: '3', row: '1' },                   // tile 2
    { col: '3', row: '2' },                   // tile 3
    { col: '3', row: '3' },                   // tile 4
    { col: '1', row: '3' },                   // tile 5
    { col: '2', row: '3' },                   // tile 6
];

/** Mobile layout: 3 columns × 2 rows. Tile 1 spans top row; tiles 2-4 fill bottom row. */
const MOBILE_GRID_AREAS: Array<{ col: string; row: string }> = [
    { col: '1 / span 3', row: '1' }, // tile 1 (large)
    { col: '1', row: '2' },          // tile 2
    { col: '2', row: '2' },          // tile 3
    { col: '3', row: '2' },          // tile 4
];

function shuffle<T>(arr: T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/** Pick `count` items from pool, weighted ~3:1 toward photos. */
function pickWeighted(pool: GalleryPhoto[], count: number): GalleryPhoto[] {
    const photos = shuffle(pool.filter(p => p.mediaType === 'IMAGE'));
    const videos = shuffle(pool.filter(p => p.mediaType === 'VIDEO'));
    const targetVideos = Math.min(videos.length, Math.max(1, Math.floor(count / 4)));
    const targetPhotos = count - targetVideos;
    const chosen = [...photos.slice(0, targetPhotos), ...videos.slice(0, targetVideos)];
    return shuffle(chosen).slice(0, count);
}

export default function HeroMosaic({ pool, paused, onTileClick, onTileIdsChange }: HeroMosaicProps) {
    const [isMobile, setIsMobile] = useState(false);
    const tileCount = isMobile ? MOBILE_TILE_COUNT : DESKTOP_TILE_COUNT;
    const gridAreas = isMobile ? MOBILE_GRID_AREAS : DESKTOP_GRID_AREAS;

    // Track viewport — listen to media query
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(max-width: 767px)');
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    const [tiles, setTiles] = useState<GalleryPhoto[]>([]);
    const usedIdsRef = useRef<Set<string>>(new Set());

    // Initialize tiles when pool changes or tileCount changes
    useEffect(() => {
        if (pool.length === 0) { setTiles([]); usedIdsRef.current.clear(); return; }
        const initial = pickWeighted(pool, tileCount);
        setTiles(initial);
        usedIdsRef.current = new Set(initial.map(t => t.id));
    }, [pool, tileCount]);

    // Notify parent of current tile IDs whenever they change
    useEffect(() => {
        onTileIdsChange?.(tiles.map(t => t.id));
    }, [tiles, onTileIdsChange]);

    // Swap timer
    useEffect(() => {
        if (paused || tiles.length === 0 || pool.length <= tiles.length) return;
        const interval = setInterval(() => {
            setTiles(current => {
                if (current.length === 0) return current;
                // Pick 2 distinct tile indices to swap
                const i1 = Math.floor(Math.random() * current.length);
                let i2 = Math.floor(Math.random() * current.length);
                if (current.length > 1) while (i2 === i1) i2 = Math.floor(Math.random() * current.length);

                // Find an unused (or least-recently-used) item from pool
                const inUse = new Set(current.map(t => t.id));
                const candidates = pool.filter(p => !inUse.has(p.id));
                if (candidates.length === 0) return current;

                const next = current.slice();
                next[i1] = candidates[Math.floor(Math.random() * candidates.length)];
                if (i1 !== i2) {
                    const remaining = candidates.filter(c => c.id !== next[i1].id);
                    if (remaining.length > 0) {
                        next[i2] = remaining[Math.floor(Math.random() * remaining.length)];
                    }
                }
                return next;
            });
        }, SWAP_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [pool, tiles.length, paused]);

    // Pick exactly one tile to be the active video (the first VIDEO-mediaType tile in current selection)
    const activeVideoId = useMemo(() => {
        const firstVideo = tiles.find(t => t.mediaType === 'VIDEO');
        return firstVideo?.id ?? null;
    }, [tiles]);

    if (tiles.length === 0) {
        return (
            <div className="w-full h-[80vh] md:h-[80vh] flex items-center justify-center bg-zinc-950 border-y border-white/5">
                <p className="text-zinc-500 text-sm">No memories yet — be the first to upload.</p>
            </div>
        );
    }

    return (
        <div className="relative w-full">
            <div
                className="grid w-full"
                style={{
                    gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : '2fr 2fr 1.4fr',
                    gridTemplateRows: isMobile ? '2fr 1fr' : 'repeat(3, 1fr)',
                    gap: '12px',
                    height: isMobile ? '60vh' : '80vh',
                    padding: '12px',
                }}
            >
                {tiles.map((photo, i) => (
                    <div key={`slot-${i}`} style={{ gridColumn: gridAreas[i].col, gridRow: gridAreas[i].row }}>
                        <MosaicTile
                            photo={photo}
                            isActiveVideo={photo.id === activeVideoId}
                            phaseIndex={i}
                            onClick={() => onTileClick(photo.id)}
                        />
                    </div>
                ))}
            </div>

            {/* Title overlay */}
            <div className="pointer-events-none absolute bottom-0 left-0 p-4 md:p-8 lg:p-12 max-w-4xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent rounded-tr-[100px] pointer-events-none" />
                <h1
                    className="relative font-black tracking-tighter uppercase leading-[0.9] drop-shadow-2xl"
                    style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)' }}
                >
                    <span className="text-white">THE </span>
                    <span
                        className="drop-shadow-[0_4px_25px_rgba(220,38,38,0.4)]"
                        style={{
                            background: 'linear-gradient(180deg, #ef4444, #991b1b)',
                            WebkitBackgroundClip: 'text',
                            backgroundClip: 'text',
                            color: 'transparent',
                        }}
                    >DOJO</span>
                    <span className="text-white"> WALL</span>
                </h1>
            </div>
        </div>
    );
}
