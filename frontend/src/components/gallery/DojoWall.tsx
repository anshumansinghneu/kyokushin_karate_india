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
  /** Still loading, or the load failed: either way there is nothing to show yet, for a different reason. */
  state?: "loading" | "failed" | "ready";
  onRetry?: () => void;
}

export default function DojoWall({ pool, onTileClick, onTileIdsChange, state = "ready", onRetry }: DojoWallProps) {
  const { featured, tiles } = useDojoWallOrder(pool);

  useEffect(() => {
    const ids = featured ? [featured.id, ...tiles.map((t) => t.id)] : tiles.map((t) => t.id);
    onTileIdsChange?.(ids);
  }, [featured, tiles, onTileIdsChange]);

  if (!featured) {
    if (state === "loading") {
      return <div aria-hidden="true" className="w-full h-[40vh] animate-pulse rounded-lg bg-white/5 motion-reduce:animate-none" />;
    }
    return (
      <div className="w-full h-[40vh] flex flex-col items-center justify-center gap-5 border-y border-white/10 text-center">
        <p className="text-white/70">
          {state === "failed" ? "Couldn\u2019t load the photographs. The server may be waking up." : "No photographs published yet."}
        </p>
        {state === "failed" && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-12 border border-white/25 px-7 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-white/10"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Featured: full width on mobile (aspect-video), 3×2 span on desktop. */}
        <div className="col-span-2 md:col-span-3 md:row-span-2 aspect-video md:aspect-auto">
          <FeaturedVideo photo={featured} onClick={() => onTileClick(featured.id)} />
        </div>

        {tiles.map((photo) => (
          <WallTile key={photo.id} photo={photo} onClick={() => onTileClick(photo.id)} />
        ))}
      </div>

    </div>
  );
}
