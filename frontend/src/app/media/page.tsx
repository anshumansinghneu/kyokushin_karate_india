"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { ExternalLink } from "lucide-react";

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
        <div className="min-h-screen bg-black text-white pt-24 pb-12">
            <div className="container mx-auto px-4">
                <h1 className="text-4xl md:text-6xl font-black mb-4 text-center">
                    IN THE <span className="text-red-600">MEDIA</span>
                </h1>
                <p className="text-gray-400 text-center max-w-2xl mx-auto mb-16">
                    Kyokushin making headlines across the globe.
                </p>

                {isLoading ? (
                    <div className="text-center text-gray-500">Loading media...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <a
                                href={post.externalLink || post.attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                key={post.id}
                                className="group block"
                            >
                                <article className="bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 hover:border-red-600/50 transition-all duration-300 h-full relative">
                                    <div className="aspect-[4/3] bg-zinc-800 relative overflow-hidden">
                                        {post.imageUrl ? (
                                            <img
                                                src={post.imageUrl}
                                                alt={post.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-red-900/30 via-zinc-900 to-black flex flex-col items-center justify-center relative">
                                                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:16px_16px]" />
                                                <svg viewBox="0 0 120 80" className="w-24 h-16 text-white/10 relative z-10">
                                                    <text x="60" y="35" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="900" fill="currentColor">KKFI</text>
                                                    <text x="60" y="55" textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="700" fill="currentColor">MEDIA</text>
                                                </svg>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            {post.attachmentUrl ? (
                                                <div className="bg-red-600 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2">
                                                    View PDF
                                                </div>
                                            ) : (
                                                <ExternalLink className="text-white w-10 h-10" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex justify-between items-center">
                                            <span>{post.sourceName}</span>
                                            {post.attachmentUrl && <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded text-[10px]">PDF</span>}
                                        </div>
                                        <h2 className="text-xl font-bold mb-1 group-hover:text-red-500 transition-colors">
                                            {post.title}
                                        </h2>
                                        <div className="text-xs text-gray-500 mt-4">
                                            {new Date(post.publishedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </article>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
