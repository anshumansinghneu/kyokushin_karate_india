"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Calendar, User, AlertCircle, RefreshCw } from "lucide-react";

export default function BlogList() {
    const [posts, setPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchPosts = async () => {
        setIsLoading(true);
        setError(false);
        try {
            const res = await api.get('/posts?type=BLOG');
            setPosts(res.data.data.posts || []);
        } catch (err) {
            console.error("Failed to fetch blogs", err);
            setError(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-12">
            <div className="container mx-auto px-4">
                <h1 className="text-4xl md:text-6xl font-black mb-12 text-center tracking-tight text-white">
                    DOJO <span className="text-red-600">CHRONICLES</span>
                </h1>

                {isLoading ? (
                    <div className="text-center text-gray-500">Loading chronicles...</div>
                ) : error ? (
                    <div className="text-center py-20">
                        <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                        <p className="text-gray-400 text-lg mb-4">Failed to load chronicles</p>
                        <button onClick={fetchPosts} className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-bold transition-all">
                            <RefreshCw className="w-4 h-4" /> Try Again
                        </button>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-20">
                        <Calendar className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-500 text-lg">No chronicles published yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <Link href={`/blog/${post.slug}`} key={post.id} className="group">
                                <article className="bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 hover:border-red-600/50 transition-all duration-300 h-full flex flex-col hover:-translate-y-1">
                                    <div className="aspect-video bg-zinc-800 relative overflow-hidden">
                                        {post.imageUrl ? (
                                            <img
                                                src={post.imageUrl}
                                                alt={post.title}
                                                loading="lazy"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-700 font-bold text-xl">
                                                NO IMAGE
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex items-center gap-4 text-xs text-gray-400 mb-3 font-medium">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} className="text-red-500" />
                                                {new Date(post.publishedAt).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <User size={12} className="text-red-500" />
                                                {post.author?.name}
                                            </span>
                                        </div>
                                        <h2 className="text-xl font-bold mb-3 text-white group-hover:text-red-500 transition-colors line-clamp-2 leading-tight">
                                            {post.title}
                                        </h2>
                                        <p className="text-gray-400 text-sm line-clamp-3 mb-4 flex-1 leading-relaxed">
                                            {post.excerpt}
                                        </p>
                                        <span className="text-red-500 text-sm font-bold uppercase tracking-wider flex items-center gap-2 group-hover:gap-3 transition-all">
                                            Read More →
                                        </span>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
