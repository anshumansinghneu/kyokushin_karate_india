"use client";

import { useEffect } from "react";
import type { GalleryPhoto } from "@/app/gallery/page";
import { useDojoWallOrder } from "./useDojoWallOrder";
import FeaturedVideo from "./FeaturedVideo";
import WallTile from "./WallTile";

interface DojoWallProps {
  pool: GalleryPhoto[];
  onTileClick: (photoId: string) => void;
  /** Report visible IDs so the marquee can de-duplicate. */
  onTileIdsChange?: (ids: string[]) => void;
}

export default function DojoWall({ pool, onTileClick, onTileIdsChange }: DojoWallProps) {
  const { featured, tiles } = useDojoWallOrder(pool);

  useEffect(() => {
    const ids = featured ? [featured.id, ...tiles.map((t) => t.id)] : tiles.map((t) => t.id);
    onTileIdsChange?.(ids);
  }, [featured, tiles, onTileIdsChange]);

  if (!featured) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center bg-zinc-950 border-y border-white/5">
        <p className="text-zinc-500 text-sm">No memories yet — be the first to upload.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3">
        {/* Featured: full width on mobile (aspect-video), 3×2 span on desktop. */}
        <div className="col-span-2 md:col-span-3 md:row-span-2 aspect-video md:aspect-auto">
          <FeaturedVideo photo={featured} onClick={() => onTileClick(featured.id)} />
        </div>

        {tiles.map((photo) => (
          <WallTile key={photo.id} photo={photo} onClick={() => onTileClick(photo.id)} />
        ))}
      </div>

      {/* Title overlay — ported from HeroMosaic. */}
      <div className="pointer-events-none absolute bottom-0 left-0 p-4 md:p-8 lg:p-12 max-w-4xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent rounded-tr-[100px] pointer-events-none" />
        <h1
          className="relative font-black tracking-tighter uppercase leading-[0.9] drop-shadow-2xl"
          style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)" }}
        >
          <span className="text-white">THE </span>
          <span
            className="drop-shadow-[0_4px_25px_rgba(220,38,38,0.4)]"
            style={{
              background: "linear-gradient(180deg, #ef4444, #991b1b)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            DOJO
          </span>
          <span className="text-white"> WALL</span>
        </h1>
      </div>
    </div>
  );
}
