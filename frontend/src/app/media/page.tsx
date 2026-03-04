"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { ExternalLink, Newspaper } from "lucide-react";

const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

export default function MediaPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
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
        fetchPosts();
    }, []);

    return (
        <div className="min-h-screen bg-[#080808] text-white">
            {/* Top accent */}
            <div className="h-px bg-gradient-to-r from-transparent via-red-600/50 to-transparent" />

            {/* Hero */}
            <div className="relative pt-28 pb-14 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:32px_32px]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-red-600/[0.04] rounded-full blur-[100px]" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10 text-center max-w-3xl mx-auto px-5"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-gray-400 tracking-wide mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        PRESS & COVERAGE
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 leading-[1.05]">
                        In the <span className="text-red-500">Media</span>
                    </h1>
                    <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
                        Kyokushin making headlines across the globe.
                    </p>
                </motion.div>
            </div>

            <div className="max-w-6xl mx-auto px-5 pb-20">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="aspect-[4/5] bg-white/[0.03] rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] mb-5">
                            <Newspaper className="w-6 h-6 text-gray-600" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-white">No media mentions yet</h3>
                        <p className="text-gray-500 text-sm">Check back soon for press coverage.</p>
                    </div>
                ) : (
                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                    >
                        {posts.map((post) => (
                            <motion.div key={post.id} variants={fadeUp}>
                                <a
                                    href={post.externalLink || post.attachmentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group block h-full"
                                >
                                    <article className="bg-white/[0.02] rounded-xl overflow-hidden border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 h-full relative">
                                        <div className="aspect-[4/3] bg-white/[0.03] relative overflow-hidden">
                                            {post.imageUrl ? (
                                                <img
                                                    src={post.imageUrl}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-red-900/10 via-transparent to-transparent flex flex-col items-center justify-center relative">
                                                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:16px_16px]" />
                                                    <span className="text-white/[0.06] text-3xl font-black relative z-10">KKFI</span>
                                                    <span className="text-white/[0.04] text-xs font-bold relative z-10 mt-1">MEDIA</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                {post.attachmentUrl ? (
                                                    <div className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                                                        View PDF
                                                    </div>
                                                ) : (
                                                    <ExternalLink className="text-white w-8 h-8" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-5">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-bold text-red-500/80 uppercase tracking-[0.15em]">{post.sourceName}</span>
                                                {post.attachmentUrl && (
                                                    <span className="bg-white/[0.04] text-gray-500 px-2 py-0.5 rounded text-[10px] font-mono">PDF</span>
                                                )}
                                            </div>
                                            <h2 className="text-base font-bold text-white/90 mb-2 group-hover:text-white transition-colors line-clamp-2 leading-snug">
                                                {post.title}
                                            </h2>
                                            <div className="text-xs text-gray-600 font-mono mt-3">
                                                {new Date(post.publishedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </article>
                                </a>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
