"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
    Camera, X, ChevronLeft, ChevronRight, Upload, Loader2, ImageIcon,
    Download, Share2, ZoomIn, ZoomOut, Info, Eye, Trash2, ArrowLeft,
    Tent, GraduationCap, Trophy, Swords, Dumbbell, Calendar,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/contexts/ToastContext";
import { getImageUrl } from "@/lib/imageUtils";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Photo {
    id: string;
    imageUrl: string;
    caption: string | null;
    uploadedAt: string;
    isPublicFeatured: boolean;
    uploader: { id: string; name: string };
    order: number;
}

interface AlbumDetail {
    id: string;
    name: string;
    description: string | null;
    coverImageUrl: string | null;
    type: string;
    date: string | null;
    photoCount: number;
    creator: { id: string; name: string };
    event: { id: string; name: string } | null;
}

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Camera; color: string }> = {
    CAMP: { label: "Camp", icon: Tent, color: "text-emerald-400" },
    SEMINAR: { label: "Seminar", icon: GraduationCap, color: "text-blue-400" },
    TOURNAMENT: { label: "Tournament", icon: Trophy, color: "text-amber-400" },
    BELT_EXAM: { label: "Grading", icon: Swords, color: "text-red-400" },
    TRAINING: { label: "Training", icon: Dumbbell, color: "text-purple-400" },
    GENERAL: { label: "General", icon: Camera, color: "text-zinc-400" },
};

// Seeded random for consistent per-photo rotation/offset
function seededRandom(seed: number) {
    const x = Math.sin(seed * 9301 + 49297) * 49297;
    return x - Math.floor(x);
}

function FloatingPhotoCard({ photo, index, onClick, onDelete }: { photo: Photo; index: number; onClick: () => void; onDelete?: () => void }) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);
    const imgUrl = getImageUrl(photo.imageUrl);

    // Per-card random rotation and offset (stable across re-renders)
    const rotation = useMemo(() => (seededRandom(index + 1) - 0.5) * 6, [index]); // -3 to +3 deg
    const offsetY = useMemo(() => (seededRandom(index + 100) - 0.5) * 12, [index]); // -6 to +6 px

    // 3D tilt
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 25 });
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 25 });

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
        setIsHovered(false);
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
            initial={{ opacity: 0, y: 30, rotate: rotation }}
            animate={inView ? {
                opacity: 1,
                y: isHovered ? -8 : offsetY,
                rotate: isHovered ? 0 : rotation,
                scale: isHovered ? 1.05 : 1,
            } : {}}
            transition={{
                opacity: { duration: 0.5, delay: Math.min(index * 0.05, 0.5) },
                y: { type: "spring", stiffness: 200, damping: 20 },
                rotate: { type: "spring", stiffness: 200, damping: 20 },
                scale: { type: "spring", stiffness: 300, damping: 25 },
            }}
            className="break-inside-avoid mb-5 cursor-pointer"
            style={{ perspective: 600 }}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <motion.div
                className="relative rounded-2xl overflow-hidden border border-white/[0.08] group"
                style={{
                    rotateX: isHovered ? rotateX : 0,
                    rotateY: isHovered ? rotateY : 0,
                    transformStyle: "preserve-3d",
                    boxShadow: isHovered
                        ? "0 25px 50px rgba(0,0,0,0.5), 0 0 40px rgba(220,38,38,0.05)"
                        : "0 10px 30px rgba(0,0,0,0.3)",
                }}
            >
                {/* Loading shimmer */}
                {!loaded && !error && (
                    <div className="w-full aspect-[4/3] bg-zinc-900/80 rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent animate-shimmer" />
                    </div>
                )}
                {error && (
                    <div className="w-full aspect-[4/3] bg-zinc-900 rounded-2xl flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-zinc-800" />
                    </div>
                )}
                {inView && imgUrl && (
                    <img
                        src={imgUrl}
                        alt={photo.caption || "Photo"}
                        className={`w-full rounded-2xl transition-all duration-700 group-hover:scale-110 ${loaded ? "opacity-100" : "opacity-0 absolute"}`}
                        loading="lazy"
                        onLoad={() => setLoaded(true)}
                        onError={() => setError(true)}
                    />
                )}
                {/* Hover overlay — frosted glass */}
                {loaded && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-2xl flex flex-col justify-end p-5">
                        <div style={{ backdropFilter: "blur(6px)" }} className="absolute inset-x-0 bottom-0 h-24 rounded-b-2xl" />
                        <div className="relative z-10">
                            {photo.caption && (
                                <p className="text-sm font-semibold text-white mb-1 drop-shadow-lg">{photo.caption}</p>
                            )}
                            <p className="text-xs text-gray-400">by {photo.uploader.name}</p>
                            <div className="flex gap-2 mt-3">
                                <button className="p-2 rounded-full border border-white/10 hover:bg-white/15 text-white transition-all hover:scale-110" style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)" }} title="View">
                                    <Eye className="w-3.5 h-3.5" />
                                </button>
                                {onDelete && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                        className="p-2 rounded-full border border-red-500/20 hover:bg-red-500/30 text-red-400 transition-all hover:scale-110"
                                        style={{ background: "rgba(220,38,38,0.1)", backdropFilter: "blur(8px)" }}
                                        title="Delete"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}

