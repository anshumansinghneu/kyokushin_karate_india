"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Image as ImageIcon, Link as LinkIcon, AlertCircle, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";

export default function BlogSubmission() {
    const [formData, setFormData] = useState({
        title: "",
        excerpt: "",
        content: "",
        imageUrl: "",
        type: "BLOG"
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState("");

    // Warn user about unsaved changes before navigating away
    const hasUnsavedContent = formData.title || formData.excerpt || formData.content;
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedContent) {
                e.preventDefault();
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedContent]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus('idle');

        try {
            await api.post('/posts', formData);
            setStatus('success');
            setMessage("Blog submitted successfully! It will be visible after admin approval.");
            setFormData({ title: "", excerpt: "", content: "", imageUrl: "", type: "BLOG" });
        } catch (error: any) {
            setStatus('error');
            setMessage(error.response?.data?.message || "Failed to submit blog. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 md:p-8">
            <div className="mb-8">
                <h2 className="text-2xl font-black text-white mb-2">Submit a Blog Post</h2>
                <p className="text-gray-400">Share your knowledge and experiences with the community. All posts are reviewed before publishing.</p>
            </div>

            {status === 'success' && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-400"
                >
                    <CheckCircle className="w-5 h-5" />
                    {message}
                </motion.div>
            )}

            {status === 'error' && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400"
                >
                    <AlertCircle className="w-5 h-5" />
                    {message}
                </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Title</label>
                    <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter an engaging title..."
                        className="bg-black/50 border-white/10 text-white h-12"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Excerpt (Short Summary)</label>
                    <Textarea
                        value={formData.excerpt}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, excerpt: e.target.value })}
                        placeholder="A brief summary of your post..."
                        className="bg-black/50 border-white/10 text-white min-h-[80px]"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Content</label>
                    <Textarea
                        value={formData.content}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="Write your full article here..."
                        className="bg-black/50 border-white/10 text-white min-h-[300px]"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" /> Cover Image URL
                    </label>
                    <Input
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        className="bg-black/50 border-white/10 text-white h-12"
                    />
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                    {loading ? "Submitting..." : (
                        <>
                            <Send className="w-4 h-4" /> Submit for Review
                        </>
                    )}
                </Button>
            </form>
        </div>
    );
}
