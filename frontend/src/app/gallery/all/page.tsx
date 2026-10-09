"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Upload, Star, Loader2, ImageIcon, Download, Share2, ZoomIn, ZoomOut, Info, Trophy, MapPin, Eye, Grid3X3, LayoutGrid, Trash2 } from "lucide-react";
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
        <div className="relative overflow-hidden rounded-2xl bg-surface/80 border border-white/5">
            <div className="w-full aspect-[4/3]" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="h-3 bg-surface-hover rounded-full w-3/4 mb-2" />
                <div className="h-2 bg-surface-hover/60 rounded-full w-1/2" />
            </div>
        </div>
    );
}

// Individual gallery image with load state
function GalleryImage({ item, index, onClick, onDelete }: { item: GalleryItem; index: number; onClick: () => void; onDelete?: (item: GalleryItem) => void }) {
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
            className="break-inside-avoid group cursor-pointer relative overflow-hidden rounded-lg mb-4 border border-white/10 transition-colors duration-300 hover:border-white/40"
            onClick={onClick}
        >
            {/* Shimmer placeholder */}
            {!loaded && !error && (
                <div className="w-full aspect-[4/3] bg-surface/80 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" />
                </div>
            )}
            {error && (
                <div className="w-full aspect-[4/3] bg-surface rounded-2xl flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-white/30" />
                </div>
            )}
            {inView && (
                <img
                    src={item.imageUrl}
                    alt={item.caption || "Gallery photo"}
                    className={`w-full transition-transform duration-700 ease-out group-hover:scale-[1.03] ${loaded ? 'opacity-100' : 'opacity-0 absolute'}`}
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
                        <p className="text-xs text-white/70">by {item.uploader.name}</p>
                        {item.event && (
                            <span className="text-[10px] text-primary-light bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">{item.event.name}</span>
                        )}
                    </div>
                    {/* Quick actions */}
                    <div className="flex gap-2 mt-3 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100">
                        <button className="p-2 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-sm transition-all hover:scale-110" title="View">
                            <Eye className="w-3.5 h-3.5" />
                        </button>
                        {onDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                                className="p-2 rounded-full bg-primary/20 hover:bg-primary/40 text-primary-light backdrop-blur-sm transition-all hover:scale-110"
                                title="Delete"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            )}
            {/* Featured badge */}
            {item.isPublicFeatured && loaded && (
                <div className="absolute top-3 right-3 bg-secondary text-black px-2.5 py-1 rounded-sm text-[11px] font-bold flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-current" /> Featured
                </div>
            )}
            {/* Dojo badge */}
            {item.dojo && loaded && (
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1 border border-white/10">
                    <MapPin className="w-2.5 h-2.5 text-primary-light" /> {item.dojo.name.split(',')[0].replace('Mas Oyama Karate Academy', 'MOKA').replace('Mas Oyama Karate Academy,', 'MOKA')}
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
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);
    const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);
    const [uploadProgress, setUploadProgress] = useState("");
    // Keep legacy single-file state for compatibility with existing code
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadPreview, setUploadPreview] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [zoomed, setZoomed] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showLightboxInfo, setShowLightboxInfo] = useState(true);
    const [heroIndex, setHeroIndex] = useState(0);
    const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const heroRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();
    const isAdmin = user?.role === "ADMIN";

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

    const addUploadFiles = (newFiles: FileList | File[]) => {
        const valid: File[] = [];
        for (const f of Array.from(newFiles)) {
            if (f.size > 5 * 1024 * 1024) { showToast(`${f.name} exceeds 5MB, skipped`, "error"); continue; }
            if (!f.type.startsWith("image/")) { showToast(`${f.name} is not an image, skipped`, "error"); continue; }
            valid.push(f);
        }
        setUploadFiles(prev => [...prev, ...valid]);
        setUploadPreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))]);
        // Legacy compat: set first file
        if (valid.length > 0 && !uploadFile) {
            setUploadFile(valid[0]);
            setUploadPreview(URL.createObjectURL(valid[0]));
        }
    };

    const removeUploadFile = (index: number) => {
        URL.revokeObjectURL(uploadPreviews[index]);
        setUploadFiles(prev => prev.filter((_, i) => i !== index));
        setUploadPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const clearAllUploads = () => {
        uploadPreviews.forEach(p => URL.revokeObjectURL(p));
        setUploadFiles([]);
        setUploadPreviews([]);
        setUploadFile(null);
        setUploadPreview(null);
        setUploadCaption("");
        setUploadProgress("");
        setShowUpload(false);
    };

    const handleFileSelect = (file: File) => {
        addUploadFiles([file]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            addUploadFiles(e.target.files);
        }
        e.target.value = "";
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
        if (e.dataTransfer.files.length > 0) addUploadFiles(e.dataTransfer.files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleUpload = async () => {
        if (uploadFiles.length === 0 || !token) return;
        setUploading(true);
        try {
            if (uploadFiles.length === 1) {
                setUploadProgress("Uploading 1/1...");
                const formData = new FormData();
                formData.append("image", uploadFiles[0]);
                const uploadRes = await api.post("/upload?folder=gallery", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                const imageUrl = uploadRes.data.data.url;
                await api.post("/gallery", { imageUrl, caption: uploadCaption || null });
            } else {
                setUploadProgress(`Uploading ${uploadFiles.length} photos...`);
                const fd = new FormData();
                uploadFiles.forEach(f => fd.append("images", f));
                const uploadRes = await api.post("/upload/multiple?folder=gallery", fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                const files = uploadRes.data.data.files as { url: string }[];
                for (let i = 0; i < files.length; i++) {
                    setUploadProgress(`Saving ${i + 1}/${files.length}...`);
                    await api.post("/gallery", { imageUrl: files[i].url });
                }
            }
            clearAllUploads();
            showToast(`${uploadFiles.length} photo${uploadFiles.length > 1 ? "s" : ""} uploaded!`, "success");
            fetchGallery();
        } catch (error) {
            console.error("Upload failed", error);
            showToast("Upload failed. Please try again.", "error");
        } finally {
            setUploading(false);
            setUploadProgress("");
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
            text: `Check out this photo from Kyokushin Karate Foundation of India${item.event ? ` — ${item.event.name}` : ""}`,
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

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await api.delete(`/gallery/${deleteTarget.id}`);
            showToast("Photo deleted successfully", "success");
            setDeleteTarget(null);
            // Close lightbox if the deleted item was being viewed
            if (lightboxIndex !== null && currentItem?.id === deleteTarget.id) {
                setLightboxIndex(null);
            }
            fetchGallery();
        } catch (error) {
            console.error("Delete failed", error);
            showToast("Failed to delete photo", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const currentItem = lightboxIndex !== null ? items[lightboxIndex] : null;
    // With nothing featured yet, the newest photograph carries the hero instead of an empty black panel.
    const currentHeroItem = featuredItems[heroIndex] ?? allItems[0];

    // Stats
    const stats = useMemo(() => ({
        total: totalItems,
        events: uniqueEvents.length,
        dojos: uniqueDojos.length,
        featured: featuredItems.length,
    }), [totalItems, uniqueEvents, uniqueDojos, featuredItems]);

    return (
        <div className="min-h-screen bg-black text-white relative overflow-x-clip selection:bg-primary selection:text-white">
            {/* ── DELETE CONFIRMATION MODAL ─────────────────────────────────── */}
            <AnimatePresence>
                {deleteTarget && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-surface border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                        >
                            {deleteTarget.imageUrl && (
                                <div className="mb-4 rounded-xl overflow-hidden border border-white/5">
                                    <img src={deleteTarget.imageUrl} alt="" className="w-full h-40 object-cover" />
                                </div>
                            )}
                            <h3 className="text-xl font-bold text-white mb-2">Delete Photo?</h3>
                            <p className="text-white/70 text-sm mb-6">
                                {deleteTarget.caption
                                    ? <>Are you sure you want to delete &ldquo;{deleteTarget.caption}&rdquo;? This action cannot be undone.</>
                                    : "Are you sure you want to delete this photo? This action cannot be undone."}
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    className="px-4 py-2 min-h-[44px] text-white/80 hover:text-white border border-white/20 hover:bg-white/10 rounded-none uppercase tracking-wider transition-colors font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 min-h-[44px] bg-primary hover:bg-primary-dark text-white rounded-none uppercase tracking-wider transition-colors font-bold flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : <><Trash2 className="w-4 h-4" /> Delete Photo</>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── HERO: featured photographs crossfading, full-bleed under the navbar ── */}
            <header data-bleed ref={heroRef} className="relative flex min-h-[64svh] overflow-hidden md:min-h-[72svh]">
                <AnimatePresence mode="wait">
                    {currentHeroItem && (
                        <motion.div
                            key={currentHeroItem.id}
                            initial={{ opacity: 0, scale: 1.06 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute inset-0"
                            style={{ y: heroY }}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={currentHeroItem.imageUrl} alt="" className="h-full w-full object-cover" />
                        </motion.div>
                    )}
                </AnimatePresence>
                {!currentHeroItem && <div className="absolute inset-0 bg-black" />}
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/35" />

                <motion.div
                    style={{ opacity: heroOpacity }}
                    className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col justify-end px-4 pb-[clamp(2.5rem,7vh,5rem)] pt-36 sm:px-6 lg:px-8"
                >
                    <h1 className="max-w-[14ch] text-balance text-[clamp(2.75rem,8vw,6rem)] font-black uppercase leading-[0.92] tracking-[-0.035em] text-white">
                        Every photograph<span className="text-primary">.</span>
                    </h1>
                    <p className="mt-6 max-w-[52ch] text-pretty text-lg leading-relaxed text-white/80 md:text-xl">
                        {stats.total > 0 ? `${stats.total} photographs` : "Photographs"}
                        {stats.events > 0 ? ` from ${stats.events} event${stats.events !== 1 ? "s" : ""}` : ""}
                        {stats.dojos > 0 ? ` and ${stats.dojos} dojo${stats.dojos !== 1 ? "s" : ""}` : ""}: training, tournaments,
                        gradings and the moments in between.
                    </p>
                    {currentHeroItem?.caption && (
                        <p key={currentHeroItem.id + "-caption"} className="mt-6 text-sm font-semibold text-white/65">
                            {currentHeroItem.isPublicFeatured ? "Featured: " : "Latest: "}{currentHeroItem.caption}
                        </p>
                    )}
                    {featuredItems.length > 1 && (
                        <div className="mt-5 flex gap-1" role="tablist" aria-label="Featured photographs">
                            {featuredItems.map((item, i) => (
                                <button
                                    key={item.id}
                                    role="tab"
                                    aria-selected={i === heroIndex}
                                    aria-label={`Featured photo ${i + 1} of ${featuredItems.length}`}
                                    onClick={() => setHeroIndex(i)}
                                    className="flex h-11 w-8 items-center justify-center"
                                >
                                    <span className={`h-0.5 w-full transition-colors duration-300 ${i === heroIndex ? "bg-white" : "bg-white/25"}`} />
                                </button>
                            ))}
                        </div>
                    )}
                </motion.div>
            </header>

            {/* ── FILTERS & GALLERY ──────────────────────────────────────────── */}
            <div className="mx-auto max-w-[1400px] px-4 pt-[clamp(2.5rem,5vw,4rem)] pb-20 sm:px-6 lg:px-8 relative z-10">
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
                                    className={`px-5 py-2.5 rounded-none text-sm font-bold uppercase tracking-wider transition-colors duration-200 min-h-[44px] flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                                        filter === cat.id
                                            ? "bg-primary hover:bg-primary-dark text-white"
                                            : "bg-transparent text-white/80 hover:bg-white/10 hover:text-white border border-white/20"
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
                                        className={`px-5 py-2.5 rounded-none text-sm font-bold transition-all duration-200 min-h-[44px] flex items-center gap-2 ${
                                            selectedEvent
                                                ? "bg-secondary/20 text-secondary border border-secondary/30"
                                                : "bg-surface/80 text-white/70 hover:bg-surface-hover hover:text-white border border-white/10 backdrop-blur-sm"
                                        }`}
                                    >
                                        <Trophy className="w-3.5 h-3.5" />
                                        {selectedEvent ? uniqueEvents.find(e => e.id === selectedEvent)?.name.substring(0, 20) + '...' : "By Event"}
                                    </button>
                                    <div className="absolute top-full left-0 mt-2 w-72 bg-surface border border-white/15 rounded-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-30">
                                        <button
                                            onClick={() => setSelectedEvent(null)}
                                            className={`w-full px-4 py-3 text-left text-sm hover:bg-surface-hover transition-colors ${!selectedEvent ? 'text-primary-light' : 'text-white/70'}`}
                                        >
                                            All Events
                                        </button>
                                        {uniqueEvents.map(ev => (
                                            <button
                                                key={ev.id}
                                                onClick={() => { setFilter("all"); setSelectedEvent(ev.id); setSelectedDojo(null); }}
                                                className={`w-full px-4 py-3 text-left text-sm hover:bg-surface-hover transition-colors border-t border-white/5 ${
                                                    selectedEvent === ev.id ? 'text-secondary bg-secondary/5' : 'text-white/80'
                                                }`}
                                            >
                                                <Trophy className="w-3 h-3 inline mr-2 text-secondary/50" />
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
                                        className={`px-5 py-2.5 rounded-none text-sm font-bold transition-all duration-200 min-h-[44px] flex items-center gap-2 ${
                                            selectedDojo
                                                ? "bg-white/20 text-white border border-white/30"
                                                : "bg-surface/80 text-white/70 hover:bg-surface-hover hover:text-white border border-white/10 backdrop-blur-sm"
                                        }`}
                                    >
                                        <MapPin className="w-3.5 h-3.5" />
                                        {selectedDojo ? uniqueDojos.find(d => d.id === selectedDojo)?.name.split(',')[0].substring(0, 20) : "By Dojo"}
                                    </button>
                                    <div className="absolute top-full left-0 mt-2 w-72 bg-surface border border-white/15 rounded-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-30">
                                        <button
                                            onClick={() => setSelectedDojo(null)}
                                            className={`w-full px-4 py-3 text-left text-sm hover:bg-surface-hover transition-colors ${!selectedDojo ? 'text-primary-light' : 'text-white/70'}`}
                                        >
                                            All Dojos
                                        </button>
                                        {uniqueDojos.map(dojo => (
                                            <button
                                                key={dojo.id}
                                                onClick={() => { setFilter("all"); setSelectedDojo(dojo.id); setSelectedEvent(null); }}
                                                className={`w-full px-4 py-3 text-left text-sm hover:bg-surface-hover transition-colors border-t border-white/5 ${
                                                    selectedDojo === dojo.id ? 'text-white bg-white/5' : 'text-white/80'
                                                }`}
                                            >
                                                <MapPin className="w-3 h-3 inline mr-2 text-white/50" />
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
                                    className="text-xs text-white/70 hover:text-primary-light transition-colors flex items-center gap-1"
                                >
                                    <X className="w-3 h-3" /> Clear filters
                                </button>
                            )}
                            {token && (
                                <button
                                    onClick={() => setShowUpload(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-primary hover:bg-primary-dark text-white rounded-none text-sm font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                                >
                                    <Upload className="w-4 h-4" />
                                    Upload Photo
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Results summary */}
                    <div className="flex items-center gap-2 text-xs text-white/70">
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>
                            Showing {items.length} photo{items.length !== 1 ? 's' : ''}
                            {selectedEvent && <> in <span className="text-secondary">{uniqueEvents.find(e => e.id === selectedEvent)?.name}</span></>}
                            {selectedDojo && <> from <span className="text-white">{uniqueDojos.find(d => d.id === selectedDojo)?.name}</span></>}
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
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-surface/80 border border-white/10 flex items-center justify-center">
                            <ImageIcon className="w-10 h-10 text-white/40" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Photos Found</h3>
                        <p className="text-white/80 max-w-md mx-auto">
                            {filter === "featured"
                                ? "No featured photos yet. Check back soon!"
                                : selectedEvent || selectedDojo
                                    ? "No photos match this filter. Try another category."
                                    : "The gallery is empty. Be the first to share a training moment!"}
                        </p>
                        {(selectedEvent || selectedDojo) && (
                            <button
                                onClick={() => { setSelectedEvent(null); setSelectedDojo(null); setFilter("all"); }}
                                className="mt-6 inline-flex items-center gap-2 px-6 py-3 min-h-[44px] bg-transparent border border-white/20 hover:bg-white/10 text-white rounded-none font-bold uppercase tracking-wider transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                            >
                                <X className="w-4 h-4" />
                                Clear Filters
                            </button>
                        )}
                        {token && !selectedEvent && !selectedDojo && (
                            <button
                                onClick={() => setShowUpload(true)}
                                className="mt-6 inline-flex items-center gap-2 px-6 py-3 min-h-[44px] bg-primary hover:bg-primary-dark text-white rounded-none font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
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
                                    onDelete={isAdmin ? setDeleteTarget : undefined}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && !selectedEvent && !selectedDojo && (
                            <div className="flex items-center justify-center gap-3 mt-12">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-5 py-2.5 bg-transparent border border-white/20 rounded-none text-sm font-bold uppercase tracking-wider disabled:opacity-30 hover:bg-white/10 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
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
                                                className={`w-11 h-11 rounded-none text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                                                    page === pageNum
                                                        ? "bg-primary hover:bg-primary-dark text-white"
                                                        : "bg-transparent text-white/80 hover:bg-white/10 border border-white/20"
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
                                    className="px-5 py-2.5 bg-transparent border border-white/20 rounded-none text-sm font-bold uppercase tracking-wider disabled:opacity-30 hover:bg-white/10 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
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
                            className="bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[85vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold">Upload Photos</h3>
                                    <p className="text-xs text-white/80 mt-1">Select multiple photos to upload at once</p>
                                </div>
                                <button
                                    onClick={() => !uploading && clearAllUploads()}
                                    className="text-white/55 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Selected photos preview grid */}
                            {uploadPreviews.length > 0 && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                                    {uploadPreviews.map((preview, i) => (
                                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                                            <img src={preview} alt="" className="w-full h-full object-cover" />
                                            {!uploading && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeUploadFile(i); }}
                                                    className="absolute top-1 right-1 p-0.5 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3 text-white" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {/* Add more button */}
                                    {!uploading && (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="aspect-square rounded-lg border-2 border-dashed border-white/10 hover:border-primary/30 flex items-center justify-center transition-colors"
                                        >
                                            <Upload className="w-5 h-5 text-white/40" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Drag & Drop Zone (when no files selected) */}
                            {uploadPreviews.length === 0 && (
                                <div
                                    ref={dropZoneRef}
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 mb-4 ${
                                        isDragging
                                            ? "border-primary bg-primary/10 scale-[1.02]"
                                            : "border-white/20 hover:border-primary/50"
                                    }`}
                                >
                                    <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center transition-colors ${isDragging ? 'bg-primary/20' : 'bg-white/5'}`}>
                                        <Upload className={`w-7 h-7 ${isDragging ? 'text-primary-light' : 'text-white/55'}`} />
                                    </div>
                                    <p className="text-sm text-white/80 font-medium mb-1">
                                        {isDragging ? "Drop your photos here" : "Drag & drop or click to select"}
                                    </p>
                                    <p className="text-xs text-white/70">Select multiple &middot; JPG, PNG, WebP &middot; Max 5MB each</p>
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            {uploadFiles.length > 0 && (
                                <p className="text-xs text-white/55 mb-3">
                                    {uploadFiles.length} photo{uploadFiles.length > 1 ? "s" : ""} selected
                                    {uploadProgress && <span className="ml-2 text-primary-light">&middot; {uploadProgress}</span>}
                                </p>
                            )}

                            {/* Caption (for single photo) */}
                            {uploadFiles.length === 1 && (
                                <input
                                    type="text"
                                    placeholder="Add a caption (optional)"
                                    value={uploadCaption}
                                    onChange={(e) => setUploadCaption(e.target.value)}
                                    className="w-full bg-surface-hover/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/55 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 mb-4 transition-all"
                                    maxLength={200}
                                />
                            )}

                            {user?.role === "STUDENT" && (
                                <div className="flex items-center gap-2 text-xs text-white/80 mb-4 bg-secondary/5 border border-secondary/10 rounded-lg px-3 py-2">
                                    <Info className="w-3.5 h-3.5 text-secondary" />
                                    Your photos will be reviewed before appearing in the gallery.
                                </div>
                            )}

                            <button
                                onClick={handleUpload}
                                disabled={uploadFiles.length === 0 || uploading}
                                className="w-full py-3 min-h-[44px] bg-primary hover:bg-primary-dark disabled:bg-white/5 disabled:text-white/70 text-white rounded-none font-bold uppercase tracking-wider text-sm transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                            >
                                {uploading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> {uploadProgress || "Uploading..."}</>
                                ) : (
                                    <><Upload className="w-4 h-4" /> Upload {uploadFiles.length > 1 ? `${uploadFiles.length} Photos` : "Photo"}</>
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
                                <div className="text-sm text-white/70 font-mono bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                                    {lightboxIndex + 1} / {items.length}
                                </div>
                                {currentItem.isPublicFeatured && (
                                    <div className="flex items-center gap-1 text-xs text-secondary bg-secondary/10 px-2.5 py-1 rounded-full border border-secondary/20">
                                        <Star className="w-3 h-3 fill-current" /> Featured
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowLightboxInfo(prev => !prev); }}
                                    className={`p-2.5 rounded-full transition-all ${showLightboxInfo ? 'bg-primary/20 text-primary-light' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
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
                                {isAdmin && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(currentItem); }}
                                        className="p-2.5 rounded-full bg-white/5 text-primary-light/60 hover:bg-primary/20 hover:text-primary-light transition-all"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                                <div className="w-px h-5 bg-white/10 mx-1" />
                                <button
                                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); setZoomed(false); }}
                                    className="p-2.5 rounded-full bg-white/5 text-white/60 hover:bg-primary/20 hover:text-primary-light transition-all"
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
                                        className="mt-4 bg-surface/80 backdrop-blur-xl rounded-xl px-6 py-4 text-center border border-white/10 max-w-lg"
                                    >
                                        {currentItem.caption && (
                                            <p className="text-white font-semibold mb-2 text-lg">{currentItem.caption}</p>
                                        )}
                                        <div className="flex items-center justify-center gap-3 flex-wrap">
                                            <span className="text-sm text-white/70">
                                                by <span className="text-white">{currentItem.uploader.name}</span>
                                            </span>
                                            {currentItem.event && (
                                                <span className="text-xs text-secondary bg-secondary/10 px-2 py-0.5 rounded-full border border-secondary/20 flex items-center gap-1">
                                                    <Trophy className="w-2.5 h-2.5" />
                                                    {currentItem.event.name}
                                                </span>
                                            )}
                                            {currentItem.dojo && (
                                                <span className="text-xs text-white bg-white/10 px-2 py-0.5 rounded-full border border-white/20 flex items-center gap-1">
                                                    <MapPin className="w-2.5 h-2.5" />
                                                    {currentItem.dojo.name}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-white/70 mt-2">
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
                                                ? 'border-primary opacity-100 scale-110 shadow-lg shadow-primary/25'
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
