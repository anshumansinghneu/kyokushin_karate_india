import { lazy, type ComponentType } from "react";
import type { SceneKey } from "@/lib/three/sceneStore";

/* Each scene is its own chunk, fetched only when a page registers its slot. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SCENES: Record<SceneKey, ComponentType<any>> = {
    "home-hero": lazy(() => import("./HomeHeroScene")),
    belt: lazy(() => import("./BeltScene")),
    history: lazy(() => import("./HistoryScene")),
    "india-map": lazy(() => import("./IndiaMapScene")),
};
