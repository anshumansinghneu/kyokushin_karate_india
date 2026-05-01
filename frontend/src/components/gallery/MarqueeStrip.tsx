"use client";

import { Play } from "lucide-react";
import { getImageUrl } from "@/lib/imageUtils";
import type { GalleryPhoto } from "@/app/gallery/page";

interface MarqueeStripProps {
    items: GalleryPhoto[];
    onTileClick: (photoId: string) => void;
}

export default function MarqueeStrip({ items, onTileClick }: MarqueeStripProps) {
    if (items.length === 0) return null;

    // Render the array twice so the keyframe loop is seamless
    const doubled = [...items, ...items];

    return (
        <section className="w-full mt-6 md:mt-8">
            {/* Section label */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-5 bg-red-500 rounded-full" />
                    <span className="text-xs font-black text-white uppercase tracking-[0.25em]">
                        Latest Uploads
                    </span>
                </div>
            </div>

            {/* Strip */}
            <div className="relative w-full overflow-hidden h-[22vh] md:h-[22vh]" style={{ height: 'clamp(140px, 22vh, 240px)' }}>
                <div
                    className="flex h-full gap-3 marquee-track"
                    style={{ width: 'max-content' }}
                >
                    {doubled.map((photo, i) => {
                        const isVideo = photo.mediaType === 'VIDEO';
                        const thumb = getImageUrl(photo.imageUrl) || "";
                        return (
                            <div
                                key={`${photo.id}-${i}`}
                                onClick={() => onTileClick(photo.id)}
                                className="relative h-full aspect-[4/3] flex-shrink-0 rounded-xl overflow-hidden border border-white/10 cursor-pointer group"
                            >
                                <img
                                    src={thumb}
                                    alt={photo.caption || (isVideo ? 'Video' : 'Photo')}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    loading="lazy"
                                    draggable={false}
                                />
                                {isVideo && (
                                    <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-red-600/90 backdrop-blur-md flex items-center justify-center shadow-lg pointer-events-none">
                                        <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
