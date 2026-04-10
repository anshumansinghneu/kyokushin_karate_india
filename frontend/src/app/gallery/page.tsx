"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { 
    Camera, Search, Loader2, ImageIcon, FolderOpen, Tent, 
    GraduationCap, Trophy, Swords, Dumbbell, Grid3X3, 
    ChevronRight, ChevronLeft, Sparkles, X, Maximize2, Download, Image as ImageIconSVG 
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { getImageUrl } from "@/lib/imageUtils";
import Link from "next/link";

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

const ALBUM_TYPE_CONFIG: Record<string, { label: string; icon: typeof Camera; color: string; gradient: string; glow: string }> = {
    CAMP: { label: "Camp", icon: Tent, color: "text-emerald-400", gradient: "from-emerald-600 to-emerald-900", glow: "rgba(16,185,129,0.15)" },
    SEMINAR: { label: "Seminar", icon: GraduationCap, color: "text-blue-400", gradient: "from-blue-600 to-blue-900", glow: "rgba(59,130,246,0.15)" },
    TOURNAMENT: { label: "Tournament", icon: Trophy, color: "text-amber-400", gradient: "from-amber-500 to-amber-900", glow: "rgba(245,158,11,0.15)" },
    BELT_EXAM: { label: "Grading", icon: Swords, color: "text-red-400", gradient: "from-red-600 to-red-900", glow: "rgba(220,38,38,0.15)" },
    TRAINING: { label: "Training", icon: Dumbbell, color: "text-purple-400", gradient: "from-purple-600 to-purple-900", glow: "rgba(147,51,234,0.15)" },
    GENERAL: { label: "General", icon: Camera, color: "text-zinc-400", gradient: "from-zinc-600 to-zinc-900", glow: "rgba(161,161,170,0.1)" },
};

// Seeded random for consistent per-photo rotation
function seededRandom(seed: number) {
    const x = Math.sin(seed * 9301 + 49297) * 49297;
    return x - Math.floor(x);
}

// ----------------------------------------------------------------------
// Hero background removed — no stock images

