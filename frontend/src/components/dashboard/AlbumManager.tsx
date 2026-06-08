"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Plus, Pencil, Trash2, Image, Loader2, Pin, PinOff, X, Upload,
    Tent, GraduationCap, Trophy, Swords, Dumbbell, Camera, FolderOpen,
    ImagePlus, ImageMinus, Video as VideoIcon,
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { getImageUrl } from "@/lib/imageUtils";
import AddVideoModal from "./AddVideoModal";

interface Album {
    id: string;
    name: string;
    description: string | null;
    coverImageUrl: string | null;
    type: string;
    isPinned: boolean;
    date: string | null;
    eventId: string | null;
    photoCount: number;
    creator: { id: string; name: string };
    event: { id: string; name: string } | null;
}

interface GalleryPhoto {
    id: string;
    imageUrl: string;
    caption: string | null;
    uploadedAt: string;
    uploader: { id: string; name: string };
}

const ALBUM_TYPES = [
    { value: "CAMP", label: "Camp", icon: Tent },
    { value: "SEMINAR", label: "Seminar", icon: GraduationCap },
    { value: "TOURNAMENT", label: "Tournament", icon: Trophy },
    { value: "BELT_EXAM", label: "Grading", icon: Swords },
    { value: "TRAINING", label: "Training", icon: Dumbbell },
    { value: "GENERAL", label: "General", icon: Camera },
];

