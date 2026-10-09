"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, ChevronRight, ChevronLeft, X, Download, Share2, ExternalLink, ArrowRight,
} from "lucide-react";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/imageUtils";
import VideoPlayer from "@/components/gallery/VideoPlayer";
import DojoWall from "@/components/gallery/DojoWall";
import MarqueeStrip from "@/components/gallery/MarqueeStrip";
import SceneSlot from "@/components/three/SceneSlot";
import Section, { Heading } from "@/components/brand/Section";
import Reveal from "@/components/brand/Reveal";
import BrandLink from "@/components/brand/BrandLink";
import { useDeviceTier } from "@/hooks/useDeviceTier";

interface Album {
    id: string;
    name: string;
    description: string | null;
    coverImageUrl: string | null;
    type: string;
    isPinned: boolean;
    date: string | null;
    photoCount: number;
    creator: { id: string; name: string };
    event: { id: string; name: string } | null;
}

type AlbumFilter = "ALL" | "CAMP" | "SEMINAR" | "TOURNAMENT" | "BELT_EXAM" | "TRAINING" | "GENERAL";

const ALBUM_TYPE_LABEL: Record<string, string> = {
    CAMP: "Camp",
    SEMINAR: "Seminar",
    TOURNAMENT: "Tournament",
    BELT_EXAM: "Grading",
    TRAINING: "Training",
    GENERAL: "General",
};

/** Web-sized prints of real KKFI tournament photographs for the 3D ring (≈30 KB each). */
const RING_IMAGES = Array.from({ length: 16 }, (_, i) => `/gallery-thumbs/ring-${String(i + 1).padStart(2, "0")}.jpg`);
const RING_STEP = (Math.PI * 2) / RING_IMAGES.length;

export type MediaType = 'IMAGE' | 'VIDEO';

export interface GalleryPhoto {
    id: string;
    imageUrl: string;
    caption: string | null;
    uploadedAt: string;
    isPublicFeatured: boolean;
    uploader: { id: string; name: string };
    event: { id: string; name: string } | null;
    dojo: { id: string; name: string } | null;
    mediaType: MediaType;
    videoUrl: string | null;
    videoProvider: string | null;
    videoId: string | null;
    duration: number | null;
}

const formatAlbumDate = (date: string | null) =>
    date ? new Date(date).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : null;

// ----------------------------------------------------------------------
// Hero: a ring of photographs the visitor turns by dragging
// ----------------------------------------------------------------------