// ----------------------------------------------------------------------
// Floating Photo & Album Cards
// ----------------------------------------------------------------------
function AlbumCard3D({ album, index }: { album: Album; index: number }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [coverLoaded, setCoverLoaded] = useState(false);
    const [inView, setInView] = useState(false);
    const config = ALBUM_TYPE_CONFIG[album.type] || ALBUM_TYPE_CONFIG.GENERAL;
    const IconComp = config.icon;
    const coverUrl = album.coverImageUrl ? getImageUrl(album.coverImageUrl) : null;

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), { stiffness: 200, damping: 20 });
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), { stiffness: 200, damping: 20 });
    const glowX = useSpring(useTransform(mouseX, [-0.5, 0.5], [0, 100]), { stiffness: 200, damping: 20 });
    const glowY = useSpring(useTransform(mouseY, [-0.5, 0.5], [0, 100]), { stiffness: 200, damping: 20 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const el = cardRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
        mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
    };

    const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

    useEffect(() => {
        const el = cardRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
            { rootMargin: "200px" }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <motion.div
            ref={cardRef}
            layout
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            exit={{ opacity: 0, scale: 0.8, y: 20, filter: "blur(10px)" }}
            transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3), type: "spring", stiffness: 100 }}
            style={{ perspective: 800 }}
        >
            <Link href={`/gallery/albums/${album.id}`}>
                <motion.div
                    className="group cursor-pointer relative !transform-none"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                    whileHover={{ z: 30 }}
                >
                    <motion.div
                        className="absolute -inset-4 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                        style={{ background: `radial-gradient(circle at ${glowX}% ${glowY}%, ${config.glow}, transparent 70%)` }}
                    />
                    <div
                        className="relative rounded-2xl overflow-hidden border border-white/[0.08] group-hover:border-white/[0.15] transition-all duration-500"
                        style={{
                            background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                            backdropFilter: "blur(20px)",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                            transformStyle: "preserve-3d",
                        }}
                    >
                        <div className="relative aspect-[4/3] overflow-hidden">
                            {coverUrl && inView ? (
                                <>
                                    <img
                                        src={coverUrl}
                                        alt={album.name}
                                        className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${coverLoaded ? "opacity-100" : "opacity-0"}`}
                                        onLoad={() => setCoverLoaded(true)}
                                    />
                                    {!coverLoaded && (
                                        <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} animate-pulse`} />
                                    )}
                                </>
                            ) : (
                                <div className={`w-full h-full bg-gradient-to-br ${config.gradient}`}>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <IconComp className="w-12 h-12 text-white/20" />
                                    </div>
                                </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/40 to-transparent opacity-90" />

                            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 shadow-black/50 shadow-md"
                                style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }}>
                                <IconComp className={`w-3 h-3 ${config.color}`} />
                                <span className="text-[10px] font-semibold text-white/90">{config.label}</span>
                            </div>

                            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full border border-white/10 shadow-black/50 shadow-md"
                                style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }}>
                                <ImageIcon className="w-3 h-3 text-white/70" />
                                <span className="text-[10px] font-bold text-white/80">{album.photoCount}</span>
                            </div>

                            {album.isPinned && (
                                <div className="absolute bottom-4 right-4 flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/20 border border-red-500/30">
                                    <Sparkles className="w-3 h-3 text-red-400" />
                                </div>
                            )}
                        </div>

                        <div className="absolute bottom-0 inset-x-0 p-5 transform translate-translate-z-6">
                            <h3 className="text-base font-black text-white group-hover:text-red-400 transition-colors line-clamp-1 drop-shadow-md">
                                {album.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs font-medium text-zinc-400">
                                    {album.photoCount} photo{album.photoCount !== 1 ? "s" : ""}
                                </span>
                                {album.date && (
                                    <>
                                        <span className="w-1 h-1 rounded-full bg-zinc-600" />
                                        <span className="text-xs text-zinc-500">
                                            {new Date(album.date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </Link>
        </motion.div>
    );
}

export interface GalleryPhoto {
    id: string;
    imageUrl: string;
    caption: string | null;
    uploadedAt: string;
    isPublicFeatured: boolean;
    uploader: { id: string; name: string };
    event: { id: string; name: string } | null;
    dojo: { id: string; name: string } | null;
}

function FloatingPhoto({ photo, index, onClick }: { photo: GalleryPhoto; index: number; onClick: () => void }) {
    const [loaded, setLoaded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);
    const imgUrl = getImageUrl(photo.imageUrl);
    const rotation = (seededRandom(index + 1) - 0.5) * 5;
    const offsetY = (seededRandom(index + 50) - 0.5) * 10;

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
            { rootMargin: "200px" }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30, rotate: rotation }}
            animate={inView ? {
                opacity: 1,
                y: isHovered ? -8 : offsetY,
                rotate: isHovered ? 0 : rotation,
                scale: isHovered ? 1.04 : 1,
            } : {}}
            transition={{
                opacity: { duration: 0.5, delay: Math.min((index % 10) * 0.05, 0.5) },
                y: { type: "spring", stiffness: 200, damping: 20 },
                rotate: { type: "spring", stiffness: 200, damping: 20 },
                scale: { type: "spring", stiffness: 300, damping: 25 },
            }}
            className="break-inside-avoid mb-5 group cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >
            <div className="relative rounded-xl overflow-hidden border border-white/[0.08] group-hover:border-red-500/30 transition-all duration-500 bg-zinc-900 shadow-xl shadow-black/40">
                {!loaded && <div className="w-full aspect-[4/3] animate-pulse bg-white/5" />}
                {inView && imgUrl && (
                    <img
                        src={imgUrl}
                        alt={photo.caption || "Photo"}
                        className={`w-full transition-all duration-700 group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0 absolute"}`}
                        loading="lazy"
                        onLoad={() => setLoaded(true)}
                    />
                )}
                
                {loaded && (
                    <>
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: isHovered ? 1 : 0.8, opacity: isHovered ? 1 : 0 }}
                                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl"
                            >
                                <Maximize2 className="w-5 h-5 text-white" />
                            </motion.div>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#050507] via-[#050507]/60 to-transparent flex flex-col justify-end p-4 pt-16">
                            {photo.caption && <p className="text-sm font-bold text-white mb-1 drop-shadow-md">{photo.caption}</p>}
                            <p className="text-xs font-semibold text-zinc-400">by {photo.uploader.name}</p>
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
}

// ----------------------------------------------------------------------
// Main Gallery
// ----------------------------------------------------------------------
export default function GalleryPage() {
    const { user } = useAuthStore();
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
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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

    const filters: { key: AlbumFilter; label: string; icon: typeof Camera }[] = [
        { key: "ALL", label: "All", icon: Grid3X3 },
        { key: "CAMP", label: "Camps", icon: Tent },
        { key: "SEMINAR", label: "Seminars", icon: GraduationCap },
        { key: "TOURNAMENT", label: "Tournaments", icon: Trophy },
        { key: "BELT_EXAM", label: "Grading", icon: Swords },
        { key: "TRAINING", label: "Training", icon: Dumbbell },
        { key: "GENERAL", label: "General", icon: Camera },
    ];

    return (
        <div className="min-h-screen bg-[#050507] text-white selection:bg-red-500/30">
            {/* Awesome Hero Section Modified */}
            <div className="relative w-full overflow-hidden text-center flex flex-col items-center justify-center pt-40 pb-32 sm:pt-48 sm:pb-40">
                {/* Advanced Cinematic Lights */}
                <div className="absolute top-0 inset-x-0 mx-auto w-[600px] h-[600px] bg-red-600 opacity-[0.03] blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
                <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] bg-orange-500 opacity-[0.03] blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
                
                {/* Clean dark background — no stock images */}
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/10 to-transparent pointer-events-none" />
                
                <div className="relative z-20 max-w-5xl mx-auto px-4 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <h1 className="font-black tracking-tighter uppercase leading-[0.9] drop-shadow-2xl" style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)' }}>
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

                        <p className="mt-6 text-zinc-500 max-w-lg mx-auto text-sm leading-relaxed">
                            Training, grading, tournaments, and camp memories from Kyokushin dojos across India.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Content Container */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-20 relative z-30">
                {/* Search & Filters Dock */}
                <div className="sticky top-6 z-40 mb-20 flex flex-col items-center gap-6">
                    {/* Background glow for the dock area */}
                    <div className="absolute inset-0 bg-red-500/5 blur-[100px] pointer-events-none w-[60%] mx-auto h-[150px]" />
                    
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="relative w-full max-w-2xl shadow-2xl group"
                    >
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 transition-colors group-focus-within:text-red-500" />
                        <input
                            type="text"
                            placeholder="Discover tournaments, camps, or dojo memories..."
                            value={searchInput}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-[#0A0A0A]/80 backdrop-blur-3xl border border-white/5 rounded-2xl text-base font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/30 focus:bg-[#0F0F0F]/90 shadow-[0_0_50px_-12px_rgba(0,0,0,1)] transition-all"
                        />
                        <div className="absolute inset-x-0 -bottom-[1px] h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-700 ease-out" />
                    </motion.div>

                    {/* Highly Polished Filters Dock */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex overflow-x-auto w-full justify-start md:justify-center pb-4 hide-scrollbar"
                    >
                        <div className="flex bg-[#050505]/80 backdrop-blur-3xl border border-white/5 rounded-full p-2 shadow-[0_8px_30px_rgb(0,0,0,0.4)] max-w-full relative">
                            {filters.map(({ key, label, icon: Icon }) => {
                                const isActive = filter === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setFilter(key)}
                                        className={`relative flex items-center gap-2.5 px-6 py-3 rounded-full text-xs font-bold transition-all duration-300 ease-out whitespace-nowrap ${
                                            isActive ? "text-white shadow-lg scale-[1.02]" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                                        }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeFilterBg"
                                                className="absolute inset-0 bg-gradient-to-b from-red-500/90 to-red-600/90 rounded-full border border-red-400/30 shadow-[0_0_20px_-3px_rgba(239,68,68,0.4)] z-0"
                                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                            />
                                        )}
                                        <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-white' : 'opacity-70'}`} />
                                        <span className="relative z-10 tracking-widest uppercase text-[10px] sm:text-[11px]">{label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>

                {/* Albums Grid */}
                <div className="min-h-[400px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
                            <span className="text-sm font-bold text-zinc-500 tracking-widest uppercase">Fetching Albums</span>
                        </div>
                    ) : albums.length > 0 ? (
                        <>
                            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                                <AnimatePresence mode="popLayout">
                                    {albums.map((album, i) => (
                                        <AlbumCard3D key={album.id} album={album} index={i} />
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        </>
                    ) : (
                        /* Premium Empty State */
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-20 px-4 text-center border border-white/5 bg-white/[0.02] rounded-3xl mt-12 overflow-hidden relative"
                        >
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/5 blur-[120px] rounded-full pointer-events-none" />
                            <div className="relative z-10">
                                <div className="w-24 h-24 mb-6 rounded-3xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 shadow-2xl flex items-center justify-center mx-auto transform rotate-12 hover:rotate-0 transition-transform duration-500">
                                    <ImageIconSVG className="w-10 h-10 text-zinc-600" />
                                </div>
                                <h3 className="text-2xl font-black text-white">No Albums Found in the Vault</h3>
                                <p className="text-zinc-500 mt-2 max-w-md mx-auto text-sm font-medium">
                                    We couldn't find any albums matching "{filter === 'ALL' ? searchInput : filters.find(f=>f.key===filter)?.label}". Try broadening your search or modifying your filters.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* ── All Photos Masonry Gallery ──────────────────────────── */}
                {photos.length > 0 && (
                    <div className="mt-32">
                        <div className="flex items-center justify-center gap-4 mb-16">
                            <div className="h-px w-32 bg-gradient-to-r from-transparent to-white/10" />
                            <span className="text-xs font-black text-white uppercase tracking-[0.2em] px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                                Latest Global Uploads
                            </span>
                            <div className="h-px w-32 bg-gradient-to-l from-transparent to-white/10" />
                        </div>

                        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-5 space-y-5 pb-16">
                            {photos.map((photo, i) => (
                                <FloatingPhoto 
                                    key={photo.id} 
                                    photo={photo} 
                                    index={i} 
                                    onClick={() => setLightboxIndex(i)}
                                />
                            ))}
                        </div>

                        {photoPage < photoTotalPages && (
                            <div className="flex justify-center mt-4">
                                <button
                                    onClick={() => setPhotoPage(p => p + 1)}
                                    disabled={photosLoading}
                                    className="px-8 py-4 rounded-full text-sm font-bold bg-white text-black hover:bg-zinc-200 transition-all flex items-center gap-3 shadow-xl hover:shadow-2xl hover:shadow-white/20 hover:-translate-y-1 duration-300 disabled:opacity-50 disabled:transform-none"
                                >
                                    {photosLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    {photosLoading ? "Loading more..." : "Load More Memories"}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Lightbox ──────────────────────── */}
            <AnimatePresence>
                {lightboxIndex !== null && photos[lightboxIndex] && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050507]/98 backdrop-blur-2xl"
                    >
                        <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-start z-50 bg-gradient-to-b from-black/80 to-transparent">
                            <div className="flex flex-col gap-1 max-w-2xl px-4 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
                                {photos[lightboxIndex].caption && (
                                    <h2 className="text-white text-lg font-bold">
                                        {photos[lightboxIndex].caption}
                                    </h2>
                                )}
                                <p className="text-zinc-400 text-sm font-medium">
                                    Captured by <span className="text-white">{photos[lightboxIndex].uploader.name}</span>
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <a
                                    href={getImageUrl(photos[lightboxIndex].imageUrl) || ""}
                                    download
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-colors backdrop-blur-md"
                                >
                                    <Download className="w-5 h-5 text-white" />
                                </a>
                                <button
                                    onClick={() => setLightboxIndex(null)}
                                    className="p-3 bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 rounded-xl transition-colors backdrop-blur-md"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>

                        {lightboxIndex > 0 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
                                className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-md transition-all text-white z-50 group border border-white/10"
                            >
                                <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
                            </button>
                        )}
                        {lightboxIndex < photos.length - 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
                                className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-md transition-all text-white z-50 group border border-white/10"
                            >
                                <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
                            </button>
                        )}

                        <div className="w-full h-full p-4 md:p-20 flex items-center justify-center relative" onClick={() => setLightboxIndex(null)}>
                            <motion.img
                                key={photos[lightboxIndex].id}
                                src={getImageUrl(photos[lightboxIndex].imageUrl) || ""}
                                alt={photos[lightboxIndex].caption || "Full screen photo"}
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10"
                                onClick={(e) => e.stopPropagation()} 
                            />
                        </div>

                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-white/5 backdrop-blur-xl rounded-full text-xs font-bold text-zinc-300 border border-white/10 shadow-2xl tracking-widest">
                            {lightboxIndex + 1} OF {photos.length}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
