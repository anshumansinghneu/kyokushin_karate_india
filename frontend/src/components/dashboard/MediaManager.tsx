"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, Save, X, Upload, ExternalLink, FileText, Newspaper, Search, Loader2, ImagePlus, Info, Link } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

interface MediaPost {
    id: string;
    title: string;
    sourceName: string;
    externalLink: string;
    attachmentUrl: string;
    imageUrl: string;
    publishedAt: string;
}

const MediaManager = () => {
    const { showToast } = useToast();
    const [posts, setPosts] = useState<MediaPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPost, setCurrentPost] = useState<Partial<MediaPost>>({});
    const [uploading, setUploading] = useState(false);
    const [mediaType, setMediaType] = useState<'LINK' | 'PDF'>('LINK');
    const [mediaSearch, setMediaSearch] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const fetchPosts = async () => {
        try {
            const res = await api.get('/posts?type=MEDIA_MENTION');
            setPosts(res.data.data.posts);
        } catch (error) {
            console.error("Failed to fetch media", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    useEffect(() => {
        if (currentPost.attachmentUrl) {
            setMediaType('PDF');
        } else {
            setMediaType('LINK');
        }
    }, [currentPost]);

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await api.delete(`/posts/${deleteId}`);
            fetchPosts();
            setDeleteId(null);
        } catch (error) {
            console.error("Failed to delete item", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSave = async () => {
        if (mediaType === 'LINK' && !currentPost.externalLink) {
            showToast("Please provide an external link.", "error");
            return;
        }
        if (mediaType === 'PDF' && !currentPost.attachmentUrl) {
            showToast("Please upload a PDF.", "error");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                ...currentPost,
                type: 'MEDIA_MENTION',
                // Clear the other field based on type
                externalLink: mediaType === 'LINK' ? currentPost.externalLink : null,
                attachmentUrl: mediaType === 'PDF' ? currentPost.attachmentUrl : null
            };

            if (currentPost.id) {
                await api.patch(`/posts/${currentPost.id}`, payload);
            } else {
                await api.post('/posts', payload);
            }
            setIsEditing(false);
            setCurrentPost({});
            fetchPosts();
        } catch (error) {
            console.error("Failed to save item", error);
            showToast("Failed to save item", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);
        setUploading(true);

        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setCurrentPost({ ...currentPost, imageUrl: res.data.data.url });
        } catch (error) {
            console.error("Upload failed", error);
            showToast("Image upload failed", "error");
        } finally {
            setUploading(false);
        }
    };

    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            showToast("Please upload a PDF file.", "error");
            return;
        }

        const formData = new FormData();
        formData.append('image', file); // Reusing 'image' field name as per backend config
        setUploading(true);

        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setCurrentPost({ ...currentPost, attachmentUrl: res.data.data.url });
        } catch (error) {
            console.error("Upload failed", error);
            showToast("PDF upload failed", "error");
        } finally {
            setUploading(false);
        }
    };

    if (isLoading) return <div>Loading media...</div>;

    if (isEditing) {
        return (
            <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                    <div>
                        <h2 className="text-lg font-bold text-white">{currentPost.id ? 'Edit Media Mention' : 'New Media Mention'}</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Add a press article, news feature, or media coverage</p>
                    </div>
                    <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Section: Basic Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <Info className="w-3.5 h-3.5" /> Article Details
                        </div>
                        <div>
                            <label className="text-sm text-gray-300 mb-1.5 block">Title / Headline <span className="text-red-400">*</span></label>
                            <input
                                type="text"
                                value={currentPost.title || ''}
                                onChange={(e) => setCurrentPost({ ...currentPost, title: e.target.value })}
                                placeholder="e.g. KKFI Featured in Times of India"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-300 mb-1.5 block">Source Name <span className="text-red-400">*</span></label>
                            <input
                                type="text"
                                value={currentPost.sourceName || ''}
                                onChange={(e) => setCurrentPost({ ...currentPost, sourceName: e.target.value })}
                                placeholder="e.g. Times of India, The Hindu, NDTV"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Section: Media Type */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <Link className="w-3.5 h-3.5" /> Media Source
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setMediaType('LINK')}
                                className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border transition-all ${
                                    mediaType === 'LINK' ? 'bg-blue-500/15 border-blue-500/50 ring-2 ring-blue-500/30 text-blue-400' : 'border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]'
                                }`}
                            >
                                <ExternalLink size={18} />
                                <span className="text-sm font-semibold">External Link</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMediaType('PDF')}
                                className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border transition-all ${
                                    mediaType === 'PDF' ? 'bg-red-500/15 border-red-500/50 ring-2 ring-red-500/30 text-red-400' : 'border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]'
                                }`}
                            >
                                <FileText size={18} />
                                <span className="text-sm font-semibold">Upload PDF</span>
                            </button>
                        </div>

                        {mediaType === 'LINK' ? (
                            <div>
                                <label className="text-sm text-gray-300 mb-1.5 block">Article URL <span className="text-red-400">*</span></label>
                                <input
                                    type="url"
                                    value={currentPost.externalLink || ''}
                                    onChange={(e) => setCurrentPost({ ...currentPost, externalLink: e.target.value })}
                                    placeholder="https://timesofindia.com/article..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="text-sm text-gray-300 mb-1.5 block">PDF Document <span className="text-red-400">*</span></label>
                                {currentPost.attachmentUrl ? (
                                    <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                                        <FileText size={18} className="text-green-400 flex-shrink-0" />
                                        <span className="text-sm text-green-300 truncate flex-1">{currentPost.attachmentUrl.split('/').pop()}</span>
                                        <button type="button" onClick={() => setCurrentPost({ ...currentPost, attachmentUrl: '' })} className="p-1 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="cursor-pointer flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-white/15 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/25 transition-all">
                                        <Upload className="w-7 h-7 text-gray-600" />
                                        <span className="text-sm text-gray-500">{uploading ? 'Uploading...' : 'Click to upload PDF'}</span>
                                        <input type="file" className="hidden" accept="application/pdf" onChange={handlePdfUpload} />
                                    </label>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Section: Cover Image */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <ImagePlus className="w-3.5 h-3.5" /> Cover Image <span className="font-normal normal-case text-gray-600">(optional)</span>
                        </div>
                        {currentPost.imageUrl ? (
                            <div className="relative rounded-xl overflow-hidden border border-white/10 group">
                                <img src={currentPost.imageUrl} alt="Cover" className="w-full h-36 object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <label className="cursor-pointer px-3 py-2 bg-white/20 backdrop-blur rounded-lg text-sm text-white hover:bg-white/30 transition-colors">
                                        Change
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                    <button type="button" onClick={() => setCurrentPost({ ...currentPost, imageUrl: '' })} className="px-3 py-2 bg-red-500/30 backdrop-blur rounded-lg text-sm text-red-300 hover:bg-red-500/50 transition-colors">
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <label className="cursor-pointer flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-white/15 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/25 transition-all">
                                <ImagePlus className="w-7 h-7 text-gray-600" />
                                <span className="text-sm text-gray-500">{uploading ? 'Uploading...' : 'Upload cover image'}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/[0.02]">
                    <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {isSaving ? 'Saving...' : 'Save Mention'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                        >
                            <h3 className="text-xl font-bold text-white mb-2">Delete Media?</h3>
                            <p className="text-gray-400 mb-6">
                                Are you sure you want to delete this media item? This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setDeleteId(null)}
                                    className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-medium"
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-bold flex items-center gap-2"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete Item'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        <Newspaper className="w-6 h-6 text-purple-500" /> Media Mentions
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">{posts.length} mention{posts.length !== 1 ? 's' : ''} total</p>
                </div>
                <button
                    onClick={() => { setCurrentPost({}); setIsEditing(true); }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm font-bold transition-colors"
                >
                    <Plus size={16} /> Add Mention
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    value={mediaSearch}
                    onChange={(e) => setMediaSearch(e.target.value)}
                    placeholder="Search by headline or source..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                />
            </div>

            {/* Card Grid */}
            {posts.filter(p => {
                if (!mediaSearch) return true;
                const q = mediaSearch.toLowerCase();
                return p.title?.toLowerCase().includes(q) || p.sourceName?.toLowerCase().includes(q);
            }).length === 0 ? (
                <div className="text-center py-16 bg-black/40 border border-white/10 rounded-2xl">
                    <Newspaper className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p className="text-lg font-bold text-white">No media mentions yet</p>
                    <p className="text-sm text-gray-400 mt-1">Add your first media mention to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {posts.filter(p => {
                        if (!mediaSearch) return true;
                        const q = mediaSearch.toLowerCase();
                        return p.title?.toLowerCase().includes(q) || p.sourceName?.toLowerCase().includes(q);
                    }).map((post) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all group"
                        >
                            <div className="h-1 bg-purple-500" />
                            {post.imageUrl && (
                                <div className="relative h-36 overflow-hidden">
                                    <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                </div>
                            )}
                            <div className="p-5">
                                <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">{post.title}</h3>
                                {post.sourceName && (
                                    <p className="text-xs text-purple-400 font-medium mb-3">{post.sourceName}</p>
                                )}

                                {post.externalLink ? (
                                    <a href={post.externalLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                                        <ExternalLink size={12} /> Visit Link
                                    </a>
                                ) : post.attachmentUrl ? (
                                    <a href={post.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors">
                                        <FileText size={12} /> View PDF
                                    </a>
                                ) : null}

                                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                                    <button
                                        onClick={() => { setCurrentPost(post); setIsEditing(true); }}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
                                    >
                                        <Edit className="w-3 h-3" /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(post.id)}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" /> Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MediaManager;
