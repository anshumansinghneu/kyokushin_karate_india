"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, FileText } from "lucide-react";
import api from "@/lib/api";
import PageHero from "@/components/brand/PageHero";
import Section from "@/components/brand/Section";
import Reveal from "@/components/brand/Reveal";
import BrandLink from "@/components/brand/BrandLink";

interface MediaPost {
    id: string;
    title: string;
    sourceName?: string;
    externalLink?: string | null;
    attachmentUrl?: string | null;
    imageUrl?: string | null;
    publishedAt: string;
}

export default function MediaPage() {
    const [posts, setPosts] = useState<MediaPost[]>([]);
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
        <div className="min-h-screen bg-black text-white">
            <PageHero
                height="compact"
                title={<>In the press<span className="text-primary">.</span></>}
                lede="Kyokushin making headlines across the globe."
            />

            <Section rhythm="base" width="wide">
                {isLoading ? (
                    <ul aria-busy="true" className="divide-y divide-white/10 border-y border-white/10">
                        {[1, 2, 3].map((i) => (
                            <li key={i} className="grid gap-3 py-7 sm:grid-cols-[12rem_1fr]">
                                <div className="h-4 w-28 animate-pulse rounded bg-white/5" />
                                <div className="h-6 w-3/4 animate-pulse rounded bg-white/5" />
                            </li>
                        ))}
                    </ul>
                ) : posts.length === 0 ? (
                    <div className="border-t border-white/15 pt-10">
                        <p className="text-[clamp(1.4rem,3vw,2rem)] font-extrabold leading-tight text-white">No coverage listed yet.</p>
                        <p className="mt-3 max-w-[52ch] text-lg leading-relaxed text-white/70">
                            Press mentions, interviews and features about KKFI will appear here as they are published.
                        </p>
                        <div className="mt-8">
                            <BrandLink href="/contact" variant="outline">Press enquiries</BrandLink>
                        </div>
                    </div>
                ) : (
                    // A press list: source, headline, date. Covers appear only where a publication supplied one.
                    <ul className="divide-y divide-white/10 border-y border-white/10">
                        {posts.map((post, i) => {
                            const href = post.externalLink || post.attachmentUrl || undefined;
                            const isPdf = !post.externalLink && !!post.attachmentUrl;
                            return (
                                <Reveal as="li" key={post.id} delay={Math.min(i, 4) * 0.05}>
                                    <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group grid items-center gap-x-8 gap-y-3 py-7 sm:grid-cols-[12rem_1fr_auto]"
                                    >
                                        <span className="font-semibold text-white/60">{post.sourceName}</span>
                                        <span className="flex min-w-0 items-center gap-5">
                                            {post.imageUrl && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={post.imageUrl} alt="" loading="lazy" className="hidden h-16 w-24 shrink-0 rounded-md object-cover grayscale transition duration-500 group-hover:grayscale-0 md:block" />
                                            )}
                                            <span className="min-w-0">
                                                <span className="block text-pretty text-lg font-bold leading-snug text-white transition-colors group-hover:text-primary-light md:text-xl">
                                                    {post.title}
                                                </span>
                                                <span className="mt-1 flex items-center gap-2 text-sm text-white/50">
                                                    {new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                                                    {post.attachmentUrl && (
                                                        <span className="inline-flex items-center gap-1 text-white/60">
                                                            <FileText className="h-3.5 w-3.5" aria-hidden="true" /> PDF
                                                        </span>
                                                    )}
                                                </span>
                                            </span>
                                        </span>
                                        <span className="hidden items-center gap-2 text-sm font-semibold text-white/50 transition-colors group-hover:text-white sm:flex">
                                            {isPdf ? "View PDF" : "Read"}
                                            <ArrowUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                                        </span>
                                    </a>
                                </Reveal>
                            );
                        })}
                    </ul>
                )}
            </Section>
        </div>
    );
}
