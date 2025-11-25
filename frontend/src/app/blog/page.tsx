"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Calendar, User } from "lucide-react";

export default function BlogList() {
    const [posts, setPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const res = await api.get('/posts?type=BLOG');
                setPosts(res.data.data.posts || []);
            } catch (error) {
                console.error("Failed to fetch blogs", error);
            } finally {
                setIsLoading(false);
            }
        };
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
