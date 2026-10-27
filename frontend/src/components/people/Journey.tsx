"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReduced, useScrollProgress } from "@/components/home/film/hooks";

const INDIA: [number, number] = [78.96, 22.6];

/** Great-circle distance in km between two [lon, lat] points. */
function distanceKm([lon1, lat1]: [number, number], [lon2, lat2]: [number, number]) {
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** India to the host, centre to centre, from the same centroids the globe draws with. */
function useDistance(hostCode: string | null) {
    const [km, setKm] = useState<number | null>(null);
    useEffect(() => {
        if (!hostCode || hostCode === "IN") return;
        let alive = true;
        fetch("/geo/world-dots.json")
            .then((r) => r.json())
            .then((d: { centroids: Record<string, [number, number]> }) => {
                const host = d.centroids[hostCode];
                if (alive && host) setKm(Math.round(distanceKm(INDIA, host) / 10) * 10);
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, [hostCode]);
    return hostCode && hostCode !== "IN" ? km : null;
}

const WIDE = "(min-width: 768px)";
function useWide() {
    return useSyncExternalStore(
        (cb) => {
            const mq = window.matchMedia(WIDE);
            mq.addEventListener("change", cb);
            return () => mq.removeEventListener("change", cb);
        },
        () => window.matchMedia(WIDE).matches,
        () => false,
    );
}

const fmt = new Intl.NumberFormat("en-IN");

/**
 * The trip as a journey (from SELENE): on wide screens the stage pins while the flight
 * draws from India to the host country and a distance counter runs up with it. Phones
 * and reduced motion get the stage unpinned, the flight drawing on its own, and the
 * finished distance.
 */
export default function Journey({
    hostCode,
    hostName,
    className,
    stageClassName,
    bleed = false,
    children,
}: {
    hostCode: string | null;
    hostName?: string;
    className?: string;
    stageClassName?: string;
    bleed?: boolean;
    /** The stage; given the flight's progress when it is scroll-driven. */
    children: (progress?: MotionValue<number>) => ReactNode;
}) {
    const reduced = useReduced();
    const wide = useWide();
    const km = useDistance(hostCode);
    const pinned = km !== null && wide && !reduced;
    const section = useRef<HTMLElement>(null);
    const scroll = useMotionValue(0);
    // The flight lands a little before the pin releases, so the arrival holds.
    const flight = useTransform(scroll, [0.05, 0.75], [0, 1], { clamp: true });
    const counted = useTransform(flight, (p) => fmt.format(Math.round(((km ?? 0) * p) / 10) * 10));

    useScrollProgress(section, (p) => scroll.set(p), { enabled: pinned });

    return (
        <section
            ref={section}
            data-bleed={bleed || undefined}
            className={cn("relative", className)}
            style={pinned ? { height: "220svh" } : undefined}
            aria-label={hostName ? `From India to ${hostName}` : undefined}
        >
            <div className={cn("relative overflow-hidden", pinned && "sticky top-0 h-[100svh]", stageClassName)}>
                {children(pinned ? flight : undefined)}
                {km !== null && (
                    <p className="pointer-events-none absolute bottom-10 right-4 z-10 text-right sm:right-6 lg:right-8">
                        <span aria-hidden="true" className="block font-mincho text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-none tabular-nums text-white">
                            {pinned ? <motion.span>{counted}</motion.span> : fmt.format(km)}
                            <span className="ml-2 text-[0.4em] text-white/60">km</span>
                        </span>
                        <span aria-hidden="true" className="mt-2 block text-sm font-semibold text-white/60">
                            India to {hostName ?? "the host country"}, centre to centre
                        </span>
                        <span className="sr-only">
                            About {fmt.format(km)} kilometres from India to {hostName ?? "the host country"}, centre to centre.
                        </span>
                    </p>
                )}
            </div>
        </section>
    );
}
