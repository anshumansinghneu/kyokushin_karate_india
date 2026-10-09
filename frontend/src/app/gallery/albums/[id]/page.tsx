"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Camera, X, ChevronLeft, ChevronRight, Upload, Loader2, ImageIcon,
    Download, ZoomIn, ZoomOut, Info, Trash2, ArrowLeft,
    Tent, GraduationCap, Trophy, Swords, Dumbbell, ExternalLink, Play,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/contexts/ToastContext";
import { getImageUrl } from "@/lib/imageUtils";
import VideoPlayer from "@/components/gallery/VideoPlayer";
import Link from "next/link";
import { useParams } from "next/navigation";

type MediaType = 'IMAGE' | 'VIDEO';

interface Photo {
    id: string;
    imageUrl: string;
    caption: string | null;
    uploadedAt: string;
    isPublicFeatured: boolean;
    uploader: { id: string; name: string };
    order: number;
    mediaType: MediaType;
    videoUrl: string | null;
    videoProvider: string | null;
    videoId: string | null;
    duration: number | null;
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
    SEMINAR: { label: "Seminar", icon: GraduationCap, color: "text-white" },
    TOURNAMENT: { label: "Tournament", icon: Trophy, color: "text-amber-400" },
    BELT_EXAM: { label: "Grading", icon: Swords, color: "text-primary-light" },
    TRAINING: { label: "Training", icon: Dumbbell, color: "text-purple-400" },
    GENERAL: { label: "General", icon: Camera, color: "text-white/70" },
};

