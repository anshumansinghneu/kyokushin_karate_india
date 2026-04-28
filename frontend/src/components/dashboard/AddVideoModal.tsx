"use client";

import { useState } from "react";
import { X, Loader2, Video as VideoIcon } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

interface AddVideoModalProps {
    open: boolean;
    onClose: () => void;
    onSaved?: () => void;
    albumId?: string;
}

export default function AddVideoModal({ open, onClose, onSaved, albumId }: AddVideoModalProps) {
    const { showToast } = useToast();
    const [videoUrl, setVideoUrl] = useState("");
    const [caption, setCaption] = useState("");
    const [saving, setSaving] = useState(false);

    if (!open) return null;

    const handleSave = async () => {
        if (!videoUrl.trim()) {
            showToast("Paste a YouTube or Vimeo URL", "error");
            return;
        }
        setSaving(true);
        try {
            await api.post("/gallery/video", {
                videoUrl: videoUrl.trim(),
                caption: caption.trim() || undefined,
                albumId: albumId || undefined,
            });
            showToast("Video added", "success");
            setVideoUrl("");
            setCaption("");
            onSaved?.();
            onClose();
        } catch (err: any) {
            showToast(err.response?.data?.message || "Failed to add video", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <VideoIcon className="w-5 h-5 text-red-400" />
                        <h3 className="text-lg font-bold text-white">Add Video</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    YouTube or Vimeo URL
                </label>
                <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50"
                />

                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mt-4 mb-2">
                    Caption (optional)
                </label>
                <input
                    type="text"
                    placeholder="Defaults to the video's title"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50"
                />

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-zinc-400 hover:text-white hover:bg-white/5"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-2 rounded-lg text-sm font-bold bg-red-600 hover:bg-red-500 text-white flex items-center gap-2 disabled:opacity-60"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
