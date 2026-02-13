"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, ChevronLeft, ChevronRight, Upload, Star, Loader2, ImageIcon, Download, Share2, ZoomIn, ZoomOut, Info } from "lucide-react";
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

type Category = "all" | "featured";

export default function GalleryPage() {
    const { user, token } = useAuthStore();
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [category, setCategory] = useState<Category>("all");
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
    const [showLightboxInfo, setShowLightboxInfo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();

    const fetchGallery = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: "24" });
            if (category === "featured") params.set("category", "featured");
            const res = await api.get(`/gallery?${params.toString()}`);
            setItems(res.data.data.items);
            setTotalPages(res.data.data.pagination.totalPages);
            setTotalItems(res.data.data.pagination.total || res.data.data.items.length);
        } catch (error) {
            console.error("Failed to fetch gallery", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, category]);

    useEffect(() => {
        fetchGallery();
    }, [fetchGallery]);

    useEffect(() => {
        setPage(1);
    }, [category]);

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
        setShowLightboxInfo(false);
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

    // Drag and drop handlers
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

    const categories: { id: Category; label: string; icon?: typeof Star }[] = [
        { id: "all", label: "All Photos" },
        { id: "featured", label: "Featured", icon: Star },
    ];

    const currentItem = lightboxIndex !== null ? items[lightboxIndex] : null;

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden selection:bg-red-500/30">
            {/* Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_rgba(220,38,38,0.05),_transparent_60%)]" />
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-[0.03]" />
            </div>

            <div className="container mx-auto px-4 pt-24 pb-12 relative z-10">
                {/* Hero Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold uppercase tracking-[0.2em] mb-6 backdrop-blur-md"
                    >
                        <Camera className="w-4 h-4" /> KKFI Gallery
                    </motion.div>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6">
                        PHOTO{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-red-600">
                            GALLERY
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Capturing the spirit of Kyokushin — training sessions, tournaments,
                        belt ceremonies, and unforgettable moments.
                    </p>
                    {totalItems > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="mt-6 inline-flex items-center gap-4"
                        >
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                                <ImageIcon className="w-4 h-4 text-red-400" />
                                <span className="text-sm font-bold text-gray-300">{totalItems} Photos</span>
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* Category Filter + Upload Button */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setCategory(cat.id)}
                                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 min-h-[44px] flex items-center gap-2 active:scale-95 ${
                                    category === cat.id
                                        ? "bg-red-600 text-white shadow-lg shadow-red-600/25"
                                        : "bg-zinc-900 text-gray-400 hover:bg-zinc-800 hover:text-white border border-white/10"
                                }`}
                            >
                                {cat.icon && <cat.icon className="w-3.5 h-3.5" />}
                                {cat.label}
                            </button>
                        ))}
                    </div>
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

                {/* Gallery Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-32">
                        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
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
                        <h3 className="text-xl font-bold text-gray-400 mb-2">No Photos Yet</h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                            {category === "featured"
                                ? "No featured photos yet. Check back soon!"
                                : "The gallery is empty. Be the first to share a training moment!"}
                        </p>
                        {token && (
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
                        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                            {items.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="break-inside-avoid group cursor-pointer relative overflow-hidden rounded-xl"
                                    onClick={() => setLightboxIndex(index)}
                                >
                                    <img
                                        src={item.imageUrl}
                                        alt={item.caption || "Gallery photo"}
                                        className="w-full rounded-xl transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex flex-col justify-end p-4">
                                        {item.caption && (
                                            <p className="text-sm font-medium text-white mb-1">{item.caption}</p>
                                        )}
                                        <p className="text-xs text-gray-400">by {item.uploader.name}</p>
                                        {item.event && (
                                            <p className="text-xs text-red-400 mt-1">{item.event.name}</p>
                                        )}
                                        {/* Quick action buttons */}
                                        <div className="flex gap-2 mt-3 opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleShare(item); }}
                                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                                                title="Share"
                                            >
                                                <Share2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDownload(item.imageUrl, item.caption); }}
                                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                                                title="Download"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    {/* Featured badge */}
                                    {item.isPublicFeatured && (
                                        <div className="absolute top-3 right-3 bg-yellow-500/90 text-black px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                                            <Star className="w-2.5 h-2.5" /> Featured
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
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
                                                        ? "bg-red-600 text-white"
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

                {/* Upload Modal — with drag & drop */}
                <AnimatePresence>
                    {showUpload && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => !uploading && setShowUpload(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold">Upload Photo</h3>
                                    <button
                                        onClick={() => !uploading && setShowUpload(false)}
                                        className="text-gray-500 hover:text-white transition-colors p-1"
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
                                            : "border-white/20 hover:border-red-500/50"
                                    }`}
                                >
                                    {uploadPreview ? (
                                        <img
                                            src={uploadPreview}
                                            alt="Preview"
                                            className="max-h-48 mx-auto rounded-lg"
                                        />
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
                                    className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 mb-4"
                                    maxLength={200}
                                />

                                {user?.role === "STUDENT" && (
                                    <p className="text-xs text-gray-500 mb-4">
                                        Your photo will be reviewed before appearing in the gallery.
                                    </p>
                                )}

                                <button
                                    onClick={handleUpload}
                                    disabled={!uploadFile || uploading}
                                    className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-gray-600 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
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

                {/* Lightbox — with zoom, download, share, info */}
                <AnimatePresence>
                    {lightboxIndex !== null && currentItem && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center"
                            onClick={() => { setLightboxIndex(null); setZoomed(false); }}
                            onTouchStart={handleTouchStart}
                            onTouchEnd={handleTouchEnd}
                        >
                            {/* Top toolbar */}
                            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 md:px-6 py-4 z-20 bg-gradient-to-b from-black/60 to-transparent">
                                <div className="text-sm text-gray-400 font-mono bg-black/40 px-3 py-1 rounded-full">
                                    {lightboxIndex + 1} / {items.length}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowLightboxInfo(prev => !prev); }}
                                        className={`p-2.5 rounded-full transition-all ${showLightboxInfo ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
                                        title="Info (I)"
                                    >
                                        <Info className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setZoomed(prev => !prev); }}
                                        className="p-2.5 rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
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
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); setZoomed(false); }}
                                        className="p-2.5 rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all ml-1"
                                        title="Close (Esc)"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Nav: Previous */}
                            {lightboxIndex > 0 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
                                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-3 transition-all z-10"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                            )}

                            {/* Nav: Next */}
                            {lightboxIndex < items.length - 1 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
                                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-3 transition-all z-10"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            )}

                            {/* Image */}
                            <motion.div
                                key={currentItem.id}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.85 }}
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
                                        className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl shadow-black/50"
                                        draggable={false}
                                    />
                                </div>

                                {/* Info panel */}
                                <AnimatePresence>
                                    {showLightboxInfo && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="mt-4 bg-black/60 backdrop-blur-md rounded-xl px-6 py-4 text-center border border-white/10"
                                        >
                                            {currentItem.caption && (
                                                <p className="text-white font-medium mb-1">{currentItem.caption}</p>
                                            )}
                                            <p className="text-sm text-gray-400">
                                                by {currentItem.uploader.name}
                                                {currentItem.event && (
                                                    <span className="text-red-400"> &middot; {currentItem.event.name}</span>
                                                )}
                                            </p>
                                            {currentItem.dojo && (
                                                <p className="text-xs text-gray-500 mt-1">{currentItem.dojo.name}</p>
                                            )}
                                            <p className="text-xs text-gray-600 mt-1">
                                                {new Date(currentItem.uploadedAt).toLocaleDateString("en-IN", {
                                                    day: "numeric", month: "long", year: "numeric",
                                                })}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Thumbnail strip */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 max-w-[90vw] overflow-x-auto pb-1 px-4 scrollbar-hide">
                                {items.slice(Math.max(0, lightboxIndex - 4), Math.min(items.length, lightboxIndex + 5)).map((item, i) => {
                                    const realIndex = Math.max(0, lightboxIndex - 4) + i;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={(e) => { e.stopPropagation(); setLightboxIndex(realIndex); }}
                                            className={`w-12 h-12 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all ${
                                                realIndex === lightboxIndex ? 'border-red-500 opacity-100' : 'border-transparent opacity-40 hover:opacity-70'
                                            }`}
                                        >
                                            <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
