"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import PageHero from "@/components/brand/PageHero";
import Section, { Heading } from "@/components/brand/Section";
import Reveal from "@/components/brand/Reveal";
import { GUIDES } from "./_components/article";

interface Post {
    id: string;
    slug: string;
    title: string;
    excerpt?: string;
    imageUrl?: string | null;
    publishedAt: string;
    author?: { name?: string } | null;
}

const longDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

export default function BlogList() {
    const [posts, setPosts] = useState<Post[]>([]);
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
        // Deferred a frame so the fetch's state updates never run synchronously inside the effect.
        const id = requestAnimationFrame(() => { fetchPosts(); });
        return () => cancelAnimationFrame(id);
    }, []);

    const [lead, ...rest] = GUIDES;
    const [latest, ...older] = posts;

    return (
        <div className="min-h-screen bg-black text-white">
            <PageHero
                height="tall"
                title={<>Dojo chronicles<span className="text-primary">.</span></>}
                lede="Expert articles on Kyokushin training, philosophy, youth development, and the martial arts journey in India."
                media={
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/gallery/DSC08858.JPG" alt="" className="h-full w-full object-cover opacity-70 grayscale-[0.4]" />
                }
            />

            {/* GUIDES: one lead story, three to follow. */}
            <Section rhythm="base" width="wide">
                <Heading>Guides</Heading>
                <div className="mt-10 grid gap-12 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
                    <Reveal kind="depth">
                        <Link href={`/blog/${lead.slug}`} className="group block">
                            <div className="aspect-[16/10] overflow-hidden rounded-xl bg-surface">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={lead.image} alt={lead.imageAlt} className="h-full w-full object-cover grayscale-[0.25] transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
                            </div>
                            <p className="mt-6 text-sm font-semibold text-white/60">{lead.category} · {lead.date}</p>
                            <h3 className="mt-2 max-w-[24ch] text-balance text-[clamp(1.6rem,3vw,2.4rem)] font-extrabold leading-[1.08] tracking-[-0.015em] text-white transition-colors group-hover:text-primary-light">
                                {lead.title}
                            </h3>
                            <p className="mt-4 max-w-[56ch] text-pretty leading-relaxed text-white/70">{lead.excerpt}</p>
                            <span className="mt-6 inline-flex items-center gap-2 font-semibold text-white">
                                Read the guide <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                            </span>
                        </Link>
                    </Reveal>

                    <ul className="divide-y divide-white/10 border-y border-white/10 self-start">
                        {rest.map((g, i) => (
                            <Reveal as="li" key={g.slug} delay={0.08 * (i + 1)}>
                                <Link href={`/blog/${g.slug}`} className="group flex gap-5 py-6">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={g.image} alt="" className="h-24 w-24 shrink-0 rounded-lg object-cover grayscale transition duration-500 group-hover:grayscale-0 sm:h-28 sm:w-28" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-white/55">{g.category}</p>
                                        <h3 className="mt-1 text-pretty text-lg font-bold leading-snug text-white transition-colors group-hover:text-primary-light">{g.title}</h3>
                                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/60">{g.excerpt}</p>
                                    </div>
                                </Link>
                            </Reveal>
                        ))}
                    </ul>
                </div>
            </Section>

            {/* FROM THE DOJOS: posts published through the admin. Silent when there are none. */}
            {isLoading ? (
                <Section rhythm="tight" width="wide" aria-busy="true">
                    <div className="h-9 w-64 animate-pulse rounded bg-white/5" />
                    <div className="mt-10 grid gap-10 lg:grid-cols-[1.35fr_1fr]">
                        <div className="aspect-[16/10] animate-pulse rounded-xl bg-white/5" />
                        <div className="space-y-6">
                            <div className="h-24 animate-pulse rounded-lg bg-white/5" />
                            <div className="h-24 animate-pulse rounded-lg bg-white/5" />
                        </div>
                    </div>
                </Section>
            ) : error ? (
                <Section rhythm="tight" width="wide">
                    <div className="border-t border-white/15 pt-10">
                        <p className="text-lg font-bold text-white">We couldn&apos;t load the latest posts.</p>
                        <p className="mt-2 text-white/65">The guides above are always available.</p>
                        <button
                            onClick={fetchPosts}
                            className="mt-6 inline-flex min-h-12 items-center gap-2 border border-white/25 px-6 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                        >
                            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
                        </button>
                    </div>
                </Section>
            ) : latest ? (
                <Section rhythm="base" width="wide">
                    <Heading>From the dojos</Heading>
                    <div className="mt-10 grid gap-12 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
                        <Reveal kind="depth">
                            <Link href={`/blog/${latest.slug}`} className="group block">
                                <div className="aspect-[16/10] overflow-hidden rounded-xl bg-surface">
                                    {latest.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={latest.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
                                    ) : (
                                        <div className="flex h-full w-full items-end p-8">
                                            <span className="text-[clamp(2rem,5vw,3.5rem)] font-black leading-none text-white/10">KKFI</span>
                                        </div>
                                    )}
                                </div>
                                <p className="mt-6 text-sm font-semibold text-white/60">
                                    {longDate(latest.publishedAt)}
                                    {latest.author?.name && <> · {latest.author.name}</>}
                                </p>
                                <h3 className="mt-2 max-w-[24ch] text-balance text-[clamp(1.6rem,3vw,2.4rem)] font-extrabold leading-[1.08] tracking-[-0.015em] text-white transition-colors group-hover:text-primary-light">
                                    {latest.title}
                                </h3>
                                {latest.excerpt && <p className="mt-4 max-w-[56ch] text-pretty leading-relaxed text-white/70 line-clamp-3">{latest.excerpt}</p>}
                            </Link>
                        </Reveal>
                        {older.length > 0 && (
                            <ul className="divide-y divide-white/10 border-y border-white/10 self-start">
                                {older.map((post, i) => (
                                    <Reveal as="li" key={post.id} delay={Math.min(i, 3) * 0.06}>
                                        <Link href={`/blog/${post.slug}`} className="group flex gap-5 py-6">
                                            {post.imageUrl && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={post.imageUrl} alt="" loading="lazy" className="h-24 w-24 shrink-0 rounded-lg object-cover grayscale transition duration-500 group-hover:grayscale-0" />
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-sm text-white/55">{longDate(post.publishedAt)}</p>
                                                <h3 className="mt-1 text-lg font-bold leading-snug text-white transition-colors group-hover:text-primary-light line-clamp-2">{post.title}</h3>
                                            </div>
                                        </Link>
                                    </Reveal>
                                ))}
                            </ul>
                        )}
                    </div>
                </Section>
            ) : null}

            <div className="h-[clamp(2rem,6vw,5rem)]" />
        </div>
    );
}
