"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Camera, X, ChevronLeft, ChevronRight, Upload, Star, Loader2, ImageIcon, Download, Share2, ZoomIn, ZoomOut, Info, Trophy, MapPin, Flame, Sparkles, Eye, Grid3X3, LayoutGrid } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/contexts/ToastContext";

interface GalleryItem {
    id: string;
    imageUrl: string;
    caption: string | null;
    uploadedAt: string;
    isPublicFeatured: boolean;
    uploader: { id: string; name: string };
    event: { id: string; name: string } | null;
    dojo: { id: string; name: string } | null;
}

type FilterType = "all" | "featured" | "event" | "dojo";

// Shimmer loading placeholder
function ImageSkeleton() {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-zinc-900/80 border border-white/5">
            <div className="w-full aspect-[4/3]" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="h-3 bg-zinc-800 rounded-full w-3/4 mb-2" />
                <div className="h-2 bg-zinc-800/60 rounded-full w-1/2" />
            </div>
        </div>
    );
}

// Individual gallery image with load state
function GalleryImage({ item, index, onClick }: { item: GalleryItem; index: number; onClick: () => void }) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);

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
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.4) }}
            className="break-inside-avoid group cursor-pointer relative overflow-hidden rounded-2xl mb-4"
            onClick={onClick}
        >
            {/* Shimmer placeholder */}
            {!loaded && !error && (
                <div className="w-full aspect-[4/3] bg-zinc-900/80 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" />
                </div>
            )}
            {error && (
                <div className="w-full aspect-[4/3] bg-zinc-900 rounded-2xl flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-zinc-700" />
                </div>
            )}
            {inView && (
                <img
                    src={item.imageUrl}
                    alt={item.caption || "Gallery photo"}
                    className={`w-full rounded-2xl transition-all duration-700 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0 absolute'}`}
                    loading="lazy"
                    onLoad={() => setLoaded(true)}
                    onError={() => setError(true)}
                />
            )}
            {/* Hover overlay */}
            {loaded && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-2xl flex flex-col justify-end p-5">
                    {item.caption && (
                        <p className="text-sm font-semibold text-white mb-1 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">{item.caption}</p>
                    )}
                    <div className="flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                        <p className="text-xs text-gray-400">by {item.uploader.name}</p>
                        {item.event && (
                            <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">{item.event.name}</span>
                        )}
                    </div>
                    {/* Quick actions */}
                    <div className="flex gap-2 mt-3 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100">
                        <button className="p-2 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-sm transition-all hover:scale-110" title="View">
                            <Eye className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}
            {/* Featured badge */}
            {item.isPublicFeatured && loaded && (
                <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-lg shadow-yellow-500/25">
                    <Star className="w-2.5 h-2.5 fill-current" /> Featured
                </div>
            )}
            {/* Dojo badge */}
            {item.dojo && loaded && (
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1 border border-white/10">
                    <MapPin className="w-2.5 h-2.5 text-red-400" /> {item.dojo.name.split(',')[0].replace('Mas Oyama Karate Academy', 'MOKA').replace('Mas Oyama Karate Academy,', 'MOKA')}
                </div>
            )}
        </motion.div>
    );
}