export default function AlbumDetailPage() {
    const params = useParams();
    const albumId = params.id as string;
    const { user, token } = useAuthStore();
    const { showToast } = useToast();

    const [album, setAlbum] = useState<AlbumDetail | null>(null);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Lightbox
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [zoomed, setZoomed] = useState(false);
    const [showInfo, setShowInfo] = useState(true);

    // Upload (multi-file)
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);
    const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);
    const [uploadProgress, setUploadProgress] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isAdmin = user?.role === "ADMIN";
    const isInstructor = user?.role === "INSTRUCTOR";
    const canUpload = !!token;

    const fetchAlbum = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/albums/${albumId}?page=${page}&limit=48`);
            setAlbum(res.data.data.album);
            setPhotos(res.data.data.photos);
            setTotalPages(res.data.data.pagination.totalPages);
        } catch (error) {
            console.error("Failed to fetch album", error);
        } finally {
            setIsLoading(false);
        }
    }, [albumId, page]);

    useEffect(() => { fetchAlbum(); }, [fetchAlbum]);

    // Lightbox keyboard navigation
    useEffect(() => {
        if (lightboxIndex === null) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") { setLightboxIndex(null); setZoomed(false); }
            if (e.key === "ArrowRight") setLightboxIndex(p => p !== null ? Math.min(p + 1, photos.length - 1) : null);
            if (e.key === "ArrowLeft") setLightboxIndex(p => p !== null ? Math.max(p - 1, 0) : null);
            if (e.key === "i" || e.key === "I") setShowInfo(p => !p);
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [lightboxIndex, photos.length]);

    // Lock body scroll for lightbox
    useEffect(() => {
        document.body.style.overflow = lightboxIndex !== null ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [lightboxIndex]);

    useEffect(() => { setZoomed(false); }, [lightboxIndex]);

    // Touch swipe
    const touchStartX = useRef<number | null>(null);
    const handleTouchStart = useCallback((e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; }, []);
    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (touchStartX.current === null || lightboxIndex === null) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            if (diff > 0 && lightboxIndex < photos.length - 1) setLightboxIndex(lightboxIndex + 1);
            if (diff < 0 && lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1);
        }
        touchStartX.current = null;
    }, [lightboxIndex, photos.length]);

    const addFiles = (newFiles: FileList | File[]) => {
        const valid: File[] = [];
        for (const f of Array.from(newFiles)) {
            if (f.size > 5 * 1024 * 1024) { showToast(`${f.name} exceeds 5MB, skipped`, "error"); continue; }
            if (!f.type.startsWith("image/")) { showToast(`${f.name} is not an image, skipped`, "error"); continue; }
            valid.push(f);
        }
        setUploadFiles(prev => [...prev, ...valid]);
        setUploadPreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))]);
    };

    const removeFile = (index: number) => {
        URL.revokeObjectURL(uploadPreviews[index]);
        setUploadFiles(prev => prev.filter((_, i) => i !== index));
        setUploadPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const clearUploadState = () => {
        uploadPreviews.forEach(p => URL.revokeObjectURL(p));
        setUploadFiles([]);
        setUploadPreviews([]);
        setUploadProgress("");
        setShowUpload(false);
    };

    const handleUpload = async () => {
        if (uploadFiles.length === 0 || !token) return;
        setUploading(true);
        try {
            if (uploadFiles.length === 1) {
                // Single file — use original endpoint
                setUploadProgress("Uploading 1/1...");
                const fd = new FormData();
                fd.append("image", uploadFiles[0]);
                const uploadRes = await api.post("/upload?folder=gallery", fd, { headers: { "Content-Type": "multipart/form-data" } });
                const imageUrl = uploadRes.data.data.url;
                await api.post("/gallery", { imageUrl, albumId });
            } else {
                // Multi file — use batch endpoint
                setUploadProgress(`Uploading ${uploadFiles.length} photos...`);
                const fd = new FormData();
                uploadFiles.forEach(f => fd.append("images", f));
                const uploadRes = await api.post("/upload/multiple?folder=gallery", fd, { headers: { "Content-Type": "multipart/form-data" } });
                const files = uploadRes.data.data.files as { url: string }[];
                // Create gallery items and link to album
                for (let i = 0; i < files.length; i++) {
                    setUploadProgress(`Saving ${i + 1}/${files.length}...`);
                    await api.post("/gallery", { imageUrl: files[i].url, albumId });
                }
            }
            clearUploadState();
            showToast(`${uploadFiles.length} photo${uploadFiles.length > 1 ? "s" : ""} uploaded to album!`, "success");
            fetchAlbum();
        } catch {
            showToast("Upload failed", "error");
        } finally {
            setUploading(false);
            setUploadProgress("");
        }
    };

    const handleDownload = async (url: string, caption: string | null) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = caption ? `${caption.replace(/[^a-z0-9]/gi, "_")}.jpg` : "kkfi-photo.jpg";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch {
            showToast("Download failed", "error");
        }
    };

    const handleDeletePhoto = async (photoId: string) => {
        try {
            await api.delete(`/gallery/${photoId}`);
            showToast("Photo deleted", "success");
            if (lightboxIndex !== null) setLightboxIndex(null);
            fetchAlbum();
        } catch {
            showToast("Delete failed", "error");
        }
    };

    const currentPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;
    const currentPhotoUrl = currentPhoto ? getImageUrl(currentPhoto.imageUrl) : null;
    const config = album ? (TYPE_CONFIG[album.type] || TYPE_CONFIG.GENERAL) : TYPE_CONFIG.GENERAL;
    const TypeIcon = config.icon;
    const coverUrl = album?.coverImageUrl ? getImageUrl(album.coverImageUrl) : null;

    if (isLoading && !album) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
        );
    }

    if (!album) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
                <p className="text-zinc-500 text-lg">Album not found</p>
                <Link href="/gallery" className="text-red-400 hover:text-red-300 text-sm">Back to Gallery</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050507] text-white">
            {/* Album Header */}
            <div className="relative overflow-hidden">
                {coverUrl ? (
                    <div className="absolute inset-0">
                        <img src={coverUrl} alt="" className="w-full h-full object-cover opacity-20 blur-2xl scale-125" />
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-[#050507] to-[#050507]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-[#050507]/30 via-[#050507]/70 to-[#050507]" />

                <div className="relative max-w-7xl mx-auto px-4 pt-24 pb-10 sm:pt-28 sm:pb-14">
                    {/* Breadcrumb */}
                    <Link
                        href="/gallery"
                        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Gallery
                    </Link>

                    <div className="flex flex-col sm:flex-row items-start gap-6">
                        {/* Cover thumbnail */}
                        {coverUrl && (
                            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-xl overflow-hidden border border-white/10 shadow-2xl flex-shrink-0">
                                <img src={coverUrl} alt={album.name} className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1`}>
                                    <TypeIcon className={`w-3.5 h-3.5 ${config.color}`} />
                                    <span className="text-xs font-semibold text-zinc-300">{config.label}</span>
                                </div>
                                {album.date && (
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(album.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                                    </div>
                                )}
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{album.name}</h1>
                            {album.description && (
                                <p className="mt-2 text-zinc-400 text-sm max-w-2xl">{album.description}</p>
                            )}
                            <p className="mt-3 text-xs text-zinc-600">
                                {album.photoCount} photo{album.photoCount !== 1 ? "s" : ""} &middot; Created by {album.creator.name}
                            </p>
                        </div>
                    </div>

                    {/* Upload button */}
                    {canUpload && (
                        <div className="mt-6">
                            <button
                                onClick={() => setShowUpload(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                Upload Photo
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Photos Grid — Floating Gallery */}
            <div className="max-w-7xl mx-auto px-4 pb-16">
                {photos.length === 0 ? (
                    <div className="text-center py-24">
                        <ImageIcon className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
                        <p className="text-zinc-600">No photos in this album yet</p>
                    </div>
                ) : (
                    <div className="columns-2 md:columns-3 lg:columns-4 gap-5">
                        {photos.map((photo, i) => (
                            <FloatingPhotoCard
                                key={photo.id}
                                photo={photo}
                                index={i}
                                onClick={() => setLightboxIndex(i)}
                                onDelete={(isAdmin || photo.uploader.id === user?.id) ? () => handleDeletePhoto(photo.id) : undefined}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-12">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`w-10 h-10 rounded-full text-sm font-semibold transition-all ${
                                    p === page ? "bg-red-600 text-white" : "bg-zinc-900 text-zinc-400 border border-white/5 hover:bg-zinc-800"
                                }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            <AnimatePresence>
                {showUpload && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowUpload(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold">Upload to {album.name}</h3>
                                <button onClick={() => { if (!uploading) clearUploadState(); }} className="p-1 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
                            </div>

                            {/* Selected files preview grid */}
                            {uploadPreviews.length > 0 && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                                    {uploadPreviews.map((preview, i) => (
                                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                                            <img src={preview} alt="" className="w-full h-full object-cover" />
                                            {!uploading && (
                                                <button
                                                    onClick={() => removeFile(i)}
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
                                            className="aspect-square rounded-lg border-2 border-dashed border-white/10 hover:border-red-500/30 flex items-center justify-center transition-colors"
                                        >
                                            <Upload className="w-5 h-5 text-zinc-600" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Drop zone (when no files selected) */}
                            {uploadPreviews.length === 0 && (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center cursor-pointer hover:border-red-500/30 transition-colors mb-4"
                                >
                                    <Upload className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                                    <p className="text-sm text-zinc-500">Click to select photos</p>
                                    <p className="text-xs text-zinc-600 mt-1">Select multiple &middot; Max 5MB each &middot; JPG, PNG, WebP</p>
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) addFiles(e.target.files);
                                    e.target.value = "";
                                }}
                            />

                            {uploadFiles.length > 0 && (
                                <p className="text-xs text-zinc-500 mb-4">
                                    {uploadFiles.length} photo{uploadFiles.length > 1 ? "s" : ""} selected
                                    {uploadProgress && <span className="ml-2 text-red-400">&middot; {uploadProgress}</span>}
                                </p>
                            )}

                            <button
                                onClick={handleUpload}
                                disabled={uploadFiles.length === 0 || uploading}
                                className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                {uploading ? uploadProgress || "Uploading..." : `Upload ${uploadFiles.length > 1 ? `${uploadFiles.length} Photos` : "Photo"}`}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxIndex !== null && currentPhoto && currentPhotoUrl && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center"
                        onClick={() => { setLightboxIndex(null); setZoomed(false); }}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        {/* Close */}
                        <button className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm" onClick={() => { setLightboxIndex(null); setZoomed(false); }}>
                            <X className="w-5 h-5" />
                        </button>

                        {/* Nav arrows */}
                        {lightboxIndex > 0 && (
                            <button className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full" onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}>
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        )}
                        {lightboxIndex < photos.length - 1 && (
                            <button className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full" onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}>
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        )}

                        {/* Image */}
                        <img
                            src={currentPhotoUrl}
                            alt={currentPhoto.caption || "Photo"}
                            className={`max-h-[85vh] max-w-[90vw] object-contain rounded-lg transition-transform duration-300 ${zoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"}`}
                            onClick={(e) => { e.stopPropagation(); setZoomed(!zoomed); }}
                        />

                        {/* Bottom bar */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                            <div className="max-w-4xl mx-auto flex items-center justify-between">
                                <div>
                                    {showInfo && (
                                        <>
                                            {currentPhoto.caption && <p className="text-sm font-semibold">{currentPhoto.caption}</p>}
                                            <p className="text-xs text-zinc-400">by {currentPhoto.uploader.name} &middot; {new Date(currentPhoto.uploadedAt).toLocaleDateString()}</p>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }} className="p-2 rounded-full bg-white/10 hover:bg-white/20" title="Info (i)">
                                        <Info className="w-4 h-4" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setZoomed(!zoomed); }} className="p-2 rounded-full bg-white/10 hover:bg-white/20" title="Zoom">
                                        {zoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDownload(currentPhotoUrl!, currentPhoto.caption); }} className="p-2 rounded-full bg-white/10 hover:bg-white/20" title="Download">
                                        <Download className="w-4 h-4" />
                                    </button>
                                    {(isAdmin || currentPhoto.uploader.id === user?.id) && (
                                        <button onClick={(e) => { e.stopPropagation(); handleDeletePhoto(currentPhoto.id); }} className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400" title="Delete">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {/* Counter */}
                            <div className="text-center mt-2">
                                <span className="text-xs text-zinc-500">{lightboxIndex + 1} / {photos.length}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