function formatDuration(seconds: number | null): string | null {
    if (seconds == null || seconds < 0) return null;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function FloatingPhotoCard({ photo, index, onClick, onDelete }: { photo: Photo; index: number; onClick: () => void; onDelete?: () => void }) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [rowSpan, setRowSpan] = useState(20);
    const cardRef = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);
    const imgUrl = getImageUrl(photo.imageUrl);
    const isVideo = photo.mediaType === 'VIDEO';
    const durationLabel = formatDuration(photo.duration);

    const handleImageLoad = (img: HTMLImageElement) => {
        setLoaded(true);
        const rowHeight = 10;
        const gap = 20;
        const span = Math.ceil((img.getBoundingClientRect().height + gap) / (rowHeight + gap));
        setRowSpan(span);
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
            initial={false}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: Math.min((index % 12) * 0.03, 0.3), ease: [0.16, 1, 0.3, 1] }}
            className="group relative cursor-pointer"
            style={{ gridRowEnd: `span ${rowSpan}`, gridColumn: isVideo ? 'span 2' : undefined }}
            onClick={onClick}
        >
            <div className="relative overflow-hidden rounded-lg border border-white/10 bg-surface transition-colors duration-300 group-hover:border-white/40">
                {!loaded && !error && <div className="w-full aspect-[4/3] animate-pulse bg-white/5" />}
                {error && (
                    <div className="w-full aspect-[4/3] flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-white/30" />
                    </div>
                )}
                {inView && imgUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imgUrl}
                        alt={photo.caption || "Photo"}
                        className={`w-full transition-transform duration-700 ease-out group-hover:scale-[1.03] ${loaded ? "opacity-100" : "opacity-0 absolute"}`}
                        loading="lazy"
                        onLoad={(e) => handleImageLoad(e.currentTarget)}
                        onError={() => setError(true)}
                    />
                )}
                {isVideo && loaded && (
                    <>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/40 bg-black/50">
                                <Play className="ml-1 h-7 w-7 text-white" fill="currentColor" />
                            </div>
                        </div>
                        {durationLabel && (
                            <div className="absolute bottom-3 right-3 rounded bg-black/75 px-2 py-0.5 text-xs font-bold text-white pointer-events-none">
                                {durationLabel}
                            </div>
                        )}
                    </>
                )}
                {loaded && !isVideo && (
                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/10 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
                        {photo.caption && <p className="text-sm font-semibold text-white">{photo.caption}</p>}
                        <div className="mt-1 flex items-center justify-between gap-3">
                            <p className="text-xs text-white/70">by {photo.uploader.name}</p>
                            {onDelete && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white transition-colors hover:bg-primary-dark"
                                    aria-label="Delete photo"
                                    title="Delete"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
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
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    // Upload (multi-file)
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);
    const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);
    const [uploadProgress, setUploadProgress] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isAdmin = user?.role === "ADMIN";
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
    const coverUrl = album?.coverImageUrl ? getImageUrl(album.coverImageUrl) : null;

    if (isLoading && !album) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white/70 animate-spin" />
            </div>
        );
    }

    if (!album) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
                <p className="text-white/80 text-lg">Album not found</p>
                <Link href="/gallery" className="text-sm font-semibold text-white underline decoration-primary decoration-2 underline-offset-4 hover:text-primary-light">Back to the gallery</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-white">
            {/* Album opener: the cover, full-bleed. The gallery's album link grows into this same frame. */}
            <header data-bleed className="relative flex min-h-[72svh] overflow-hidden">
                {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                    <div className="absolute inset-0 bg-surface" />
                )}
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/30" />

                <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col justify-end px-4 pb-[clamp(2.5rem,7vh,5rem)] pt-36 sm:px-6 lg:px-8">
                    <Link
                        href="/gallery"
                        className="mb-8 inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold text-white/80 transition-colors hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        All albums
                    </Link>
                    <p className="text-sm font-semibold text-white/75">
                        {[config.label, album.date ? new Date(album.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null, `${album.photoCount} photo${album.photoCount !== 1 ? "s" : ""}`].filter(Boolean).join(" · ")}
                    </p>
                    <h1 className="mt-3 max-w-[18ch] text-balance text-[clamp(2.5rem,6.5vw,5.5rem)] font-black uppercase leading-[0.92] tracking-[-0.03em] text-white">
                        {album.name}
                    </h1>
                    {album.description && (
                        <p className="mt-5 max-w-[56ch] text-pretty text-lg leading-relaxed text-white/80">{album.description}</p>
                    )}
                    <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                        <p className="text-sm text-white/60">Created by {album.creator.name}</p>
                        {canUpload && (
                            <button
                                onClick={() => setShowUpload(true)}
                                className="inline-flex min-h-12 items-center gap-2 rounded-none bg-primary px-7 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                            >
                                <Upload className="h-4 w-4" />
                                Upload photo
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Photos Grid — Floating Gallery */}
            <div className="mx-auto max-w-[1400px] px-4 pb-20 pt-[clamp(2.5rem,5vw,4rem)] sm:px-6 lg:px-8">
                {photos.length === 0 ? (
                    <div className="text-center py-24">
                        <ImageIcon className="w-12 h-12 text-white/30 mx-auto mb-4" />
                        <p className="text-white/70">No photos in this album yet.</p>
                    </div>
                ) : (
                    <div
                        className="grid gap-5"
                        style={{
                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                            gridAutoFlow: 'dense',
                            gridAutoRows: '10px',
                        }}
                    >
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
                                aria-current={p === page ? "page" : undefined}
                                className={`w-11 min-h-11 rounded-none text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                                    p === page ? "bg-white text-black" : "border border-white/20 text-white/75 hover:bg-white/10 hover:text-white"
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
                            className="bg-surface border border-white/10 rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto"
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
                                            className="aspect-square rounded-lg border-2 border-dashed border-white/10 hover:border-primary/30 flex items-center justify-center transition-colors"
                                        >
                                            <Upload className="w-5 h-5 text-white/40" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Drop zone (when no files selected) */}
                            {uploadPreviews.length === 0 && (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center cursor-pointer hover:border-primary/30 transition-colors mb-4"
                                >
                                    <Upload className="w-8 h-8 text-white/70 mx-auto mb-2" />
                                    <p className="text-sm text-white/80">Click to select photos</p>
                                    <p className="text-xs text-white/70 mt-1">Select multiple &middot; Max 5MB each &middot; JPG, PNG, WebP</p>
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
                                <p className="text-xs text-white/70 mb-4">
                                    {uploadFiles.length} photo{uploadFiles.length > 1 ? "s" : ""} selected
                                    {uploadProgress && <span className="ml-2 text-primary-light">&middot; {uploadProgress}</span>}
                                </p>
                            )}

                            <button
                                onClick={handleUpload}
                                disabled={uploadFiles.length === 0 || uploading}
                                className="w-full min-h-[44px] bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-none text-sm font-bold uppercase tracking-wider text-white transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                            >
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                {uploading ? uploadProgress || "Uploading..." : `Upload ${uploadFiles.length > 1 ? `${uploadFiles.length} Photos` : "Photo"}`}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Lightbox */}
            {/* Portaled to document.body so it escapes PageTransition's containing block */}
            {mounted && createPortal(
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

                        {/* Image or Video */}
                        {currentPhoto.mediaType === 'VIDEO' && currentPhoto.videoProvider && currentPhoto.videoId ? (
                            <div
                                className="relative flex items-center justify-center w-full max-w-[90vw] max-h-[85vh]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <VideoPlayer
                                    provider={currentPhoto.videoProvider}
                                    videoId={currentPhoto.videoId}
                                    title={currentPhoto.caption || undefined}
                                />
                            </div>
                        ) : (
                            <div className="relative flex items-center justify-center max-w-[90vw] max-h-[85vh]">
                                <img
                                    src={currentPhotoUrl}
                                    alt={currentPhoto.caption || "Photo"}
                                    className={`w-auto h-auto max-h-full max-w-full object-contain rounded-lg transition-transform duration-300 ${zoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"}`}
                                    onClick={(e) => { e.stopPropagation(); setZoomed(!zoomed); }}
                                />
                            </div>
                        )}

                        {/* Bottom bar */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                            <div className="max-w-4xl mx-auto flex items-center justify-between">
                                <div>
                                    {showInfo && (
                                        <>
                                            {currentPhoto.caption && <p className="text-sm font-semibold">{currentPhoto.caption}</p>}
                                            <p className="text-xs text-white/70">by {currentPhoto.uploader.name} &middot; {new Date(currentPhoto.uploadedAt).toLocaleDateString()}</p>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }} className="p-2 rounded-full bg-white/10 hover:bg-white/20" title="Info (i)">
                                        <Info className="w-4 h-4" />
                                    </button>
                                    {currentPhoto.mediaType !== 'VIDEO' && (
                                        <button onClick={(e) => { e.stopPropagation(); setZoomed(!zoomed); }} className="p-2 rounded-full bg-white/10 hover:bg-white/20" title="Zoom">
                                            {zoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                                        </button>
                                    )}
                                    {currentPhoto.mediaType === 'VIDEO' && currentPhoto.videoUrl ? (
                                        <a
                                            href={currentPhoto.videoUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-2 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                                            title={`Watch on ${currentPhoto.videoProvider === 'youtube' ? 'YouTube' : 'Vimeo'}`}
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    ) : (
                                        <button onClick={(e) => { e.stopPropagation(); handleDownload(currentPhotoUrl!, currentPhoto.caption); }} className="p-2 rounded-full bg-white/10 hover:bg-white/20" title="Download">
                                            <Download className="w-4 h-4" />
                                        </button>
                                    )}
                                    {(isAdmin || currentPhoto.uploader.id === user?.id) && (
                                        <button onClick={(e) => { e.stopPropagation(); handleDeletePhoto(currentPhoto.id); }} className="p-2 rounded-full bg-primary/20 hover:bg-primary/40 text-primary-light" title="Delete">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {/* Counter */}
                            <div className="text-center mt-2">
                                <span className="text-xs text-white/70">{lightboxIndex + 1} / {photos.length}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>,
            document.body
            )}
        </div>
    );
}
