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
      <div className="w-full h-[40vh] flex items-center justify-center border-y border-white/10">
        <p className="text-white/60 text-sm">No photographs yet. Be the first to upload.</p>
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
