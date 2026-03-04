"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { Calendar, User, AlertCircle, RefreshCw, BookOpen, Award, History, Swords, ArrowRight } from "lucide-react";

const PILLAR_ARTICLES = [
    {
        slug: "kyokushin-vs-shotokan",
        title: "What Makes Kyokushin Different from Shotokan?",
        excerpt: "Discover the key differences between Kyokushin and Shotokan karate — full-contact sparring, conditioning, and the spirit of Osu!",
        category: "Karate Knowledge",
        icon: Swords,
        date: "February 13, 2026",
    },
    {
        slug: "full-contact-training-youth-benefits",
        title: "The Benefits of Full-Contact Training for Youth",
        excerpt: "Why parents across India are choosing Kyokushin for their children — confidence, discipline, anti-bullying resilience & fitness.",
        category: "Youth Development",
        icon: Award,
        date: "February 13, 2026",
    },
    {
        slug: "history-kyokushin-india",
        title: "History of Kyokushin in India: From Sosai Oyama to Today",
        excerpt: "The complete journey of Kyokushin Karate from Japan to India — from Sosai Oyama to KKFI under Shihan Vasant Kumar Singh.",
        category: "Our Heritage",
        icon: History,
        date: "February 13, 2026",
    },
    {
        slug: "kyokushin-grading-syllabus-2026",
        title: "Kyokushin Grading Syllabus 2026: Complete Belt Guide",
        excerpt: "Complete belt rank guide from white to black belt — kata requirements, kumite expectations & promotion criteria.",
        category: "Official Syllabus",
        icon: BookOpen,
        date: "February 13, 2026",
    },
];

const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

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
        <div className="min-h-screen bg-[#080808] text-white">
            {/* Top accent */}
            <div className="h-px bg-gradient-to-r from-transparent via-red-600/50 to-transparent" />

            {/* Hero */}
            <div className="relative pt-28 pb-16 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:32px_32px]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/[0.04] rounded-full blur-[100px]" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10 text-center max-w-3xl mx-auto px-5"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-gray-400 tracking-wide mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        DOJO CHRONICLES
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 leading-[1.05]">
                        Stories from the <span className="text-red-500">Dojo Floor</span>
                    </h1>
                    <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
                        Expert articles on Kyokushin training, philosophy, youth development, and the martial arts journey in India.
                    </p>
                </motion.div>
            </div>

            <div className="max-w-6xl mx-auto px-5 pb-20">
                {/* Featured Pillar Articles */}
                <motion.section
                    variants={stagger}
                    initial="hidden"
                    animate="show"
                    className="mb-20"
                >
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-8 h-px bg-red-600" />
                        <h2 className="text-xs font-bold text-red-500 uppercase tracking-[0.2em]">Featured Guides</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {PILLAR_ARTICLES.map((article) => {
                            const Icon = article.icon;
                            return (
                                <motion.div key={article.slug} variants={fadeUp}>
                                    <Link href={`/blog/${article.slug}`} className="group block">
                                        <article className="relative bg-white/[0.02] rounded-xl p-6 border border-white/[0.06] hover:border-red-500/25 transition-all duration-300 h-full flex flex-col overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-br from-red-600/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            <div className="relative z-10 flex flex-col h-full">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-9 h-9 rounded-lg bg-red-500/[0.08] border border-red-500/[0.12] flex items-center justify-center">
                                                        <Icon className="w-4 h-4 text-red-500" />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-red-400/80 uppercase tracking-[0.15em]">{article.category}</span>
                                                </div>
                                                <h3 className="text-lg font-bold text-white/90 mb-2 group-hover:text-white transition-colors leading-snug">
                                                    {article.title}
                                                </h3>
                                                <p className="text-gray-500 text-sm flex-1 leading-relaxed mb-5">
                                                    {article.excerpt}
                                                </p>
                                                <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
                                                    <span className="text-xs text-gray-600 font-mono">{article.date}</span>
                                                    <span className="flex items-center gap-1.5 text-red-500/80 text-xs font-semibold group-hover:text-red-400 group-hover:gap-2.5 transition-all">
                                                        Read <ArrowRight className="w-3 h-3" />
                                                    </span>
                                                </div>
                                            </div>
                                        </article>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.section>

                {/* Latest Posts */}
                {posts.length > 0 && (
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-8 h-px bg-white/20" />
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Latest Posts</h2>
                        <div className="flex-1 h-px bg-white/[0.04]" />
                    </div>
                )}

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="aspect-[4/5] bg-white/[0.03] rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-24">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/[0.08] border border-red-500/[0.12] mb-5">
                            <AlertCircle className="w-6 h-6 text-red-500" />
                        </div>
                        <p className="text-gray-400 text-lg mb-5">Failed to load chronicles</p>
                        <button onClick={fetchPosts} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors active:scale-[0.97]">
                            <RefreshCw className="w-3.5 h-3.5" /> Try Again
                        </button>
                    </div>
                ) : posts.length === 0 ? null : (
                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                    >
                        {posts.map((post) => (
                            <motion.div key={post.id} variants={fadeUp}>
                                <Link href={`/blog/${post.slug}`} className="group block h-full">
                                    <article className="bg-white/[0.02] rounded-xl overflow-hidden border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 h-full flex flex-col">
                                        <div className="aspect-video bg-white/[0.03] relative overflow-hidden">
                                            {post.imageUrl ? (
                                                <img
                                                    src={post.imageUrl}
                                                    alt={post.title}
                                                    loading="lazy"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="text-white/[0.06] text-4xl font-black">KKFI</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col">
                                            <div className="flex items-center gap-4 text-[11px] text-gray-500 mb-3 font-medium">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar size={11} className="text-red-500/60" />
                                                    {new Date(post.publishedAt).toLocaleDateString()}
                                                </span>
                                                {post.author?.name && (
                                                    <span className="flex items-center gap-1.5">
                                                        <User size={11} className="text-red-500/60" />
                                                        {post.author.name}
                                                    </span>
                                                )}
                                            </div>
                                            <h2 className="text-base font-bold mb-3 text-white/90 group-hover:text-white transition-colors line-clamp-2 leading-snug">
                                                {post.title}
                                            </h2>
                                            <p className="text-gray-500 text-sm line-clamp-3 mb-5 flex-1 leading-relaxed">
                                                {post.excerpt}
                                            </p>
                                            <span className="flex items-center gap-1.5 text-red-500/70 text-xs font-semibold group-hover:text-red-400 group-hover:gap-2.5 transition-all">
                                                Read More <ArrowRight className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </article>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
