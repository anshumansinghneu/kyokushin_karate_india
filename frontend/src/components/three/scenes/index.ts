import { lazy, type ComponentType } from "react";
import type { SceneKey } from "@/lib/three/sceneStore";

/* Each scene is its own chunk, fetched only when a page registers its slot. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SCENES: Record<SceneKey, ComponentType<any>> = {
    "home-hero": lazy(() => import("./HomeHeroScene")),
    belt: lazy(() => import("./BeltScene")),
    history: lazy(() => import("./HistoryScene")),
    "india-map": lazy(() => import("./IndiaMapScene")),
    "gallery-ring": lazy(() => import("./GalleryRingScene")),
    globe: lazy(() => import("./GlobeScene")),
    tickets: lazy(() => import("./TicketsScene")),
    "sponsor-ring": lazy(() => import("./SponsorRingScene")),
    ink: lazy(() => import("./InkScene")),
    podium: lazy(() => import("./PodiumScene")),
    showcase: lazy(() => import("./ShowcaseScene")),
    certificate: lazy(() => import("./CertificateScene")),
};
