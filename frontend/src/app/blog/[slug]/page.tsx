"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { ArrowLeft, Check, Share2 } from "lucide-react";
import Link from "next/link";
import DOMPurify from "dompurify";

import KarateLoader from '@/components/KarateLoader';
import BrandLink from "@/components/brand/BrandLink";
import { ArticleHero, GUIDES, KeepReading, PROSE } from "../_components/article";

interface Post {
    id: string;
    slug: string;
    title: string;
    excerpt?: string;
    content?: string;
    imageUrl?: string | null;
    publishedAt: string;
    author?: { name?: string } | null;
}

type Block = { type: 'text' | 'image'; content: string };

/** Split CMS HTML into runs of text and stand-alone images, so pictures can break out of the reading column. */
function toBlocks(html: string): Block[] {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const blocks: Block[] = [];
    Array.from(doc.body.children).forEach((child) => {
        const img = child.tagName === 'IMG' ? (child as HTMLImageElement) : child.querySelector('img');
        if (img) {
            blocks.push({ type: 'image', content: img.src });
            return;
        }
        // outerHTML, not innerHTML: keeps the element itself, so headings, lists and quotes stay what they are.
        const last = blocks[blocks.length - 1];
        if (last?.type === 'text') last.content += child.outerHTML;
        else blocks.push({ type: 'text', content: child.outerHTML });
    });
    return blocks;
}

function readingMinutes(html?: string) {
    if (!html) return 1;
    const words = html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 220));
}

function ShareButton({ title }: { title: string }) {
    const [copied, setCopied] = useState(false);
    const share = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) await navigator.share({ title, url });
            else {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
            }
        } catch {
            /* Share sheet dismissed: nothing to do. */
        }
    };
    return (
        <button
            type="button"
            onClick={share}
            className="inline-flex min-h-12 items-center gap-2 border border-white/25 px-6 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
            {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
            {copied ? 'Link copied' : 'Share this story'}
        </button>
    );
}

export default function BlogPost() {
    const { slug } = useParams();
    const [post, setPost] = useState<Post | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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

    const blocks = useMemo(() => (post?.content ? toBlocks(post.content) : []), [post]);

    if (isLoading) {
        return (
            <div className="flex min-h-[70svh] items-center justify-center bg-black">
                <KarateLoader label="Loading story" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="mx-auto flex min-h-[70svh] max-w-[1100px] flex-col justify-center px-4 sm:px-6 lg:px-8">
                <p className="text-sm font-semibold text-white/60">404</p>
                <h1 className="mt-3 max-w-[18ch] text-balance text-[clamp(2.25rem,5vw,3.75rem)] font-black leading-[1] tracking-[-0.03em] text-white">
                    This story isn&apos;t in the chronicles<span className="text-primary">.</span>
                </h1>
                <p className="mt-5 max-w-[48ch] text-lg leading-relaxed text-white/75">It may have been moved or unpublished.</p>
                <div className="mt-9">
                    <BrandLink href="/blog" variant="outline">
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All stories
                    </BrandLink>
                </div>
            </div>
        );
    }

    const date = new Date(post.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <article className="min-h-screen text-white">
            <ArticleHero
                title={post.title}
                subtitle={post.excerpt}
                image={post.imageUrl}
                meta={
                    <>
                        <span className="font-semibold text-white">{post.author?.name || 'Kyokushin HQ'}</span>
                        <span aria-hidden="true" className="text-white/30">/</span>
                        <time dateTime={post.publishedAt}>{date}</time>
                        <span aria-hidden="true" className="text-white/30">/</span>
                        <span>{readingMinutes(post.content)} min read</span>
                    </>
                }
            />

            <div className="mx-auto max-w-[1100px] px-4 pb-8 pt-[clamp(3rem,7vw,5rem)] sm:px-6 lg:px-8">
                {blocks.map((block, i) =>
                    block.type === 'text' ? (
                        <div key={i} className={PROSE} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.content) }} />
                    ) : (
                        // Pictures take the full column width, wider than the text measure.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={block.content} alt="" loading="lazy" className="my-12 max-h-[80svh] w-full rounded-lg object-cover" />
                    ),
                )}

                <div className="mt-16 flex flex-wrap items-center gap-4 border-t border-white/15 pt-10">
                    <ShareButton title={post.title} />
                    <Link href="/blog" className="group inline-flex min-h-12 items-center gap-2 font-semibold text-white/75 transition-colors hover:text-white">
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" /> All stories
                    </Link>
                </div>
            </div>

            <KeepReading links={GUIDES.map((g) => ({ href: `/blog/${g.slug}`, title: g.title, note: g.category }))} />
        </article>
    );
}
