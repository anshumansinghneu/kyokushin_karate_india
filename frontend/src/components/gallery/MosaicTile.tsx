"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { getImageUrl } from "@/lib/imageUtils";
import { buildEmbedUrl } from "./VideoPlayer";
import type { GalleryPhoto } from "@/app/gallery/page";

interface MosaicTileProps {
    photo: GalleryPhoto;
    /** When true and photo is a video, render the iframe (auto-play muted loop). When false, render thumbnail with play badge. */
    isActiveVideo: boolean;
    /** Used to stagger breathing-animation phase per tile so they don't pulse in sync. 0..5 */
    phaseIndex: number;
    onClick: () => void;
}

export default function MosaicTile({ photo, isActiveVideo, phaseIndex, onClick }: MosaicTileProps) {
    const isVideo = photo.mediaType === 'VIDEO';
    const thumb = getImageUrl(photo.imageUrl) || "";
    const [thumbLoaded, setThumbLoaded] = useState(false);

    // Cross-fade key: change when photo.id changes so framer-motion / CSS can re-trigger fade
    const key = photo.id;

    return (
        <div
            key={key}
            onClick={onClick}
            className="relative w-full h-full overflow-hidden rounded-2xl border border-white/10 cursor-pointer group bg-zinc-900"
            style={{
                animation: `mosaic-breathe 7s ease-in-out infinite`,
                animationDelay: `${phaseIndex * 0.9}s`,
            }}
        >
            {/* Thumbnail layer (always rendered for fast paint and as a fallback). */}
            <img
                src={thumb}
                alt={photo.caption || (isVideo ? 'Video' : 'Photo')}
                onLoad={() => setThumbLoaded(true)}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${thumbLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading="eager"
                draggable={false}
            />

            {/* Active video iframe (mounted only when this tile is the chosen active video). */}
            {isVideo && isActiveVideo && photo.videoProvider && photo.videoId && (
                <iframe
                    src={buildLoopedEmbedUrl(photo.videoProvider, photo.videoId)}
                    title={photo.caption || 'Video'}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                />
            )}

            {/* Play badge for inactive video tiles (and as a hint when active video is loading). */}
            {isVideo && !isActiveVideo && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-md border border-white/30 shadow-2xl flex items-center justify-center">
                        <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
                    </div>
                </div>
            )}

            {/* Hover scrim — slight lift on interaction. */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300" />
        </div>
    );
}

/** Looped, muted, autoplay embed URL — different from the lightbox VideoPlayer's URL builder. */
function buildLoopedEmbedUrl(provider: string, videoId: string): string {
    if (provider === 'youtube') {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&playsinline=1&rel=0`;
    }
    if (provider === 'vimeo') {
        return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&controls=0&playsinline=1`;
    }
    return '';
}
