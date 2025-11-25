"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, Save, X, Upload, ExternalLink, FileText } from "lucide-react";
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
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{currentPost.id ? 'Edit Media Mention' : 'New Media Mention'}</h2>
                    <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title / Headline</label>
                        <input
                            type="text"
                            value={currentPost.title || ''}
                            onChange={(e) => setCurrentPost({ ...currentPost, title: e.target.value })}
                            className="w-full p-2 border rounded-lg text-gray-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Source Name (e.g. Times of India)</label>
                        <input
                            type="text"
                            value={currentPost.sourceName || ''}
                            onChange={(e) => setCurrentPost({ ...currentPost, sourceName: e.target.value })}
                            className="w-full p-2 border rounded-lg text-gray-900"
                        />
                    </div>

                    {/* Media Type Toggle */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Media Type</label>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setMediaType('LINK')}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${mediaType === 'LINK' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                            >
                                <ExternalLink size={16} /> External Link
                            </button>
                            <button
                                onClick={() => setMediaType('PDF')}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${mediaType === 'PDF' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                            >
                                <FileText size={16} /> Upload PDF
                            </button>
                        </div>
                    </div>

                    {mediaType === 'LINK' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">External Link</label>
                            <input
                                type="text"
                                value={currentPost.externalLink || ''}
                                onChange={(e) => setCurrentPost({ ...currentPost, externalLink: e.target.value })}
                                className="w-full p-2 border rounded-lg text-gray-900"
                                placeholder="https://..."
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PDF Document</label>
                            <div className="flex items-center gap-4">
                                {currentPost.attachmentUrl ? (
                                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                                        <FileText size={16} />
                                        <span className="text-sm truncate max-w-xs">{currentPost.attachmentUrl.split('/').pop()}</span>
                                        <button onClick={() => setCurrentPost({ ...currentPost, attachmentUrl: '' })} className="text-red-500 hover:bg-red-50 rounded p-1"><X size={14} /></button>
                                    </div>
                                ) : (
                                    <label className="cursor-pointer bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2">
                                        <Upload size={16} />
                                        {uploading ? 'Uploading...' : 'Upload PDF'}
                                        <input type="file" className="hidden" accept="application/pdf" onChange={handlePdfUpload} />
                                    </label>
                                )}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                        <div className="flex items-center gap-4">
                            {currentPost.imageUrl && (
                                <img src={currentPost.imageUrl} alt="Preview" className="h-20 w-32 object-cover rounded" />
                            )}
                            <label className="cursor-pointer bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2">
                                <Upload size={16} />
                                {uploading ? 'Uploading...' : 'Upload Image'}
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Save size={16} /> Save
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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

            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Media Mentions</h2>
                <button
                    onClick={() => { setCurrentPost({}); setIsEditing(true); }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"
                >
                    <Plus size={16} /> Add Mention
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Headline</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {posts.map((post) => (
                            <tr key={post.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {post.imageUrl && (
                                            <img src={post.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />
                                        )}
                                        <div className="text-sm font-medium text-gray-900">{post.title}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{post.sourceName}</td>
                                <td className="px-6 py-4 text-sm text-blue-500">
                                    {post.externalLink ? (
                                        <a href={post.externalLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                                            Visit Link <ExternalLink size={12} />
                                        </a>
                                    ) : post.attachmentUrl ? (
                                        <a href={post.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline text-red-600">
                                            View PDF <FileText size={12} />
                                        </a>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => { setCurrentPost(post); setIsEditing(true); }}
                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(post.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MediaManager;
