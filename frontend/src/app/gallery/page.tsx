"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Camera, Search, Loader2, ImageIcon, FolderOpen, Tent, GraduationCap, Trophy, Swords, Dumbbell, Grid3X3, ChevronRight, Sparkles } from "lucide-react";
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

function AlbumCard3D({ album, index }: { album: Album; index: number }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [coverLoaded, setCoverLoaded] = useState(false);
    const [inView, setInView] = useState(false);
    const config = ALBUM_TYPE_CONFIG[album.type] || ALBUM_TYPE_CONFIG.GENERAL;
    const IconComp = config.icon;
    const coverUrl = album.coverImageUrl ? getImageUrl(album.coverImageUrl) : null;

    // 3D tilt motion values
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

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

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
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: Math.min(index * 0.1, 0.6), type: "spring", stiffness: 100 }}
            style={{ perspective: 800 }}
        >
            <Link href={`/gallery/albums/${album.id}`}>
                <motion.div
                    className="group cursor-pointer relative"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                    whileHover={{ z: 30 }}
                >
                    {/* Ambient glow behind card */}
                    <motion.div
                        className="absolute -inset-4 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                        style={{
                            background: `radial-gradient(circle at ${glowX}% ${glowY}%, ${config.glow}, transparent 70%)`,
                        }}
                    />

                    {/* Main card */}
                    <div
                        className="relative rounded-2xl overflow-hidden border border-white/[0.08] group-hover:border-white/[0.15] transition-all duration-500"
                        style={{
                            background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                            backdropFilter: "blur(20px)",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
                            transformStyle: "preserve-3d",
                        }}
                    >
                        {/* Cover image */}
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
                                        <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`}>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <IconComp className="w-12 h-12 text-white/20" />
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className={`w-full h-full bg-gradient-to-br ${config.gradient}`}>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <IconComp className="w-12 h-12 text-white/20" />
                                    </div>
                                </div>
                            )}

                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80" />

                            {/* Shine effect on hover */}
                            <motion.div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{
                                    background: `linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 55%, transparent 60%)`,
                                    transform: "translateZ(1px)",
                                }}
                            />

                            {/* Type badge — glassmorphism */}
                            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10"
                                style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)" }}>
                                <IconComp className={`w-3 h-3 ${config.color}`} />
                                <span className="text-[10px] font-semibold text-white/80">{config.label}</span>
                            </div>

                            {/* Photo count badge */}
                            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full border border-white/10"
                                style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)" }}>
                                <ImageIcon className="w-3 h-3 text-white/50" />
                                <span className="text-[10px] font-medium text-white/60">{album.photoCount}</span>
                            </div>

                            {/* Pinned indicator */}
                            {album.isPinned && (
                                <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30">
                                    <Sparkles className="w-2.5 h-2.5 text-red-400" />
                                    <span className="text-[9px] font-bold text-red-400">FEATURED</span>
                                </div>
                            )}
                        </div>

                        {/* Info section — frosted glass */}
                        <div className="p-4"
                            style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(20px)" }}>
                            <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                                {album.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[11px] text-zinc-500">
                                    {album.photoCount} photo{album.photoCount !== 1 ? "s" : ""}
                                </span>
                                {album.date && (
                                    <>
                                        <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                        <span className="text-[11px] text-zinc-600">
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

// Seeded random for consistent per-photo rotation
function seededRandom(seed: number) {
    const x = Math.sin(seed * 9301 + 49297) * 49297;
    return x - Math.floor(x);
}

interface GalleryPhoto {
    id: string;
    imageUrl: string;
    caption: string | null;
    uploadedAt: string;
    isPublicFeatured: boolean;
    uploader: { id: string; name: string };
    event: { id: string; name: string } | null;
    dojo: { id: string; name: string } | null;
}

function FloatingPhoto({ photo, index }: { photo: GalleryPhoto; index: number }) {
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
                opacity: { duration: 0.5, delay: Math.min(index * 0.04, 0.5) },
                y: { type: "spring", stiffness: 200, damping: 20 },
                rotate: { type: "spring", stiffness: 200, damping: 20 },
                scale: { type: "spring", stiffness: 300, damping: 25 },
            }}
            className="break-inside-avoid mb-5 group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className="relative rounded-2xl overflow-hidden border border-white/[0.06] group-hover:border-white/[0.12] transition-all duration-500"
                style={{
                    boxShadow: isHovered
                        ? "0 25px 50px rgba(0,0,0,0.5), 0 0 30px rgba(220,38,38,0.04)"
                        : "0 8px 25px rgba(0,0,0,0.3)",
                }}
            >
                {!loaded && (
                    <div className="w-full aspect-[4/3] bg-zinc-900/50">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent animate-shimmer" />
                    </div>
                )}
                {inView && imgUrl && (
                    <img
                        src={imgUrl}
                        alt={photo.caption || "Photo"}
                        className={`w-full transition-all duration-700 group-hover:scale-110 ${loaded ? "opacity-100" : "opacity-0 absolute"}`}
                        loading="lazy"
                        onLoad={() => setLoaded(true)}
                    />
                )}
                {loaded && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-4">
                        {photo.caption && <p className="text-xs font-semibold text-white drop-shadow-lg">{photo.caption}</p>}
                        <p className="text-[10px] text-zinc-400 mt-0.5">by {photo.uploader.name}</p>
                        {photo.event && (
                            <span className="mt-1.5 inline-flex self-start text-[9px] text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">{photo.event.name}</span>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

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

    const fetchAlbums = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: "24" });
            if (filter !== "ALL") params.set("type", filter);
            if (search) params.set("search", search);
            const res = await api.get(`/albums?${params.toString()}`);
            setAlbums(res.data.data.albums);
            setTotalPages(res.data.data.pagination.totalPages);
        } catch (error) {
            console.error("Failed to fetch albums", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, filter, search]);

    const fetchPhotos = useCallback(async () => {
        setPhotosLoading(true);
        try {
            const res = await api.get(`/gallery?page=${photoPage}&limit=24`);
            setPhotos(res.data.data.items);
            setPhotoTotalPages(res.data.data.pagination.totalPages);
        } catch (error) {
            console.error("Failed to fetch photos", error);
        } finally {
            setPhotosLoading(false);
        }
    }, [photoPage]);

    useEffect(() => { fetchAlbums(); }, [fetchAlbums]);
    useEffect(() => { fetchPhotos(); }, [fetchPhotos]);
    useEffect(() => { setPage(1); }, [filter, search]);

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
        <div className="min-h-screen bg-[#050507] text-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-[#050507] to-[#050507]" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse,rgba(220,38,38,0.08),transparent_60%)]" />
                    <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(220,38,38,0.04),transparent_60%)] animate-pulse" style={{ animationDuration: "4s" }} />
                    <div className="absolute top-10 right-1/4 w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(168,85,247,0.04),transparent_60%)] animate-pulse" style={{ animationDuration: "6s" }} />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 pt-28 pb-12 sm:pt-32 sm:pb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 border border-white/[0.06] rounded-full px-4 py-1.5 mb-6"
                            style={{ background: "rgba(255,255,255,0.02)", backdropFilter: "blur(10px)" }}
                        >
                            <Camera className="w-4 h-4 text-red-400" />
                            <span className="text-xs font-medium text-zinc-500">Photo Gallery</span>
                        </motion.div>
                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight">
                            <span className="bg-gradient-to-b from-white via-white to-zinc-500 bg-clip-text text-transparent">Our </span>
                            <span className="bg-gradient-to-r from-red-500 via-red-400 to-rose-500 bg-clip-text text-transparent">Memories</span>
                        </h1>
                        <p className="mt-4 text-zinc-600 max-w-lg mx-auto text-sm sm:text-base">
                            Browse photos from camps, seminars, tournaments, and training across India
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Controls */}
            <div className="max-w-7xl mx-auto px-4 pb-8">
                {/* Search Bar — glassmorphism */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="relative max-w-md mx-auto mb-8"
                >
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                        type="text"
                        placeholder="Search albums..."
                        value={searchInput}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border border-white/[0.06] rounded-2xl text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-red-500/30 focus:ring-1 focus:ring-red-500/10 transition-all"
                        style={{ background: "rgba(255,255,255,0.02)", backdropFilter: "blur(10px)" }}
                    />
                </motion.div>

                {/* Type Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-wrap justify-center gap-2 mb-12"
                >
                    {filters.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                                filter === key
                                    ? "bg-red-600 text-white shadow-lg shadow-red-600/20 scale-105"
                                    : "text-zinc-500 border border-white/[0.06] hover:text-white hover:border-white/10"
                            }`}
                            style={filter !== key ? { background: "rgba(255,255,255,0.02)" } : undefined}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                        </button>
                    ))}
                </motion.div>

                {/* Albums Section */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                        <span className="text-xs text-zinc-700">Loading...</span>
                    </div>
                ) : albums.length > 0 && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                            {albums.map((album, i) => (
                                <AlbumCard3D key={album.id} album={album} index={i} />
                            ))}
                        </div>

                        {/* Album Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-10">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300 ${
                                            p === page
                                                ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                                                : "text-zinc-600 border border-white/[0.06] hover:text-white hover:border-white/10"
                                        }`}
                                        style={p !== page ? { background: "rgba(255,255,255,0.02)" } : undefined}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ── All Photos Section ──────────────────────────── */}
                {photos.length > 0 && (
                    <div className={albums.length > 0 ? "mt-20" : ""}>
                        {/* Section header */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex items-center gap-4 mb-10"
                        >
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                            <div className="flex items-center gap-2 px-4 py-1.5 border border-white/[0.06] rounded-full"
                                style={{ background: "rgba(255,255,255,0.02)" }}>
                                <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
                                <span className="text-xs font-medium text-zinc-500">All Photos</span>
                            </div>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                        </motion.div>

                        {/* Floating photos masonry */}
                        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4">
                            {photos.map((photo, i) => (
                                <FloatingPhoto key={photo.id} photo={photo} index={i} />
                            ))}
                        </div>

                        {/* Photo Pagination */}
                        {photoTotalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-12">
                                {Array.from({ length: Math.min(photoTotalPages, 10) }, (_, i) => i + 1).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPhotoPage(p)}
                                        className={`w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300 ${
                                            p === photoPage
                                                ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                                                : "text-zinc-600 border border-white/[0.06] hover:text-white hover:border-white/10"
                                        }`}
                                        style={p !== photoPage ? { background: "rgba(255,255,255,0.02)" } : undefined}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Empty state — only when no albums AND no photos */}
                {!isLoading && albums.length === 0 && photos.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-24"
                    >
                        <Camera className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
                        <p className="text-zinc-500 text-lg">No photos yet</p>
                        <p className="text-zinc-700 text-sm mt-1">Photos will appear here as they are uploaded</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
