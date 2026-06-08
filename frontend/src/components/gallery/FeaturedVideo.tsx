"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { getImageUrl } from "@/lib/imageUtils";
import type { GalleryPhoto } from "@/app/gallery/page";

interface FeaturedVideoProps {
  photo: GalleryPhoto;
  onClick: () => void;
}

/** Looped/muted/autoplay embed with JS API enabled so we can postMessage it. */
function buildFeaturedEmbedUrl(provider: string, videoId: string): string {
  if (provider === "youtube") {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&playsinline=1&rel=0&enablejsapi=1`;
  }
  if (provider === "vimeo") {
    return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&controls=0&playsinline=1`;
  }
  return "";
}

type PlayerAction = "play" | "pause" | "mute" | "unmute";

function postToPlayer(iframe: HTMLIFrameElement | null, provider: string, action: PlayerAction) {
  const win = iframe?.contentWindow;
  if (!win) return;
  if (provider === "youtube") {
    const func = { play: "playVideo", pause: "pauseVideo", mute: "mute", unmute: "unMute" }[action];
    win.postMessage(JSON.stringify({ event: "command", func, args: [] }), "*");
  } else if (provider === "vimeo") {
    const msg =
      action === "play"
        ? { method: "play" }
        : action === "pause"
        ? { method: "pause" }
        : action === "unmute"
        ? { method: "setVolume", value: 1 }
        : { method: "setVolume", value: 0 };
    win.postMessage(JSON.stringify(msg), "*");
  }
}

export default function FeaturedVideo({ photo, onClick }: FeaturedVideoProps) {
  const isVideo = photo.mediaType === "VIDEO" && !!photo.videoProvider && !!photo.videoId;
  const thumb = getImageUrl(photo.imageUrl) || "";
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [muted, setMuted] = useState(true);

  // Pause when scrolled out of view; resume when back in view. Never unmount (no re-buffer).
  useEffect(() => {
    if (!isVideo) return;
    const el = containerRef.current;
    if (!el) return;
    const provider = photo.videoProvider as string;
    const observer = new IntersectionObserver(
      ([entry]) => {
        postToPlayer(iframeRef.current, provider, entry.isIntersecting ? "play" : "pause");
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isVideo, photo.videoProvider]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !muted;
    setMuted(next);
    postToPlayer(iframeRef.current, photo.videoProvider as string, next ? "mute" : "unmute");
  };

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className="relative w-full h-full overflow-hidden rounded-2xl border border-red-500/30 cursor-pointer group bg-zinc-900 shadow-[0_0_40px_rgba(220,38,38,0.18)]"
    >
      {/* Poster layer (always painted under the iframe). */}
      {thumb && (
        <img
          src={thumb}
          alt={photo.caption || "Featured video"}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      )}

      {isVideo && (
        <iframe
          ref={iframeRef}
          src={buildFeaturedEmbedUrl(photo.videoProvider as string, photo.videoId as string)}
          title={photo.caption || "Featured video"}
          allow="autoplay; encrypted-media; picture-in-picture"
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      )}

      {/* Unmute / mute toggle (only meaningful for video). */}
      {isVideo && (
        <button
          onClick={toggleMute}
          className="absolute bottom-3 right-3 z-10 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/25 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          title={muted ? "Unmute" : "Mute"}
          aria-label={muted ? "Unmute video" : "Mute video"}
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      )}

      {/* Caption gradient. */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#050507] via-[#050507]/40 to-transparent p-5 pt-16 pointer-events-none">
        {photo.caption && (
          <p className="text-base font-bold text-white drop-shadow-md line-clamp-1">{photo.caption}</p>
        )}
        <p className="text-xs font-semibold text-zinc-400">by {photo.uploader.name}</p>
      </div>
    </div>
  );
}
