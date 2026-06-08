"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Maximize2 } from "lucide-react";
import { getImageUrl } from "@/lib/imageUtils";
import type { GalleryPhoto } from "@/app/gallery/page";

interface WallTileProps {
  photo: GalleryPhoto;
  onClick: () => void;
}

function formatDuration(seconds: number | null): string | null {
  if (seconds == null || seconds < 0) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function WallTile({ photo, onClick }: WallTileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const isVideo = photo.mediaType === "VIDEO";
  const imgUrl = getImageUrl(photo.imageUrl) || "";
  const durationLabel = formatDuration(photo.duration);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`group relative w-full h-full aspect-square overflow-hidden rounded-xl border cursor-pointer bg-zinc-900 transition-all duration-500 ${
        isVideo
          ? "border-red-500/30 hover:border-red-500/60 shadow-[0_0_25px_rgba(220,38,38,0.2)] hover:shadow-[0_0_40px_rgba(220,38,38,0.4)]"
          : "border-white/[0.08] hover:border-red-500/30"
      }`}
    >
      {!loaded && <div className="absolute inset-0 animate-pulse bg-white/5" />}
      {inView && imgUrl && (
        <img
          src={imgUrl}
          alt={photo.caption || (isVideo ? "Video" : "Photo")}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          draggable={false}
        />
      )}

      {/* Video: play badge + duration. */}
      {isVideo && loaded && (
        <>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-md border border-white/30 shadow-2xl flex items-center justify-center">
              <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
            </div>
          </div>
          {durationLabel && (
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-white text-xs font-bold pointer-events-none">
              {durationLabel}
            </div>
          )}
        </>
      )}

      {/* Photo: hover maximize affordance. */}
      {!isVideo && loaded && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl">
            <Maximize2 className="w-5 h-5 text-white" />
          </div>
        </div>
      )}

      {/* Caption gradient. */}
      {loaded && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#050507] via-[#050507]/50 to-transparent flex flex-col justify-end p-3 pt-12 pointer-events-none">
          {photo.caption && (
            <p className="text-xs font-bold text-white mb-0.5 drop-shadow-md line-clamp-1">
              {photo.caption}
            </p>
          )}
          <p className="text-[11px] font-semibold text-zinc-400">by {photo.uploader.name}</p>
        </div>
      )}
    </div>
  );
}