/** Static-tier and pre-load composition: five prints fanned in perspective. */
function RingPoster() {
    const fan = [RING_IMAGES[3], RING_IMAGES[6], RING_IMAGES[0], RING_IMAGES[9], RING_IMAGES[12]];
    return (
        <div className="absolute inset-0 flex items-start justify-center overflow-hidden bg-black pt-[18svh] md:pt-[22svh]">
            <div className="flex items-center gap-3" style={{ perspective: "1100px", transformStyle: "preserve-3d" }}>
                {fan.map((src, i) => {
                    const offset = i - 2;
                    return (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            key={src}
                            src={src}
                            alt=""
                            className={`aspect-[16/10] w-[36vw] max-w-[360px] rounded-sm object-cover md:w-[22vw] ${offset === 0 ? "" : "grayscale"}`}
                            style={{
                                transform: `rotateY(${-offset * 24}deg) translateZ(${-Math.abs(offset) * 90}px)`,
                                opacity: offset === 0 ? 1 : 0.45 - Math.abs(offset) * 0.08,
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
}

/** Target ring angle. The scene reads `current` every frame; changing it never re-renders. */
class SpinTarget {
    current = 0;
    add(radians: number) {
        this.current += radians;
    }
}

function GalleryHero({ photoCount }: { photoCount: number }) {
    // The ring only turns when the 3D scene runs; the still poster gets no drag affordance.
    const tier = useDeviceTier();
    const interactive = tier !== null && tier !== "static";
    // A stable object the scene reads every frame; writing to it never re-renders.
    const [spin] = useState(() => new SpinTarget());
    const drag = useRef<{ x: number; t: number; v: number } | null>(null);
    const sceneProps = useMemo(() => ({ images: RING_IMAGES, spin }), [spin]);

    const onPointerDown = (e: React.PointerEvent) => {
        drag.current = { x: e.clientX, t: performance.now(), v: 0 };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: React.PointerEvent) => {
        const d = drag.current;
        if (!d) return;
        const now = performance.now();
        const dx = e.clientX - d.x;
        spin.add(dx * 0.006);
        d.v = dx / Math.max(1, now - d.t);
        d.x = e.clientX;
        d.t = now;
    };
    const onPointerUp = () => {
        const d = drag.current;
        // A flick carries the ring on a little further.
        if (d) spin.add(Math.max(-1.5, Math.min(1.5, d.v * 0.9)));
        drag.current = null;
    };

    return (
        <header data-bleed className="relative flex min-h-[100svh] overflow-hidden">
            <SceneSlot scene="gallery-ring" sceneProps={sceneProps} className="absolute inset-0" fallback={<RingPoster />} />
            {/* Drag surface. pan-y keeps vertical page scrolling on touch screens. */}
            {interactive && <div
                aria-hidden="true"
                className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
            />}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black via-black/70 to-transparent" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/80 to-transparent" />

            <div className="pointer-events-none relative z-10 mx-auto flex w-full max-w-[1400px] flex-col justify-end px-4 pb-[clamp(3rem,9vh,6rem)] pt-40 sm:px-6 lg:px-8">
                <h1 className="max-w-[12ch] text-balance text-[clamp(2.75rem,8vw,6rem)] font-black uppercase leading-[0.92] tracking-[-0.035em] text-white">
                    The dojo, in pictures<span className="text-primary">.</span>
                </h1>
                <div className="mt-6 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                    <p className="max-w-[44ch] text-pretty text-lg leading-relaxed text-white/80 md:text-xl">
                        {photoCount > 0 ? `${photoCount} photographs` : "Photographs"} from camps, gradings and
                        tournaments across India.{interactive && " Drag the ring to turn it."}
                    </p>
                    <div className="pointer-events-auto flex flex-wrap items-center gap-3">
                        {interactive && (<>
                        <button
                            type="button"
                            aria-label="Turn the ring left"
                            onClick={() => spin.add(RING_STEP)}
                            className="flex h-12 w-12 items-center justify-center border border-white/25 text-white transition-colors hover:bg-white/10"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            aria-label="Turn the ring right"
                            onClick={() => spin.add(-RING_STEP)}
                            className="flex h-12 w-12 items-center justify-center border border-white/25 text-white transition-colors hover:bg-white/10"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                        </>)}
                        <BrandLink href="/gallery/all">
                            Every photo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </BrandLink>
                    </div>
                </div>
            </div>
        </header>
    );
}

// ----------------------------------------------------------------------
// Albums: an editorial index, the first one given the room of a feature
// ----------------------------------------------------------------------

/**
 * Opening an album: the cover grows to fill the screen before the route
 * changes, and the album page opens on that same cover, so it reads as one
 * continuous move. Reduced motion skips straight to navigation.
 */
function useAlbumOpen() {
    const router = useRouter();
    const [opening, setOpening] = useState<{ id: string; src: string; rect: DOMRect } | null>(null);
    const open = useCallback(
        (e: React.MouseEvent, album: Album, cover: HTMLElement | null) => {
            const src = album.coverImageUrl ? getImageUrl(album.coverImageUrl) : null;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            if (!src || !cover || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
            e.preventDefault();
            setOpening({ id: album.id, src, rect: cover.getBoundingClientRect() });
            window.setTimeout(() => router.push(`/gallery/albums/${album.id}`), 520);
        },
        [router],
    );
    return { opening, open };
}

function AlbumEntry({ album, feature, onOpen }: { album: Album; feature: boolean; onOpen: (e: React.MouseEvent, album: Album, cover: HTMLElement | null) => void }) {
    const cover = useRef<HTMLDivElement>(null);
    const coverUrl = album.coverImageUrl ? getImageUrl(album.coverImageUrl) : null;
    const date = formatAlbumDate(album.date);
    const meta = [ALBUM_TYPE_LABEL[album.type] ?? "Album", date, `${album.photoCount} photo${album.photoCount !== 1 ? "s" : ""}`].filter(Boolean).join(" · ");

    return (
        <a
            href={`/gallery/albums/${album.id}`}
            onClick={(e) => onOpen(e, album, cover.current)}
            className={`group block ${feature ? "lg:grid lg:grid-cols-[1.6fr_1fr] lg:items-end lg:gap-12" : ""}`}
        >
            <div ref={cover} className={`relative overflow-hidden rounded-lg bg-surface ${feature ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
                {coverUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={coverUrl}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                )}
            </div>
            <div className={feature ? "mt-6 lg:mt-0" : "mt-4"}>
                <p className="text-sm font-semibold text-white/60">{meta}</p>
                <h3 className={`mt-2 text-balance font-extrabold leading-tight text-white transition-colors group-hover:text-primary-light ${feature ? "text-[clamp(1.75rem,3.4vw,2.75rem)]" : "text-xl"}`}>
                    {album.name}
                </h3>
                {feature && album.description && (
                    <p className="mt-4 max-w-[48ch] text-pretty leading-relaxed text-white/70 line-clamp-3">{album.description}</p>
                )}
                {feature && (
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.1em] text-white">
                        Open album <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                )}
            </div>
        </a>
    );
}

// ----------------------------------------------------------------------
// Main Gallery
// ----------------------------------------------------------------------
export default function GalleryPage() {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [photosLoading, setPhotosLoading] = useState(true);
    const [filter, setFilter] = useState<AlbumFilter>("ALL");
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [photoPage, setPhotoPage] = useState(1);
    const [photoTotalPages, setPhotoTotalPages] = useState(1);
    const [photoTotal, setPhotoTotal] = useState(0);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const openLightboxById = (photoId: string) => {
        const idx = photos.findIndex(p => p.id === photoId);
        if (idx >= 0) setLightboxIndex(idx);
    };

    // Hero notifies us of its current tile IDs so the marquee can avoid duplication
    const [heroIds, setHeroIds] = useState<string[]>([]);
    const handleHeroTileIdsChange = useCallback((ids: string[]) => {
        setHeroIds(ids);
    }, []);
    const marqueeItems = useMemo(() => {
        const heroSet = new Set(heroIds);
        return photos.filter(p => !heroSet.has(p.id));
    }, [photos, heroIds]);

    const fetchAlbums = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: "24" });
            if (filter !== "ALL") params.set("type", filter);
            if (search) params.set("search", search);
            const res = await api.get(`/albums?${params.toString()}`);
            setAlbums(res.data.data.albums);
            setTotalPages(res.data.data.pagination.totalPages);
        } catch (error) { console.error("Failed to fetch albums", error); } 
        finally { setIsLoading(false); }
    }, [page, filter, search]);

    const fetchPhotos = useCallback(async () => {
        setPhotosLoading(true);
        try {
            const res = await api.get(`/gallery?page=${photoPage}&limit=24`);
            if (photoPage === 1) setPhotos(res.data.data.items);
            else {
                setPhotos(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const newItems = res.data.data.items.filter((p: GalleryPhoto) => !existingIds.has(p.id));
                    return [...prev, ...newItems];
                });
            }
            setPhotoTotalPages(res.data.data.pagination.totalPages);
            setPhotoTotal(res.data.data.pagination.total ?? res.data.data.items.length);
        } catch (error) { console.error("Failed to fetch photos", error); } 
        finally { setPhotosLoading(false); }
    }, [photoPage]);

    useEffect(() => { fetchAlbums(); }, [fetchAlbums]);
    useEffect(() => { fetchPhotos(); }, [fetchPhotos]);
    
    useEffect(() => { setPage(1); setLightboxIndex(null); }, [filter, search]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (lightboxIndex === null) return;
            if (e.key === "Escape") setLightboxIndex(null);
            if (e.key === "ArrowLeft" && lightboxIndex > 0) setLightboxIndex(l => (l !== null ? l - 1 : null));
            if (e.key === "ArrowRight" && lightboxIndex < photos.length - 1) setLightboxIndex(l => (l !== null ? l + 1 : null));
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [lightboxIndex, photos.length]);

    useEffect(() => {
        if (lightboxIndex !== null) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "unset";
        return () => { document.body.style.overflow = "unset"; };
    }, [lightboxIndex]);

    const handleSearchChange = (val: string) => {
        setSearchInput(val);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => setSearch(val), 400);
    };

    const filters: { key: AlbumFilter; label: string }[] = [
        { key: "ALL", label: "All" },
        { key: "CAMP", label: "Camps" },
        { key: "SEMINAR", label: "Seminars" },
        { key: "TOURNAMENT", label: "Tournaments" },
        { key: "BELT_EXAM", label: "Gradings" },
        { key: "TRAINING", label: "Training" },
        { key: "GENERAL", label: "General" },
    ];

    const { opening, open } = useAlbumOpen();
    const [leadAlbum, ...moreAlbums] = albums;

    return (
        // Transparent so the ring scene shows through from the canvas behind <main>.
        <div className="min-h-screen text-white selection:bg-primary selection:text-white">
            <GalleryHero photoCount={photoTotal} />

            {/* Latest from the dojo floor: the existing wall (with featured video) and marquee. */}
            <Section rhythm="base" width="wide" className="bg-black pb-0">
                <Reveal>
                    <Heading>Latest from the dojo floor</Heading>
                </Reveal>
                <div className="mt-10">
                    <DojoWall
                        pool={photos}
                        onTileClick={openLightboxById}
                        onTileIdsChange={handleHeroTileIdsChange}
                    />
                </div>
            </Section>
            <div className="bg-black pb-[clamp(3rem,6vw,5rem)]" aria-busy={photosLoading}>
                <MarqueeStrip
                    items={marqueeItems}
                    onTileClick={openLightboxById}
                />
                {photoPage < photoTotalPages && (
                    <div className="mt-8 flex justify-center px-4">
                        <button
                            type="button"
                            onClick={() => setPhotoPage((p) => p + 1)}
                            disabled={photosLoading}
                            className="min-h-12 border border-white/25 px-7 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-white/10 disabled:opacity-50"
                        >
                            {photosLoading ? "Loading…" : "Load more photographs"}
                        </button>
                    </div>
                )}
            </div>

            {/* Albums */}
            <Section id="albums" rhythm="base" width="wide" className="scroll-mt-24 bg-black">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                    <Reveal>
                        <Heading>Albums</Heading>
                        <p className="mt-3 max-w-[48ch] text-lg text-white/70">Every camp, grading and tournament, kept together.</p>
                    </Reveal>
                    <div className="relative w-full lg:max-w-md">
                        <Search className="pointer-events-none absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-white/60" aria-hidden="true" />
                        <label htmlFor="album-search" className="sr-only">Search albums</label>
                        <input
                            id="album-search"
                            type="search"
                            placeholder="Search albums"
                            value={searchInput}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="h-12 w-full border-b-2 border-white/20 bg-transparent pl-8 pr-2 text-base text-white placeholder:text-white/55 transition-colors focus:border-primary focus:outline-none"
                        />
                    </div>
                </div>

                <div role="tablist" aria-label="Album type" className="mt-8 flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
                    {filters.map(({ key, label }) => {
                        const isActive = filter === key;
                        return (
                            <button
                                key={key}
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => setFilter(key)}
                                className={`min-h-11 whitespace-nowrap border px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                                    isActive ? "border-white bg-white text-black" : "border-white/15 text-white/75 hover:border-white/40 hover:text-white"
                                }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-12 min-h-[320px]" aria-busy={isLoading}>
                    {isLoading ? (
                        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
                            <div className="aspect-[16/9] animate-pulse rounded-lg bg-white/5" />
                            <div className="space-y-4 self-end">
                                <div className="h-4 w-40 animate-pulse rounded bg-white/5" />
                                <div className="h-10 w-full animate-pulse rounded bg-white/5" />
                            </div>
                        </div>
                    ) : leadAlbum ? (
                        <>
                            <Reveal kind="depth">
                                <AlbumEntry album={leadAlbum} feature onOpen={open} />
                            </Reveal>
                            {moreAlbums.length > 0 && (
                                <div className="mt-16 grid gap-x-8 gap-y-12 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
                                    {moreAlbums.map((album, i) => (
                                        <Reveal key={album.id} delay={Math.min(i * 0.05, 0.3)}>
                                            <AlbumEntry album={album} feature={false} onOpen={open} />
                                        </Reveal>
                                    ))}
                                </div>
                            )}
                            {totalPages > 1 && (
                                <div className="mt-14 flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page <= 1}
                                        className="min-h-12 border border-white/20 px-5 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-white/10 disabled:opacity-30"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-sm text-white/60">Page {page} of {totalPages}</span>
                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page >= totalPages}
                                        className="min-h-12 border border-white/20 px-5 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-white/10 disabled:opacity-30"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="border-y border-white/10 py-16">
                            <h3 className="text-2xl font-extrabold text-white">No albums match</h3>
                            <p className="mt-2 max-w-md text-white/70">
                                Nothing found for &ldquo;{filter === "ALL" ? searchInput : filters.find((f) => f.key === filter)?.label}&rdquo;. Try a different search or album type.
                            </p>
                        </div>
                    )}
                </div>
            </Section>

            {/* The album cover growing to fill the screen as the album opens. */}
            {mounted && createPortal(
                <AnimatePresence>
                    {opening && (
                        <motion.div
                            key={opening.id}
                            aria-hidden="true"
                            className="pointer-events-none fixed z-[90] overflow-hidden bg-black"
                            initial={{ top: opening.rect.top, left: opening.rect.left, width: opening.rect.width, height: opening.rect.height, borderRadius: 8 }}
                            animate={{ top: 0, left: 0, width: "100vw", height: "100vh", borderRadius: 0 }}
                            exit={{ opacity: 0, transition: { duration: 0.3 } }}
                            transition={{ duration: 0.5, ease: [0.7, 0, 0.2, 1] }}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={opening.src} alt="" className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body,
            )}

            {/* ── Lightbox with swipe + share ──────────────────────── */}
            {/* Portaled to document.body so it escapes PageTransition's containing block */}
            {mounted && createPortal(
            <AnimatePresence>
                {lightboxIndex !== null && photos[lightboxIndex] && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95"
                    >
                        <div className="absolute top-0 inset-x-0 p-4 sm:p-6 flex justify-between items-start z-50 bg-gradient-to-b from-black/80 to-transparent">
                            <div className="flex flex-col gap-1 max-w-[60%] sm:max-w-2xl px-3 sm:px-4 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
                                {photos[lightboxIndex].caption && (
                                    <h2 className="text-white text-sm sm:text-lg font-bold line-clamp-1">
                                        {photos[lightboxIndex].caption}
                                    </h2>
                                )}
                                <p className="text-zinc-400 text-xs sm:text-sm font-medium">
                                    by <span className="text-white">{photos[lightboxIndex].uploader.name}</span>
                                </p>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3">
                                <button
                                    onClick={async () => {
                                        const photo = photos[lightboxIndex!];
                                        const isVideo = photo.mediaType === 'VIDEO' && photo.videoUrl;
                                        const shareUrl = isVideo ? photo.videoUrl! : window.location.href;
                                        const shareData = {
                                            title: photo.caption || "Kyokushin Gallery",
                                            text: `${photo.caption || "Check out this"} by ${photo.uploader.name}`,
                                            url: shareUrl,
                                        };
                                        if (navigator.share) {
                                            try { await navigator.share(shareData); } catch {}
                                        } else {
                                            await navigator.clipboard.writeText(shareUrl);
                                        }
                                    }}
                                    className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-colors backdrop-blur-md"
                                    title="Share"
                                >
                                    <Share2 className="w-5 h-5 text-white" />
                                </button>
                                {photos[lightboxIndex].mediaType === 'VIDEO' && photos[lightboxIndex].videoUrl ? (
                                    <a
                                        href={photos[lightboxIndex].videoUrl!}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-colors backdrop-blur-md hidden sm:flex"
                                        title={`Watch on ${photos[lightboxIndex].videoProvider === 'youtube' ? 'YouTube' : 'Vimeo'}`}
                                    >
                                        <ExternalLink className="w-5 h-5 text-white" />
                                    </a>
                                ) : (
                                    <a
                                        href={getImageUrl(photos[lightboxIndex].imageUrl) || ""}
                                        download
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-colors backdrop-blur-md hidden sm:flex"
                                    >
                                        <Download className="w-5 h-5 text-white" />
                                    </a>
                                )}
                                <button
                                    onClick={() => setLightboxIndex(null)}
                                    className="p-3 bg-white/5 border border-white/10 hover:bg-white/15 rounded-xl transition-colors backdrop-blur-md"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>

                        {lightboxIndex > 0 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
                                className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 p-3 sm:p-4 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-md transition-all text-white z-50 group border border-white/10 hidden sm:flex"
                            >
                                <ChevronLeft className="w-6 sm:w-8 h-6 sm:h-8 group-hover:-translate-x-1 transition-transform" />
                            </button>
                        )}
                        {lightboxIndex < photos.length - 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
                                className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 p-3 sm:p-4 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-md transition-all text-white z-50 group border border-white/10 hidden sm:flex"
                            >
                                <ChevronRight className="w-6 sm:w-8 h-6 sm:h-8 group-hover:translate-x-1 transition-transform" />
                            </button>
                        )}

                        {/* Swipeable image area */}
                        <motion.div
                            className="w-full h-full p-4 md:p-20 flex items-center justify-center relative touch-pan-y"
                            onClick={() => setLightboxIndex(null)}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(_e, info) => {
                                if (Math.abs(info.offset.x) > 80) {
                                    if (info.offset.x > 0 && lightboxIndex > 0) {
                                        setLightboxIndex(lightboxIndex - 1);
                                    } else if (info.offset.x < 0 && lightboxIndex < photos.length - 1) {
                                        setLightboxIndex(lightboxIndex + 1);
                                    }
                                }
                            }}
                        >
                            {photos[lightboxIndex].mediaType === 'VIDEO' && photos[lightboxIndex].videoProvider && photos[lightboxIndex].videoId ? (
                                <VideoPlayer
                                    provider={photos[lightboxIndex].videoProvider}
                                    videoId={photos[lightboxIndex].videoId}
                                    title={photos[lightboxIndex].caption || undefined}
                                />
                            ) : (
                                <div className="relative flex items-center justify-center max-w-full max-h-[85vh]">
                                    <motion.img
                                        key={photos[lightboxIndex].id}
                                        src={getImageUrl(photos[lightboxIndex].imageUrl) || ""}
                                        alt={photos[lightboxIndex].caption || "Full screen photo"}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="w-auto h-auto max-w-full max-h-[85vh] object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 pointer-events-none select-none"
                                        draggable={false}
                                    />
                                </div>
                            )}
                        </motion.div>

                        {/* Swipe hint on mobile */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
                            <div className="px-5 py-2.5 bg-white/5 backdrop-blur-xl rounded-full text-xs font-bold text-zinc-300 border border-white/10 shadow-2xl tracking-widest">
                                {lightboxIndex + 1} OF {photos.length}
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium sm:hidden">Swipe to navigate</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>,
            document.body
            )}
        </div>
    );
}