export default function GalleryPage() {
    const { user, token } = useAuthStore();
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [allItems, setAllItems] = useState<GalleryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>("all");
    const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
    const [selectedDojo, setSelectedDojo] = useState<string | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadCaption, setUploadCaption] = useState("");
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadPreview, setUploadPreview] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [zoomed, setZoomed] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showLightboxInfo, setShowLightboxInfo] = useState(true);
    const [heroIndex, setHeroIndex] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const heroRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();

    // Parallax for hero
    const { scrollY } = useScroll();
    const heroY = useTransform(scrollY, [0, 500], [0, 150]);
    const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

    // Fetch all pages for filtering
    const fetchGallery = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: "24" });
            if (filter === "featured") params.set("category", "featured");
            const res = await api.get(`/gallery?${params.toString()}`);
            const fetchedItems = res.data.data.items;
            setAllItems(fetchedItems);
            setTotalPages(res.data.data.pagination.totalPages);
            setTotalItems(res.data.data.pagination.total || fetchedItems.length);
        } catch (error) {
            console.error("Failed to fetch gallery", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, filter]);

    useEffect(() => {
        fetchGallery();
    }, [fetchGallery]);

    useEffect(() => {
        setPage(1);
        setSelectedEvent(null);
        setSelectedDojo(null);
    }, [filter]);

    // Derive filtered items
    useEffect(() => {
        let filtered = allItems;
        if (selectedEvent) {
            filtered = filtered.filter(i => i.event?.id === selectedEvent);
        }
        if (selectedDojo) {
            filtered = filtered.filter(i => i.dojo?.id === selectedDojo);
        }
        setItems(filtered);
    }, [allItems, selectedEvent, selectedDojo]);

    // Extract unique events and dojos for sub-filters
    const uniqueEvents = useMemo(() => {
        const map = new Map<string, string>();
        allItems.forEach(i => { if (i.event) map.set(i.event.id, i.event.name); });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [allItems]);

    const uniqueDojos = useMemo(() => {
        const map = new Map<string, string>();
        allItems.forEach(i => { if (i.dojo) map.set(i.dojo.id, i.dojo.name); });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [allItems]);

    // Featured items for hero carousel
    const featuredItems = useMemo(() => allItems.filter(i => i.isPublicFeatured), [allItems]);

    // Auto-rotate hero
    useEffect(() => {
        if (featuredItems.length <= 1) return;
        const timer = setInterval(() => {
            setHeroIndex(prev => (prev + 1) % featuredItems.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [featuredItems.length]);

    // Keyboard navigation for lightbox
    useEffect(() => {
        if (lightboxIndex === null) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") { setLightboxIndex(null); setZoomed(false); }
            if (e.key === "ArrowRight") setLightboxIndex((prev) => prev !== null ? Math.min(prev + 1, items.length - 1) : null);
            if (e.key === "ArrowLeft") setLightboxIndex((prev) => prev !== null ? Math.max(prev - 1, 0) : null);
            if (e.key === "i" || e.key === "I") setShowLightboxInfo(prev => !prev);
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [lightboxIndex, items.length]);

    // Touch swipe for lightbox
    const touchStartX = useRef<number | null>(null);
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    }, []);
    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (touchStartX.current === null || lightboxIndex === null) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            if (diff > 0 && lightboxIndex < items.length - 1) setLightboxIndex(lightboxIndex + 1);
            if (diff < 0 && lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1);
        }
        touchStartX.current = null;
    }, [lightboxIndex, items.length]);

    // Lock body scroll when lightbox is open
    useEffect(() => {
        if (lightboxIndex !== null) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [lightboxIndex]);

    // Reset zoom when switching images
    useEffect(() => {
        setZoomed(false);
    }, [lightboxIndex]);

    const handleFileSelect = (file: File) => {
        if (file.size > 5 * 1024 * 1024) {
            showToast("File size must be under 5MB", "error");
            return;
        }
        if (!file.type.startsWith("image/")) {
            showToast("Please select an image file", "error");
            return;
        }
        setUploadFile(file);
        if (uploadPreview) URL.revokeObjectURL(uploadPreview);
        setUploadPreview(URL.createObjectURL(file));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleUpload = async () => {
        if (!uploadFile || !token) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("image", uploadFile);
            const uploadRes = await api.post("/upload?folder=gallery", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const imageUrl = uploadRes.data.data.url;
            await api.post("/gallery", { imageUrl, caption: uploadCaption || null });
            setShowUpload(false);
            setUploadFile(null);
            if (uploadPreview) URL.revokeObjectURL(uploadPreview);
            setUploadPreview(null);
            setUploadCaption("");
            showToast("Photo uploaded successfully!", "success");
            fetchGallery();
        } catch (error) {
            console.error("Upload failed", error);
            showToast("Upload failed. Please try again.", "error");
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (imageUrl: string, caption: string | null) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = caption ? `${caption.replace(/[^a-z0-9]/gi, '_')}.jpg` : "kkfi-gallery-photo.jpg";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast("Download started", "success");
        } catch {
            showToast("Download failed", "error");
        }
    };

    const handleShare = async (item: GalleryItem) => {
        const shareData = {
            title: item.caption || "KKFI Gallery Photo",
            text: `Check out this photo from Kyokushin Karate Federation of India${item.event ? ` — ${item.event.name}` : ""}`,
            url: item.imageUrl,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(item.imageUrl);
                showToast("Image link copied to clipboard!", "success");
            }
        } catch {
            // User cancelled share
        }
    };

    const currentItem = lightboxIndex !== null ? items[lightboxIndex] : null;
    const currentHeroItem = featuredItems[heroIndex];

    // Stats
    const stats = useMemo(() => ({
        total: totalItems,
        events: uniqueEvents.length,
        dojos: uniqueDojos.length,
        featured: featuredItems.length,
    }), [totalItems, uniqueEvents, uniqueDojos, featuredItems]);

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden selection:bg-red-500/30">
            {/* ── HERO SECTION with featured carousel ──────────────────────────── */}
            <div ref={heroRef} className="relative h-[70vh] md:h-[80vh] overflow-hidden">
                {/* Background images — crossfade carousel */}
                <AnimatePresence mode="wait">
                    {currentHeroItem && (
                        <motion.div
                            key={currentHeroItem.id}
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.2 }}
                            className="absolute inset-0"
                            style={{ y: heroY }}
                        >
                            <img
                                src={currentHeroItem.imageUrl}
                                alt={currentHeroItem.caption || ""}
                                className="w-full h-full object-cover"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Fallback if no featured */}
                {!currentHeroItem && (
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-red-950/30" />
                )}

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />

                {/* Hero content */}
                <motion.div
                    style={{ opacity: heroOpacity }}
                    className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-[0.25em] mb-6 backdrop-blur-xl"
                    >
                        <Camera className="w-3.5 h-3.5" /> KKFI GALLERY
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-center mb-4"
                    >
                        <span className="text-white drop-shadow-2xl">PHOTO </span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-orange-500">
                            GALLERY
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-base md:text-lg text-gray-300/80 max-w-xl mx-auto text-center leading-relaxed mb-8"
                    >
                        Capturing the spirit of Kyokushin — training sessions, tournaments,
                        belt ceremonies, and unforgettable moments.
                    </motion.p>

                    {/* Stats row */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="flex flex-wrap items-center justify-center gap-3 md:gap-6"
                    >
                        {[
                            { label: "Photos", value: stats.total, icon: ImageIcon, color: "text-red-400" },
                            { label: "Events", value: stats.events, icon: Trophy, color: "text-yellow-400" },
                            { label: "Dojos", value: stats.dojos, icon: MapPin, color: "text-blue-400" },
                            { label: "Featured", value: stats.featured, icon: Star, color: "text-amber-400" },
                        ].map((s) => (
                            <div key={s.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                                <span className="text-sm font-bold text-white">{s.value}</span>
                                <span className="text-xs text-gray-500">{s.label}</span>
                            </div>
                        ))}
                    </motion.div>

                    {/* Hero carousel caption */}
                    {currentHeroItem?.caption && (
                        <motion.p
                            key={currentHeroItem.id + '-caption'}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute bottom-20 text-sm text-gray-400 italic"
                        >
                            &ldquo;{currentHeroItem.caption}&rdquo;
                        </motion.p>
                    )}
                </motion.div>

                {/* Hero carousel dots */}
                {featuredItems.length > 1 && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {featuredItems.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setHeroIndex(i)}
                                className={`transition-all duration-300 rounded-full ${
                                    i === heroIndex
                                        ? "w-8 h-2 bg-red-500"
                                        : "w-2 h-2 bg-white/20 hover:bg-white/40"
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── FILTERS & GALLERY ──────────────────────────────────────────── */}
            <div className="container-responsive pt-8 pb-16 relative z-10">
                {/* Filter bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col gap-4 mb-10"
                >
                    {/* Primary filters */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: "all" as FilterType, label: "All Photos", icon: Grid3X3 },
                                { id: "featured" as FilterType, label: "Featured", icon: Star },
                            ].map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setFilter(cat.id)}
                                    className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 min-h-[44px] flex items-center gap-2 active:scale-95 ${
                                        filter === cat.id
                                            ? "bg-red-600 text-white shadow-lg shadow-red-600/25"
                                            : "bg-zinc-900/80 text-gray-400 hover:bg-zinc-800 hover:text-white border border-white/10 backdrop-blur-sm"
                                    }`}
                                >
                                    <cat.icon className="w-3.5 h-3.5" />
                                    {cat.label}
                                </button>
                            ))}
                            {/* Event filter dropdown */}
                            {uniqueEvents.length > 0 && (
                                <div className="relative group">
                                    <button
                                        className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 min-h-[44px] flex items-center gap-2 ${
                                            selectedEvent
                                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                                : "bg-zinc-900/80 text-gray-400 hover:bg-zinc-800 hover:text-white border border-white/10 backdrop-blur-sm"
                                        }`}
                                    >
                                        <Trophy className="w-3.5 h-3.5" />
                                        {selectedEvent ? uniqueEvents.find(e => e.id === selectedEvent)?.name.substring(0, 20) + '...' : "By Event"}
                                    </button>
                                    <div className="absolute top-full left-0 mt-2 w-72 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30">
                                        <button
                                            onClick={() => setSelectedEvent(null)}
                                            className={`w-full px-4 py-3 text-left text-sm hover:bg-zinc-800 transition-colors ${!selectedEvent ? 'text-red-400' : 'text-gray-400'}`}
                                        >
                                            All Events
                                        </button>
                                        {uniqueEvents.map(ev => (
                                            <button
                                                key={ev.id}
                                                onClick={() => { setFilter("all"); setSelectedEvent(ev.id); setSelectedDojo(null); }}
                                                className={`w-full px-4 py-3 text-left text-sm hover:bg-zinc-800 transition-colors border-t border-white/5 ${
                                                    selectedEvent === ev.id ? 'text-yellow-400 bg-yellow-500/5' : 'text-gray-300'
                                                }`}
                                            >
                                                <Trophy className="w-3 h-3 inline mr-2 text-yellow-500/50" />
                                                {ev.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Dojo filter dropdown */}
                            {uniqueDojos.length > 0 && (
                                <div className="relative group">
                                    <button
                                        className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 min-h-[44px] flex items-center gap-2 ${
                                            selectedDojo
                                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                                : "bg-zinc-900/80 text-gray-400 hover:bg-zinc-800 hover:text-white border border-white/10 backdrop-blur-sm"
                                        }`}
                                    >
                                        <MapPin className="w-3.5 h-3.5" />
                                        {selectedDojo ? uniqueDojos.find(d => d.id === selectedDojo)?.name.split(',')[0].substring(0, 20) : "By Dojo"}
                                    </button>
                                    <div className="absolute top-full left-0 mt-2 w-72 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30">
                                        <button
                                            onClick={() => setSelectedDojo(null)}
                                            className={`w-full px-4 py-3 text-left text-sm hover:bg-zinc-800 transition-colors ${!selectedDojo ? 'text-red-400' : 'text-gray-400'}`}
                                        >
                                            All Dojos
                                        </button>
                                        {uniqueDojos.map(dojo => (
                                            <button
                                                key={dojo.id}
                                                onClick={() => { setFilter("all"); setSelectedDojo(dojo.id); setSelectedEvent(null); }}
                                                className={`w-full px-4 py-3 text-left text-sm hover:bg-zinc-800 transition-colors border-t border-white/5 ${
                                                    selectedDojo === dojo.id ? 'text-blue-400 bg-blue-500/5' : 'text-gray-300'
                                                }`}
                                            >
                                                <MapPin className="w-3 h-3 inline mr-2 text-blue-500/50" />
                                                {dojo.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Active filter count */}
                            {(selectedEvent || selectedDojo) && (
                                <button
                                    onClick={() => { setSelectedEvent(null); setSelectedDojo(null); setFilter("all"); }}
                                    className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1"
                                >
                                    <X className="w-3 h-3" /> Clear filters
                                </button>
                            )}
                            {token && (
                                <button
                                    onClick={() => setShowUpload(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-bold transition-all active:scale-95 shadow-lg shadow-red-600/20"
                                >
                                    <Upload className="w-4 h-4" />
                                    Upload Photo
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Results summary */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>
                            Showing {items.length} photo{items.length !== 1 ? 's' : ''}
                            {selectedEvent && <> in <span className="text-yellow-400">{uniqueEvents.find(e => e.id === selectedEvent)?.name}</span></>}
                            {selectedDojo && <> from <span className="text-blue-400">{uniqueDojos.find(d => d.id === selectedDojo)?.name}</span></>}
                        </span>
                    </div>
                </motion.div>

                {/* Gallery Grid */}
                {isLoading ? (
                    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="break-inside-avoid mb-4">
                                <ImageSkeleton />
                            </div>
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-32"
                    >
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-zinc-900/80 border border-white/10 flex items-center justify-center">
                            <ImageIcon className="w-10 h-10 text-zinc-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-400 mb-2">No Photos Found</h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                            {filter === "featured"
                                ? "No featured photos yet. Check back soon!"
                                : selectedEvent || selectedDojo
                                    ? "No photos match this filter. Try another category."
                                    : "The gallery is empty. Be the first to share a training moment!"}
                        </p>
                        {(selectedEvent || selectedDojo) && (
                            <button
                                onClick={() => { setSelectedEvent(null); setSelectedDojo(null); setFilter("all"); }}
                                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full font-bold transition-all text-sm"
                            >
                                <X className="w-4 h-4" />
                                Clear Filters
                            </button>
                        )}
                        {token && !selectedEvent && !selectedDojo && (
                            <button
                                onClick={() => setShowUpload(true)}
                                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-all"
                            >
                                <Upload className="w-4 h-4" />
                                Upload First Photo
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <>
                        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
                            {items.map((item, index) => (
                                <GalleryImage
                                    key={item.id}
                                    item={item}
                                    index={index}
                                    onClick={() => setLightboxIndex(index)}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && !selectedEvent && !selectedDojo && (
                            <div className="flex items-center justify-center gap-3 mt-12">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-5 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-sm font-bold disabled:opacity-30 hover:bg-zinc-800 transition-colors min-h-[44px]"
                                >
                                    <ChevronLeft className="w-4 h-4 inline mr-1" />
                                    Previous
                                </button>
                                <div className="flex gap-1">
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                        const pageNum = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                                                    page === pageNum
                                                        ? "bg-red-600 text-white shadow-lg shadow-red-600/25"
                                                        : "bg-zinc-900 text-gray-400 hover:bg-zinc-800 border border-white/10"
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-5 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-sm font-bold disabled:opacity-30 hover:bg-zinc-800 transition-colors min-h-[44px]"
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4 inline ml-1" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── UPLOAD MODAL ───────────────────────────────────────────────── */}
            <AnimatePresence>
                {showUpload && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                        onClick={() => !uploading && setShowUpload(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold">Upload Photo</h3>
                                    <p className="text-xs text-gray-500 mt-1">Share a training moment with the community</p>
                                </div>
                                <button
                                    onClick={() => !uploading && setShowUpload(false)}
                                    className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Drag & Drop Zone */}
                            <div
                                ref={dropZoneRef}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 mb-4 ${
                                    isDragging
                                        ? "border-red-500 bg-red-500/10 scale-[1.02]"
                                        : uploadPreview
                                            ? "border-green-500/30 bg-green-500/5"
                                            : "border-white/20 hover:border-red-500/50"
                                }`}
                            >
                                {uploadPreview ? (
                                    <div className="relative">
                                        <img
                                            src={uploadPreview}
                                            alt="Preview"
                                            className="max-h-48 mx-auto rounded-lg shadow-lg"
                                        />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setUploadFile(null);
                                                URL.revokeObjectURL(uploadPreview);
                                                setUploadPreview(null);
                                            }}
                                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center transition-colors ${isDragging ? 'bg-red-500/20' : 'bg-white/5'}`}>
                                            <Upload className={`w-7 h-7 ${isDragging ? 'text-red-400' : 'text-gray-500'}`} />
                                        </div>
                                        <p className="text-sm text-gray-300 font-medium mb-1">
                                            {isDragging ? "Drop your photo here" : "Drag & drop or click to select"}
                                        </p>
                                        <p className="text-xs text-gray-600">JPG, PNG, WebP — max 5MB</p>
                                    </>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>

                            {/* Caption */}
                            <input
                                type="text"
                                placeholder="Add a caption (optional)"
                                value={uploadCaption}
                                onChange={(e) => setUploadCaption(e.target.value)}
                                className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 mb-4 transition-all"
                                maxLength={200}
                            />

                            {user?.role === "STUDENT" && (
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 bg-yellow-500/5 border border-yellow-500/10 rounded-lg px-3 py-2">
                                    <Info className="w-3.5 h-3.5 text-yellow-500" />
                                    Your photo will be reviewed before appearing in the gallery.
                                </div>
                            )}

                            <button
                                onClick={handleUpload}
                                disabled={!uploadFile || uploading}
                                className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-gray-600 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 disabled:shadow-none"
                            >
                                {uploading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                                ) : (
                                    <><Upload className="w-4 h-4" /> Upload Photo</>
                                )}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── LIGHTBOX ───────────────────────────────────────────────────── */}
            <AnimatePresence>
                {lightboxIndex !== null && currentItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/98 backdrop-blur-xl z-50 flex items-center justify-center"
                        onClick={() => { setLightboxIndex(null); setZoomed(false); }}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        {/* Top toolbar */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 md:px-6 py-4 z-20 bg-gradient-to-b from-black/80 to-transparent"
                        >
                            <div className="flex items-center gap-3">
                                <div className="text-sm text-gray-400 font-mono bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                                    {lightboxIndex + 1} / {items.length}
                                </div>
                                {currentItem.isPublicFeatured && (
                                    <div className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded-full border border-yellow-500/20">
                                        <Star className="w-3 h-3 fill-current" /> Featured
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowLightboxInfo(prev => !prev); }}
                                    className={`p-2.5 rounded-full transition-all ${showLightboxInfo ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
                                    title="Info (I)"
                                >
                                    <Info className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setZoomed(prev => !prev); }}
                                    className={`p-2.5 rounded-full transition-all ${zoomed ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
                                    title="Zoom"
                                >
                                    {zoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleShare(currentItem); }}
                                    className="p-2.5 rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                                    title="Share"
                                >
                                    <Share2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDownload(currentItem.imageUrl, currentItem.caption); }}
                                    className="p-2.5 rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                                    title="Download"
                                >
                                    <Download className="w-5 h-5" />
                                </button>
                                <div className="w-px h-5 bg-white/10 mx-1" />
                                <button
                                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); setZoomed(false); }}
                                    className="p-2.5 rounded-full bg-white/5 text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-all"
                                    title="Close (Esc)"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>

                        {/* Nav: Previous */}
                        {lightboxIndex > 0 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
                                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 text-white/30 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-3 md:p-4 transition-all z-10 backdrop-blur-sm border border-white/5 hover:border-white/10"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        )}

                        {/* Nav: Next */}
                        {lightboxIndex < items.length - 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
                                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 text-white/30 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-3 md:p-4 transition-all z-10 backdrop-blur-sm border border-white/5 hover:border-white/10"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        )}

                        {/* Image + Info */}
                        <motion.div
                            key={currentItem.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="max-w-[90vw] max-h-[85vh] flex flex-col items-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div
                                className={`relative transition-transform duration-300 cursor-zoom-in ${zoomed ? 'scale-150 cursor-zoom-out' : ''}`}
                                onClick={(e) => { e.stopPropagation(); setZoomed(prev => !prev); }}
                            >
                                <img
                                    src={currentItem.imageUrl}
                                    alt={currentItem.caption || "Gallery photo"}
                                    className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl shadow-black/80"
                                    draggable={false}
                                />
                            </div>

                            {/* Info panel — always shows caption, toggle for details */}
                            <AnimatePresence>
                                {showLightboxInfo && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="mt-4 bg-zinc-900/80 backdrop-blur-xl rounded-xl px-6 py-4 text-center border border-white/10 max-w-lg"
                                    >
                                        {currentItem.caption && (
                                            <p className="text-white font-semibold mb-2 text-lg">{currentItem.caption}</p>
                                        )}
                                        <div className="flex items-center justify-center gap-3 flex-wrap">
                                            <span className="text-sm text-gray-400">
                                                by <span className="text-white">{currentItem.uploader.name}</span>
                                            </span>
                                            {currentItem.event && (
                                                <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20 flex items-center gap-1">
                                                    <Trophy className="w-2.5 h-2.5" />
                                                    {currentItem.event.name}
                                                </span>
                                            )}
                                            {currentItem.dojo && (
                                                <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
                                                    <MapPin className="w-2.5 h-2.5" />
                                                    {currentItem.dojo.name}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-600 mt-2">
                                            {new Date(currentItem.uploadedAt).toLocaleDateString("en-IN", {
                                                day: "numeric", month: "long", year: "numeric",
                                            })}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Thumbnail strip */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 max-w-[90vw] overflow-x-auto pb-1 px-4 scrollbar-hide"
                        >
                            {items.slice(Math.max(0, lightboxIndex - 5), Math.min(items.length, lightboxIndex + 6)).map((item, i) => {
                                const realIndex = Math.max(0, lightboxIndex - 5) + i;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={(e) => { e.stopPropagation(); setLightboxIndex(realIndex); }}
                                        className={`w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${
                                            realIndex === lightboxIndex
                                                ? 'border-red-500 opacity-100 scale-110 shadow-lg shadow-red-500/25'
                                                : 'border-transparent opacity-30 hover:opacity-60 hover:border-white/20'
                                        }`}
                                    >
                                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                                    </button>
                                );
                            })}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Shimmer animation style */}
            <style jsx global>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 1.5s infinite;
                }
            `}</style>
        </div>
    );
}
