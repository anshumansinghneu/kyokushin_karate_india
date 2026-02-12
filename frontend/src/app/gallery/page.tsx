"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, ChevronLeft, ChevronRight, Upload, Star, Loader2, ImageIcon } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

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

type Category = "all" | "featured" | "training" | "events" | "ceremonies";

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
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchGallery = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: "24" });
            if (category === "featured") params.set("category", "featured");
            const res = await api.get(`/gallery?${params.toString()}`);
            setItems(res.data.data.items);
            setTotalPages(res.data.data.pagination.totalPages);
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
            if (e.key === "Escape") setLightboxIndex(null);
            if (e.key === "ArrowRight") setLightboxIndex((prev) => prev !== null ? Math.min(prev + 1, items.length - 1) : null);
            if (e.key === "ArrowLeft") setLightboxIndex((prev) => prev !== null ? Math.max(prev - 1, 0) : null);
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadFile(file);
            setUploadPreview(URL.createObjectURL(file));
        }
    };

    const handleUpload = async () => {
        if (!uploadFile || !token) return;
        setUploading(true);
        try {
            // 1. Upload image to Supabase via backend
            const formData = new FormData();
            formData.append("image", uploadFile);
            const uploadRes = await api.post("/upload?folder=gallery", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const imageUrl = uploadRes.data.data.url;

            // 2. Create gallery item
            await api.post("/gallery", {
                imageUrl,
                caption: uploadCaption || null,
            });

            // Reset form and refresh
            setShowUpload(false);
            setUploadFile(null);
            setUploadPreview(null);
            setUploadCaption("");
            fetchGallery();
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const categories: { id: Category; label: string }[] = [
        { id: "all", label: "All Photos" },
        { id: "featured", label: "Featured" },
    ];

    const currentItem = lightboxIndex !== null ? items[lightboxIndex] : null;

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-12">
            <div className="container mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-3 mb-4">
                        <Camera className="w-8 h-8 text-red-500" />
                        <span className="text-sm font-bold text-red-500 tracking-[0.3em] uppercase">KKFI Gallery</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-4">
                        PHOTO <span className="text-red-600">GALLERY</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Capturing the spirit of Kyokushin — training sessions, tournaments, belt ceremonies, and unforgettable moments.
                    </p>
                </motion.div>

                {/* Category Filter + Upload Button */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setCategory(cat.id)}
                                className={`px-4 py-2.5 rounded-full text-sm font-bold transition-all duration-200 min-h-[44px] flex items-center active:scale-95 ${
                                    category === cat.id
                                        ? "bg-red-600 text-white shadow-lg shadow-red-600/25"
                                        : "bg-zinc-900 text-gray-400 hover:bg-zinc-800 hover:text-white border border-white/10"
                                }`}
                            >
                                {cat.id === "featured" && <Star className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
                                {cat.label}
                            </button>
                        ))}
                    </div>
                    {token && (
                        <button
                            onClick={() => setShowUpload(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-bold transition-all"
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
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-zinc-900 flex items-center justify-center">
                            <ImageIcon className="w-10 h-10 text-zinc-700" />
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
                                    {/* Overlay - always visible on mobile, hover on desktop */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex flex-col justify-end p-4">
                                        {item.caption && (
                                            <p className="text-sm font-medium text-white mb-1">{item.caption}</p>
                                        )}
                                        <p className="text-xs text-gray-400">
                                            by {item.uploader.name}
                                        </p>
                                        {item.event && (
                                            <p className="text-xs text-red-400 mt-1">{item.event.name}</p>
                                        )}
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
                                    className="px-4 py-2.5 bg-zinc-900 border border-white/10 rounded-lg text-sm font-bold disabled:opacity-30 hover:bg-zinc-800 transition-colors min-h-[44px]"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-500">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2.5 bg-zinc-900 border border-white/10 rounded-lg text-sm font-bold disabled:opacity-30 hover:bg-zinc-800 transition-colors min-h-[44px]"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Upload Modal */}
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
                                        className="text-gray-500 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* File Drop Area */}
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-red-500/50 transition-colors mb-4"
                                >
                                    {uploadPreview ? (
                                        <img
                                            src={uploadPreview}
                                            alt="Preview"
                                            className="max-h-48 mx-auto rounded-lg"
                                        />
                                    ) : (
                                        <>
                                            <Camera className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                                            <p className="text-sm text-gray-400">Click to select a photo</p>
                                            <p className="text-xs text-gray-600 mt-1">JPG, PNG, WebP — max 5MB</p>
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

                                {/* Info note */}
                                {user?.role === "STUDENT" && (
                                    <p className="text-xs text-gray-500 mb-4">
                                        Your photo will be reviewed before appearing in the gallery.
                                    </p>
                                )}

                                {/* Submit */}
                                <button
                                    onClick={handleUpload}
                                    disabled={!uploadFile || uploading}
                                    className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-gray-600 text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            Upload Photo
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Lightbox */}
                <AnimatePresence>
                    {lightboxIndex !== null && currentItem && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
                            onClick={() => setLightboxIndex(null)}
                            onTouchStart={handleTouchStart}
                            onTouchEnd={handleTouchEnd}
                        >
                            {/* Close button */}
                            <button
                                onClick={() => setLightboxIndex(null)}
                                className="absolute top-6 right-6 text-white/60 hover:text-white z-10"
                            >
                                <X className="w-8 h-8" />
                            </button>

                            {/* Nav: Previous */}
                            {lightboxIndex > 0 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setLightboxIndex(lightboxIndex - 1);
                                    }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-all z-10"
                                >
                                    <ChevronLeft className="w-8 h-8" />
                                </button>
                            )}

                            {/* Nav: Next */}
                            {lightboxIndex < items.length - 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setLightboxIndex(lightboxIndex + 1);
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-all z-10"
                                >
                                    <ChevronRight className="w-8 h-8" />
                                </button>
                            )}

                            {/* Image */}
                            <motion.div
                                key={currentItem.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="max-w-[90vw] max-h-[85vh] flex flex-col items-center"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <img
                                    src={currentItem.imageUrl}
                                    alt={currentItem.caption || "Gallery photo"}
                                    className="max-w-full max-h-[75vh] object-contain rounded-lg"
                                />
                                <div className="mt-4 text-center">
                                    {currentItem.caption && (
                                        <p className="text-white font-medium mb-1">{currentItem.caption}</p>
                                    )}
                                    <p className="text-sm text-gray-500">
                                        by {currentItem.uploader.name}
                                        {currentItem.event && (
                                            <span className="text-red-400"> &middot; {currentItem.event.name}</span>
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        {new Date(currentItem.uploadedAt).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
