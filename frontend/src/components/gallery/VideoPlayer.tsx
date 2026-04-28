"use client";

import { motion } from "framer-motion";

interface VideoPlayerProps {
    provider: string;        // "youtube" | "vimeo"
    videoId: string;
    title?: string;
}

export function buildEmbedUrl(provider: string, videoId: string): string {
    if (provider === 'youtube') {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&modestbranding=1`;
    }
    if (provider === 'vimeo') {
        return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1`;
    }
    return '';
}

export default function VideoPlayer({ provider, videoId, title }: VideoPlayerProps) {
    const src = buildEmbedUrl(provider, videoId);
    if (!src) {
        return (
            <div className="flex items-center justify-center w-full max-w-4xl aspect-video bg-zinc-900 rounded-xl border border-white/10 text-zinc-400 text-sm">
                Unsupported video provider.
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-5xl aspect-video max-h-[85vh] rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10"
        >
            <iframe
                src={src}
                title={title || 'Embedded video'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
            />
        </motion.div>
    );
}
