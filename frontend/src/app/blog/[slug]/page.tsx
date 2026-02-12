"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Calendar, User, ArrowLeft, Share2, Clock } from "lucide-react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import DOMPurify from "dompurify";

export default function BlogPost() {
    const { slug } = useParams();
    const [post, setPost] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await api.get(`/posts/slug/${slug}`);
                setPost(res.data.data.post);
            } catch (error) {
                console.error("Failed to fetch post", error);
            } finally {
                setIsLoading(false);
            }
        };
        if (slug) fetchPost();
    }, [slug]);

    const [blocks, setBlocks] = useState<{ type: 'text' | 'image', content: string }[]>([]);

    useEffect(() => {
        if (post?.content) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(post.content, 'text/html');
            const newBlocks: { type: 'text' | 'image', content: string }[] = [];

            Array.from(doc.body.children).forEach((child) => {
                const img = child.querySelector('img');
                if (img) {
                    newBlocks.push({ type: 'image', content: img.src });
                } else {
                    newBlocks.push({ type: 'text', content: child.innerHTML });
                }
            });
            setBlocks(newBlocks);
        }
    }, [post]);

    const renderBlocks = () => {
        const rendered = [];
        let i = 0;

        while (i < blocks.length) {
            const current = blocks[i];
            const next = blocks[i + 1];

            // Check for Text + Image pair (Side by Side)
            if (current.type === 'text' && next?.type === 'image') {
                rendered.push(
                    <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center my-12">
                        <div className="prose prose-lg prose-invert text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(current.content) }} />
                        <div className="rounded-xl overflow-hidden shadow-lg border border-white/10">
                            <img src={next.content} alt="Blog Content" className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500" />
                        </div>
                    </div>
                );
                i += 2;
            }
            // Check for Image + Text pair (Side by Side - Reversed)
            else if (current.type === 'image' && next?.type === 'text') {
                rendered.push(
                    <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center my-12">
                        <div className="rounded-xl overflow-hidden shadow-lg border border-white/10 order-2 md:order-1">
                            <img src={current.content} alt="Blog Content" className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="prose prose-lg prose-invert text-gray-300 leading-relaxed order-1 md:order-2" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(next.content) }} />
                    </div>
                );
                i += 2;
            }
            // Single Block
            else {
                if (current.type === 'text') {
                    rendered.push(
                        <div key={i} className="prose prose-lg prose-invert max-w-none text-gray-300 leading-relaxed my-8" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(current.content) }} />
                    );
                } else {
                    rendered.push(
                        <div key={i} className="my-12 rounded-xl overflow-hidden shadow-lg border border-white/10">
                            <img src={current.content} alt="Blog Content" className="w-full max-h-[600px] object-cover mx-auto hover:scale-105 transition-transform duration-500" />
                        </div>
                    );
                }
                i++;
            }
        }
        return rendered;
    };

    return (
        <div ref={containerRef} className="min-h-screen bg-black text-white selection:bg-red-900 selection:text-white">
            {isLoading ? (
                <div className="min-h-screen flex items-center justify-center bg-black">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
                </div>
            ) : !post ? (
                <div className="min-h-screen flex flex-col items-center justify-center bg-black">
                    <h1 className="text-4xl font-bold mb-4 text-white">404</h1>
                    <p className="text-gray-400 mb-8">The chronicle you seek does not exist.</p>
                    <Link href="/blog" className="text-red-500 hover:text-red-400 flex items-center gap-2 font-medium">
                        <ArrowLeft size={20} /> Return to Archives
                    </Link>
                </div>
            ) : (
                <>
                    {/* HERO SECTION */}
                    <div className="relative h-[60vh] w-full overflow-hidden">
                        <motion.div style={{ y, opacity }} className="absolute inset-0">
                            {post.imageUrl ? (
                                <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                    <span className="text-zinc-800 text-9xl font-black opacity-50">KYOKUSHIN</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black z-10" />
                        </motion.div>

                        <div className="absolute bottom-0 left-0 right-0 z-20 pb-16 pt-32 bg-gradient-to-t from-black via-black/80 to-transparent">
                            <div className="container mx-auto px-4 max-w-5xl">
                                <Link href="/blog" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors group font-medium">
                                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                    Back to Chronicles
                                </Link>

                                <motion.h1
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8 }}
                                    className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight tracking-tight text-white shadow-sm"
                                >
                                    {post.title}
                                </motion.h1>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3, duration: 0.8 }}
                                    className="flex flex-wrap items-center gap-6 text-sm md:text-base text-gray-300"
                                >
                                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                                        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center font-bold text-white text-xs">
                                            {post.author?.name?.charAt(0) || 'K'}
                                        </div>
                                        <span className="font-bold text-white">{post.author?.name || 'Kyokushin HQ'}</span>
                                    </div>
                                    <span className="flex items-center gap-2">
                                        <Calendar size={16} className="text-red-500" />
                                        {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Clock size={16} className="text-red-500" />
                                        {Math.ceil((post.content?.length || 0) / 1000)} min read
                                    </span>
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    {/* CONTENT SECTION */}
                    <article className="container mx-auto px-4 max-w-5xl py-16">
                        {renderBlocks()}

                        {/* SHARE / FOOTER */}
                        <div className="mt-20 pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                            <p className="text-gray-500 italic font-serif text-lg">
                                "The true essence of Kyokushin lies in the perseverance of the spirit."
                            </p>
                            <div className="flex gap-4">
                                <button className="p-3 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white transition-colors" title="Share">
                                    <Share2 size={20} />
                                </button>
                            </div>
                        </div>
                    </article>
                </>
            )}
        </div>
    );
}
