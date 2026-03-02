"use client";

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Edit, Trash2, Plus, Save, X, Upload, Image, FileText, CheckCircle, Clock, Search, Loader2, Eye, Type, AlignLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import { useToast } from "@/contexts/ToastContext";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Post {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    imageUrl: string;
    publishedAt: string;
    status: 'DRAFT' | 'PENDING' | 'PUBLISHED';
    author: { name: string };
}

const BlogManager = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPost, setCurrentPost] = useState<Partial<Post>>({});
    const [uploading, setUploading] = useState(false);
    const [filter, setFilter] = useState<'ALL' | 'PUBLISHED' | 'PENDING'>('ALL');
    const [blogSearch, setBlogSearch] = useState("");
    const [blocks, setBlocks] = useState<{ id: string; type: 'text' | 'image'; content: string }[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [approvingId, setApprovingId] = useState<string | null>(null);

    const { user } = useAuthStore();
    const { showToast } = useToast();

    const fetchPosts = async () => {
        try {
            let query = '/posts?type=BLOG';
            if (user?.role === 'ADMIN') {
                query += '&status=ALL';
            } else if (user?.id) {
                query += `&authorId=${user.id}`;
            }
            const res = await api.get(query);
            setPosts(res.data.data.posts || []);
        } catch (error) {
            console.error("Failed to fetch blogs", error);
            showToast("Failed to fetch blogs", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchPosts();
        }
    }, [user]);

    useEffect(() => {
        if (currentPost.content) {
            // Simple parser to convert HTML back to blocks (very basic)
            if (blocks.length === 0) {
                // Try to parse div blocks if they exist
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = currentPost.content;
                const childDivs = tempDiv.querySelectorAll('div');

                if (childDivs.length > 0) {
                    const newBlocks: { id: string; type: 'text' | 'image'; content: string }[] = [];
                    childDivs.forEach((div) => {
                        const img = div.querySelector('img');
                        if (img) {
                            newBlocks.push({ id: Date.now().toString() + Math.random(), type: 'image', content: img.src });
                        } else {
                            newBlocks.push({ id: Date.now().toString() + Math.random(), type: 'text', content: div.innerText });
                        }
                    });
                    setBlocks(newBlocks);
                } else {
                    setBlocks([{ id: Date.now().toString(), type: 'text', content: currentPost.content }]);
                }
            }
        } else if (blocks.length === 0 && isEditing && !currentPost.id) {
            setBlocks([{ id: Date.now().toString(), type: 'text', content: '' }]);
        }
    }, [currentPost.content, isEditing]);

    const handleAddBlock = (type: 'text' | 'image') => {
        setBlocks([...blocks, { id: Date.now().toString(), type, content: '' }]);
    };

    const handleUpdateBlock = (id: string, content: string) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, content } : b));
    };

    const handleRemoveBlock = (id: string) => {
        setBlocks(blocks.filter(b => b.id !== id));
    };

    const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === blocks.length - 1) return;

        const newBlocks = [...blocks];
        const temp = newBlocks[index];
        newBlocks[index] = newBlocks[index + (direction === 'up' ? -1 : 1)];
        newBlocks[index + (direction === 'up' ? -1 : 1)] = temp;
        setBlocks(newBlocks);
    };



    const handleApprove = async (id: string) => {
        setApprovingId(id);
        try {
            await api.patch(`/posts/${id}`, { status: 'PUBLISHED' });
            fetchPosts();
            showToast("Post approved successfully!", "success");
        } catch (error: any) {
            console.error("Approval failed", error);
            showToast(error.response?.data?.message || "Failed to approve post", "error");
        } finally {
            setApprovingId(null);
        }
    };

    const handleBlockImageUpload = async (id: string, file: File) => {
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            handleUpdateBlock(id, res.data.data.url);
            showToast("Block image uploaded successfully!", "success");
        } catch (err: any) {
            console.error("Image upload failed", err);
            showToast("Image upload failed", "error");
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
            showToast("Cover image uploaded successfully!", "success");
        } catch (error: any) {
            console.error("Upload failed", error);
            showToast(error.response?.data?.message || "Image upload failed", "error");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Serialize blocks to HTML
            const htmlContent = blocks.map(block => {
                if (block.type === 'text') {
                    return `<div class="mb-4 text-gray-300 leading-relaxed">${block.content.replace(/\n/g, '<br/>')}</div>`;
                } else if (block.type === 'image') {
                    return `<div class="mb-6 rounded-xl overflow-hidden"><img src="${block.content}" alt="Blog Image" class="w-full h-auto object-cover"/></div>`;
                }
                return '';
            }).join('');

            // Sanitize payload
            const { author, id, ...rest } = currentPost as any;

            const payload = {
                ...rest,
                content: htmlContent,
                type: 'BLOG'
            };

            if (currentPost.id) {
                await api.patch(`/posts/${currentPost.id}`, payload);
                showToast("Post updated successfully!", "success");
            } else {
                await api.post('/posts', payload);
                showToast("Post created successfully!", "success");
            }
            setIsEditing(false);
            setCurrentPost({});
            setBlocks([]);
            fetchPosts();
        } catch (err: any) {
            const errMsg = err.response?.data?.message || "Failed to save post";
            console.error(errMsg, err);
            showToast(errMsg, "error");
        } finally {
            setIsSaving(false);
        }
    };

    // Filter posts
    const filteredPosts = posts.filter(post => {
        if (filter !== 'ALL' && post.status !== filter) return false;
        if (blogSearch) {
            const q = blogSearch.toLowerCase();
            return post.title.toLowerCase().includes(q) || post.author?.name?.toLowerCase().includes(q) || (post.excerpt || '').toLowerCase().includes(q);
        }
        return true;
    });

    if (isLoading) return <div className="text-white">Loading blogs...</div>;

    if (isEditing) {
        return (
            <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Sticky Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-white/[0.02] flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-white">{currentPost.id ? 'Edit Blog Post' : 'New Blog Post'}</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {currentPost.id ? 'Update your blog content below' : 'Create a new blog post with text and image blocks'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setIsEditing(false); setBlocks([]); }}
                            className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {isSaving ? 'Saving...' : 'Publish'}
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 p-6 space-y-6">
                    {/* Section: Basic Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <Type className="w-3.5 h-3.5" /> Post Details
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-gray-300 mb-1.5 block">Title <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    value={currentPost.title || ''}
                                    onChange={(e) => setCurrentPost({ ...currentPost, title: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                                    placeholder="Enter blog title"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-300 mb-1.5 block">Slug <span className="text-gray-600">(optional)</span></label>
                                <input
                                    type="text"
                                    value={currentPost.slug || ''}
                                    onChange={(e) => setCurrentPost({ ...currentPost, slug: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                                    placeholder="auto-generated-from-title"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section: Cover Image */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <Image className="w-3.5 h-3.5" /> Cover Image
                        </div>
                        {currentPost.imageUrl ? (
                            <div className="relative rounded-xl overflow-hidden border border-white/10 group">
                                <img src={currentPost.imageUrl} alt="Cover" className="w-full h-44 object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <label className="cursor-pointer px-3 py-2 bg-white/20 backdrop-blur rounded-lg text-sm text-white hover:bg-white/30 transition-colors">
                                        Change Image
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <label className="cursor-pointer flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-white/15 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/25 transition-all">
                                <Upload className="w-8 h-8 text-gray-600" />
                                <span className="text-sm text-gray-500">{uploading ? 'Uploading...' : 'Click to upload cover image'}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        )}
                    </div>

                    {/* Section: Excerpt */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <AlignLeft className="w-3.5 h-3.5" /> Excerpt
                        </div>
                        <textarea
                            value={currentPost.excerpt || ''}
                            onChange={(e) => setCurrentPost({ ...currentPost, excerpt: e.target.value })}
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none"
                            placeholder="Short summary shown on the blog card..."
                        />
                    </div>

                    {/* Section: Content Blocks */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                <FileText className="w-3.5 h-3.5" /> Content Blocks
                            </div>
                            <span className="text-[11px] text-gray-600">{blocks.length} block{blocks.length !== 1 ? 's' : ''}</span>
                        </div>

                        <div className="space-y-3">
                            {blocks.map((block, index) => (
                                <div key={block.id} className="group relative bg-white/[0.03] border border-white/10 rounded-xl p-4 hover:border-blue-500/30 transition-all">
                                    {/* Block controls */}
                                    <div className="absolute right-3 top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button type="button" onClick={() => handleMoveBlock(index, 'up')} disabled={index === 0} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-gray-400 disabled:opacity-30 text-xs transition-colors">↑</button>
                                        <button type="button" onClick={() => handleMoveBlock(index, 'down')} disabled={index === blocks.length - 1} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-gray-400 disabled:opacity-30 text-xs transition-colors">↓</button>
                                        <button type="button" onClick={() => handleRemoveBlock(block.id)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 text-xs transition-colors"><Trash2 size={12} /></button>
                                    </div>

                                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 block">
                                        {block.type === 'text' ? 'Text Block' : 'Image Block'}
                                    </span>

                                    {block.type === 'text' ? (
                                        <Textarea
                                            value={block.content}
                                            onChange={(e) => handleUpdateBlock(block.id, e.target.value)}
                                            className="w-full bg-transparent border-none text-white text-sm focus:ring-0 outline-none min-h-[100px] p-0 resize-none"
                                            placeholder="Write your paragraph here..."
                                        />
                                    ) : (
                                        <div className="text-center">
                                            {block.content ? (
                                                <div className="relative inline-block">
                                                    <img src={block.content} alt="Block" className="max-h-52 rounded-lg" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateBlock(block.id, '')}
                                                        className="absolute top-2 right-2 bg-red-500/80 text-white p-1 rounded-full hover:bg-red-600"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="cursor-pointer flex flex-col items-center gap-2 py-6 border-2 border-dashed border-white/15 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/25 transition-all">
                                                    <Image size={28} className="text-gray-600" />
                                                    <span className="text-sm text-gray-500">Click to upload image</span>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => e.target.files?.[0] && handleBlockImageUpload(block.id, e.target.files[0])}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3 justify-center pt-2">
                            <button
                                type="button"
                                onClick={() => handleAddBlock('text')}
                                className="px-4 py-2.5 bg-white/5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/10 flex items-center gap-2 text-sm transition-colors"
                            >
                                <Plus size={16} /> Text Block
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAddBlock('image')}
                                className="px-4 py-2.5 bg-white/5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/10 flex items-center gap-2 text-sm transition-colors"
                            >
                                <Image size={16} /> Image Block
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }


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
            showToast("Post deleted successfully!", "success");
        } catch (error: any) {
            console.error("Failed to delete post", error);
            showToast(error.response?.data?.message || "Failed to delete post", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                    >
                        <h3 className="text-xl font-bold text-white mb-2">Delete Post?</h3>
                        <p className="text-gray-400 mb-6">
                            Are you sure you want to delete this post? This action cannot be undone.
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
                                {isDeleting ? 'Deleting...' : 'Delete Post'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-500" /> Blog Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">{posts.length} post{posts.length !== 1 ? 's' : ''} total</p>
                </div>
                <button
                    onClick={() => { setCurrentPost({}); setIsEditing(true); }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm font-bold transition-colors"
                >
                    <Plus size={16} /> New Post
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    value={blogSearch}
                    onChange={(e) => setBlogSearch(e.target.value)}
                    placeholder="Search by title, author or excerpt..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                />
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400 uppercase tracking-wider font-bold">Total Posts</p>
                        <p className="text-3xl font-black text-white">{posts.length}</p>
                    </div>
                    <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                        <FileText className="w-6 h-6" />
                    </div>
                </div>
                <div className="glass-card p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400 uppercase tracking-wider font-bold">Published</p>
                        <p className="text-3xl font-black text-white">{posts.filter(p => p.status === 'PUBLISHED').length}</p>
                    </div>
                    <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                </div>
                <div className="glass-card p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400 uppercase tracking-wider font-bold">Pending</p>
                        <p className="text-3xl font-black text-white">{posts.filter(p => p.status === 'PENDING').length}</p>
                    </div>
                    <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-400">
                        <Clock className="w-6 h-6" />
                    </div>
                </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 flex gap-4">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${filter === 'ALL' ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('PUBLISHED')}
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${filter === 'PUBLISHED' ? 'bg-green-500 text-white' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}
                    >
                        Published
                    </button>
                    <button
                        onClick={() => setFilter('PENDING')}
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${filter === 'PENDING' ? 'bg-yellow-500 text-white' : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'}`}
                    >
                        Pending
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Author</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Published</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {filteredPosts.map((post) => (
                                <tr key={post.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {post.imageUrl && (
                                                <img src={post.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />
                                            )}
                                            <div>
                                                <div className="text-sm font-bold text-white">{post.title}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-xs">{post.slug}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-400">{post.author?.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${post.status === 'PUBLISHED' ? 'bg-green-500/20 text-green-500' :
                                            post.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' :
                                                'bg-gray-500/20 text-gray-400'
                                            }`}>
                                            {post.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-400">
                                        {new Date(post.publishedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {post.status === 'PENDING' && user?.role === 'ADMIN' && (
                                            <button
                                                onClick={() => handleApprove(post.id)}
                                                disabled={approvingId === post.id}
                                                className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 px-3 py-1 rounded-lg mr-4 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {approvingId === post.id ? 'Approving...' : 'Approve'}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => { setCurrentPost(post); setIsEditing(true); }}
                                            className="text-blue-400 hover:text-blue-300 mr-4"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(post.id)}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredPosts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No posts found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BlogManager;
