import { create } from "zustand";

/*
 * Bridge between the DOM and the one persistent WebGL canvas.
 *
 * Pages never import three.js. They render a <SceneSlot>, which registers its
 * element here; the lazily loaded ImmersiveCanvas reads the registry and draws
 * the matching scene into that element's rectangle. Keeping this file free of
 * three keeps the 3D chunk out of every page's first-load JS.
 */

export type SceneKey = "home-hero" | "belt" | "history" | "india-map" | "gallery-ring" | "globe" | "tickets" | "sponsor-ring";

/** full: everything. lite: lower DPR, no post. static: no canvas, posters only. */
export type DeviceTier = "full" | "lite" | "static";

export interface SlotEntry {
    id: string;
    scene: SceneKey;
    el: HTMLElement;
    /** Scene-specific inputs. Values may be live objects (MotionValues, refs) read per frame. */
    props: Record<string, unknown>;
    visible: boolean;
}

interface SceneState {
    tier: DeviceTier | null;
    slots: Record<string, SlotEntry>;
    ready: Record<string, boolean>;
    setTier: (tier: DeviceTier) => void;
    /** Only ever steps down: a device that struggled once is not promoted again this session. */
    degrade: (to: Exclude<DeviceTier, "full">) => void;
    register: (entry: SlotEntry) => void;
    update: (id: string, patch: Partial<Omit<SlotEntry, "id">>) => void;
    unregister: (id: string) => void;
    markReady: (id: string, ready: boolean) => void;
}

const RANK: Record<DeviceTier, number> = { full: 2, lite: 1, static: 0 };

export const useSceneStore = create<SceneState>((set) => ({
    tier: null,
    slots: {},
    ready: {},
    setTier: (tier) => set({ tier }),
    degrade: (to) =>
        set((s) => (s.tier && RANK[to] < RANK[s.tier] ? { tier: to } : s)),
    register: (entry) => set((s) => ({ slots: { ...s.slots, [entry.id]: entry } })),
    update: (id, patch) =>
        set((s) => {
            const prev = s.slots[id];
            if (!prev) return s;
            return { slots: { ...s.slots, [id]: { ...prev, ...patch } } };
        }),
    unregister: (id) =>
        set((s) => {
            const slots = { ...s.slots };
            const ready = { ...s.ready };
            delete slots[id];
            delete ready[id];
            return { slots, ready };
        }),
    markReady: (id, value) => set((s) => ({ ready: { ...s.ready, [id]: value } })),
}));