export default function AlbumManager() {
    const { showToast } = useToast();
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: "", description: "", type: "GENERAL", date: "", coverImageUrl: "" });
    const [saving, setSaving] = useState(false);

    // Photo management
    const [managingAlbumId, setManagingAlbumId] = useState<string | null>(null);
    const [albumPhotos, setAlbumPhotos] = useState<GalleryPhoto[]>([]);
    const [allPhotos, setAllPhotos] = useState<GalleryPhoto[]>([]);
    const [showPhotoPicker, setShowPhotoPicker] = useState(false);
    const [loadingPhotos, setLoadingPhotos] = useState(false);

    // Add Video modal
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [videoTargetAlbumId, setVideoTargetAlbumId] = useState<string | undefined>(undefined);

    const fetchAlbums = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("/albums?limit=50");
            setAlbums(res.data.data.albums);
        } catch {
            showToast("Failed to load albums", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { fetchAlbums(); }, [fetchAlbums]);

    const handleCreate = () => {
        setEditingId(null);
        setForm({ name: "", description: "", type: "GENERAL", date: "", coverImageUrl: "" });
        setShowForm(true);
    };

    const handleEdit = (album: Album) => {
        setEditingId(album.id);
        setForm({
            name: album.name,
            description: album.description || "",
            type: album.type,
            date: album.date ? album.date.split("T")[0] : "",
            coverImageUrl: album.coverImageUrl || "",
        });
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { showToast("Name is required", "error"); return; }
        setSaving(true);
        try {
            const payload: any = {
                name: form.name.trim(),
                description: form.description.trim() || null,
                type: form.type,
                date: form.date || null,
                coverImageUrl: form.coverImageUrl || null,
            };
            if (editingId) {
                const res = await api.patch(`/albums/${editingId}`, payload);
                const updated: Album = res.data.data.album;
                setAlbums(prev => prev.map(a => a.id === updated.id ? updated : a));
                showToast("Album updated", "success");
            } else {
                const res = await api.post("/albums", payload);
                const created: Album = res.data.data.album;
                setAlbums(prev => [created, ...prev.filter(a => a.id !== created.id)]);
                showToast("Album created", "success");
            }
            setShowForm(false);
        } catch (err: any) {
            console.error("Album save error:", err.response?.data || err.message || err);
            showToast(err.response?.data?.message || "Save failed", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this album? Photos will not be deleted.")) return;
        try {
            await api.delete(`/albums/${id}`);
            setAlbums(prev => prev.filter(a => a.id !== id));
            showToast("Album deleted", "success");
        } catch {
            showToast("Delete failed", "error");
        }
    };

    const handleTogglePin = async (album: Album) => {
        try {
            const res = await api.patch(`/albums/${album.id}`, { isPinned: !album.isPinned });
            const updated: Album = res.data.data.album;
            // Pinning unpins all others on the backend — mirror that in local state
            setAlbums(prev => prev.map(a =>
                a.id === updated.id ? updated : (updated.isPinned ? { ...a, isPinned: false } : a)
            ));
            showToast(album.isPinned ? "Unpinned" : "Pinned as featured", "success");
        } catch {
            showToast("Failed to update", "error");
        }
    };

    const handleCoverUpload = async (file: File) => {
        const fd = new FormData();
        fd.append("image", file);
        try {
            const res = await api.post("/upload?folder=albums", fd, { headers: { "Content-Type": "multipart/form-data" } });
            setForm(prev => ({ ...prev, coverImageUrl: res.data.data.url }));
        } catch {
            showToast("Cover upload failed", "error");
        }
    };

    // Photo management
    const openPhotoManager = async (albumId: string) => {
        setManagingAlbumId(albumId);
        setLoadingPhotos(true);
        try {
            const [albumRes, allRes] = await Promise.all([
                api.get(`/albums/${albumId}?limit=100`),
                api.get("/gallery?limit=100"),
            ]);
            setAlbumPhotos(albumRes.data.data.photos);
            setAllPhotos(allRes.data.data.items);
        } catch {
            showToast("Failed to load photos", "error");
        } finally {
            setLoadingPhotos(false);
        }
    };

    const handleAddPhotos = async (galleryIds: string[]) => {
        if (!managingAlbumId) return;
        try {
            await api.post(`/albums/${managingAlbumId}/photos`, { galleryIds });
            setAlbums(prev => prev.map(a =>
                a.id === managingAlbumId ? { ...a, photoCount: a.photoCount + galleryIds.length } : a
            ));
            showToast(`Added ${galleryIds.length} photo(s)`, "success");
            openPhotoManager(managingAlbumId);
        } catch {
            showToast("Failed to add photos", "error");
        }
    };

    const handleRemovePhoto = async (photoId: string) => {
        if (!managingAlbumId) return;
        try {
            await api.delete(`/albums/${managingAlbumId}/photos/${photoId}`);
            setAlbums(prev => prev.map(a =>
                a.id === managingAlbumId ? { ...a, photoCount: Math.max(0, a.photoCount - 1) } : a
            ));
            showToast("Photo removed from album", "success");
            openPhotoManager(managingAlbumId);
        } catch {
            showToast("Failed to remove photo", "error");
        }
    };

    const albumPhotoIds = new Set(albumPhotos.map(p => p.id));
    const availablePhotos = allPhotos.filter(p => !albumPhotoIds.has(p.id));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">Photo Albums</h2>
                    <p className="text-sm text-gray-500 mt-1">Organize gallery photos into albums</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setVideoTargetAlbumId(undefined); setShowVideoModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-semibold border border-white/10 transition-colors"
                    >
                        <VideoIcon className="w-4 h-4 text-red-400" /> Add Video
                    </button>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                        <Plus className="w-4 h-4" /> New Album
                    </button>
                </div>
            </div>

            {/* Albums List */}
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-red-500 animate-spin" /></div>
            ) : albums.length === 0 ? (
                <div className="text-center py-12 bg-zinc-900/50 rounded-xl border border-white/5">
                    <FolderOpen className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500">No albums yet</p>
                    <p className="text-zinc-600 text-sm mt-1">Create your first album or they'll be auto-created with new events</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {albums.map((album) => {
                        const typeInfo = ALBUM_TYPES.find(t => t.value === album.type) || ALBUM_TYPES[5];
                        const TypeIcon = typeInfo.icon;
                        const coverUrl = album.coverImageUrl ? getImageUrl(album.coverImageUrl) : null;

                        return (
                            <div key={album.id} className="flex items-center gap-4 p-4 bg-zinc-900/60 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                                {/* Cover thumbnail */}
                                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800 flex items-center justify-center border border-white/5">
                                    {coverUrl ? (
                                        <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <TypeIcon className="w-6 h-6 text-zinc-600" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-white truncate">{album.name}</h3>
                                        {album.isPinned && (
                                            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">PINNED</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                                            <TypeIcon className="w-3 h-3" /> {typeInfo.label}
                                        </span>
                                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                                            <Image className="w-3 h-3" /> {album.photoCount} photos
                                        </span>
                                        {album.date && (
                                            <span className="text-xs text-zinc-600">
                                                {new Date(album.date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                                            </span>
                                        )}
                                        {album.event && (
                                            <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                                                Event: {album.event.name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1">
                                    <button onClick={() => openPhotoManager(album.id)} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Manage photos">
                                        <ImagePlus className="w-4 h-4 text-zinc-400" />
                                    </button>
                                    <button onClick={() => handleTogglePin(album)} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title={album.isPinned ? "Unpin" : "Pin as featured"}>
                                        {album.isPinned ? <PinOff className="w-4 h-4 text-amber-400" /> : <Pin className="w-4 h-4 text-zinc-400" />}
                                    </button>
                                    <button onClick={() => handleEdit(album)} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Edit">
                                        <Pencil className="w-4 h-4 text-zinc-400" />
                                    </button>
                                    <button onClick={() => handleDelete(album.id)} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create/Edit Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg font-bold text-white">{editingId ? "Edit Album" : "Create Album"}</h3>
                            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-zinc-400" /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Name *</label>
                                <input
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full mt-1 px-3 py-2.5 bg-black/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-red-500/50"
                                    placeholder="Summer Camp 2026"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    className="w-full mt-1 px-3 py-2.5 bg-black/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-red-500/50 resize-none"
                                    rows={3}
                                    placeholder="Photos from the annual summer camp..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Type</label>
                                    <select
                                        value={form.type}
                                        onChange={e => setForm({ ...form, type: e.target.value })}
                                        className="w-full mt-1 px-3 py-2.5 bg-black/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-red-500/50"
                                    >
                                        {ALBUM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Date</label>
                                    <input
                                        type="date"
                                        value={form.date}
                                        onChange={e => setForm({ ...form, date: e.target.value })}
                                        className="w-full mt-1 px-3 py-2.5 bg-black/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-red-500/50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Cover Image</label>
                                <div className="mt-1 flex items-center gap-3">
                                    {form.coverImageUrl ? (
                                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/10">
                                            <img src={getImageUrl(form.coverImageUrl) || ""} alt="" className="w-full h-full object-cover" />
                                            <button onClick={() => setForm({ ...form, coverImageUrl: "" })} className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg cursor-pointer text-sm text-zinc-400 transition-colors">
                                            <Upload className="w-4 h-4" /> Upload Cover
                                            <input type="file" accept="image/*" className="hidden" onChange={e => {
                                                const f = e.target.files?.[0];
                                                if (f) handleCoverUpload(f);
                                            }} />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-semibold transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                {editingId ? "Save Changes" : "Create Album"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Photo Manager Modal */}
            {managingAlbumId && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setManagingAlbumId(null); setShowPhotoPicker(false); }}>
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg font-bold text-white">
                                Manage Photos — {albums.find(a => a.id === managingAlbumId)?.name}
                            </h3>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setShowPhotoPicker(!showPhotoPicker)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-semibold text-white transition-colors">
                                    <ImagePlus className="w-3.5 h-3.5" /> Add Photos
                                </button>
                                <button onClick={() => { setManagingAlbumId(null); setShowPhotoPicker(false); }} className="p-1 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-zinc-400" /></button>
                            </div>
                        </div>

                        {loadingPhotos ? (
                            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-red-500 animate-spin" /></div>
                        ) : (
                            <>
                                {/* Photo picker */}
                                {showPhotoPicker && (
                                    <div className="mb-6 p-4 bg-black/40 rounded-xl border border-white/5">
                                        <p className="text-xs font-semibold text-zinc-400 mb-3">Click photos to add them to this album:</p>
                                        {availablePhotos.length === 0 ? (
                                            <p className="text-xs text-zinc-600 text-center py-4">No more photos available to add</p>
                                        ) : (
                                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                                                {availablePhotos.map(photo => (
                                                    <button
                                                        key={photo.id}
                                                        onClick={() => handleAddPhotos([photo.id])}
                                                        className="aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-red-500/50 transition-colors relative group"
                                                    >
                                                        <img src={getImageUrl(photo.imageUrl) || ""} alt="" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                                            <Plus className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Current album photos */}
                                {albumPhotos.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Image className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                                        <p className="text-sm text-zinc-500">No photos in this album</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                        {albumPhotos.map(photo => (
                                            <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                                                <img src={getImageUrl(photo.imageUrl) || ""} alt="" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => handleRemovePhoto(photo.id)}
                                                    className="absolute top-1.5 right-1.5 p-1 bg-red-600/80 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Remove from album"
                                                >
                                                    <ImageMinus className="w-3 h-3 text-white" />
                                                </button>
                                                {photo.caption && (
                                                    <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/80 to-transparent">
                                                        <p className="text-[9px] text-white truncate">{photo.caption}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            <AddVideoModal
                open={showVideoModal}
                onClose={() => setShowVideoModal(false)}
                onSaved={() => fetchAlbums()}
                albumId={videoTargetAlbumId}
            />
        </div>
    );
}
