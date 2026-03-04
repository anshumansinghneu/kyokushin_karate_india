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
            await api.post('/posts', { ...formData, imageUrl: formData.imageUrl || null });
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
        <div className="border border-white/[0.06] bg-white/[0.02] rounded-2xl p-6 md:p-8">
            <div className="mb-8">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-900/30">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </div>
                    Submit a Blog Post
                </h2>
                <p className="text-gray-500 mt-1.5 ml-[52px]">Share your knowledge and experiences with the community. All posts are reviewed before publishing.</p>
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
                        className="bg-white/[0.03] border-white/[0.06] text-white h-12"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Excerpt (Short Summary)</label>
                    <Textarea
                        value={formData.excerpt}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, excerpt: e.target.value })}
                        placeholder="A brief summary of your post..."
                        className="bg-white/[0.03] border-white/[0.06] text-white min-h-[80px]"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Content</label>
                    <Textarea
                        value={formData.content}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="Write your full article here..."
                        className="bg-white/[0.03] border-white/[0.06] text-white min-h-[300px]"
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
                        className="bg-white/[0.03] border-white/[0.06] text-white h-12"
                    />
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
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
