"use client";

import Link from "next/link";
import { motion, useTransform } from "framer-motion";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTilt } from "@/hooks/useTilt";
import KankuMark from "@/components/KankuMark";

/* ------------------------------------------------------------------ */
/*  Rank parsing, shared by the instructors and black-belt registries  */
/* ------------------------------------------------------------------ */

const KYU_ORDER = ["White", "Orange", "Blue", "Yellow", "Green", "Brown"];

export const KYU_SWATCH: Record<string, string> = {
    White: "#ffffff",
    Orange: "#f97316",
    Blue: "#3b82f6",
    Yellow: "#eab308",
    Green: "#22c55e",
    Brown: "#92400e",
};

/** Dan degree from strings like "Black 2nd Dan" (plain "Black" counts as 1st). 0 for kyu ranks. */
export function parseDan(rank?: string): number {
    if (!rank) return 0;
    const m = String(rank).match(/(\d+)/);
    if (m && /dan|black/i.test(rank)) return parseInt(m[1], 10);
    return /black/i.test(rank) ? 1 : 0;
}

/** A single sortable number: dan grades above every kyu grade. */
export function rankWeight(rank?: string): number {
    const dan = parseDan(rank);
    if (dan > 0) return 100 + dan;
    const kyu = KYU_ORDER.findIndex((k) => rank?.toLowerCase().startsWith(k.toLowerCase()));
    return kyu;
}

export function danTitle(dan: number): string {
    if (dan >= 5) return "Shihan";
    if (dan >= 3) return "Sensei";
    return "Senpai";
}

export function ordinal(n: number): string {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/* ------------------------------------------------------------------ */
/*  Portrait                                                           */
/* ------------------------------------------------------------------ */

export interface RankPortraitProps {
    name: string;
    rank: string;
    photoUrl?: string | null;
    /** e.g. dojo name */
    detail?: string;
    location?: string;
    href?: string;
    /** "Verify" link, shown under the card. */
    verifyHref?: string;
    size?: "lead" | "base";
}

/** Gold bars, one per dan degree. Gold is earned rank, so it only ever appears here. */
export function DanBars({ dan, className }: { dan: number; className?: string }) {
    return (
        <span className={cn("flex gap-[3px]", className)} aria-hidden="true">
            {Array.from({ length: Math.min(dan, 10) }).map((_, i) => (
                <span key={i} className="h-3.5 w-[3px] bg-secondary" />
            ))}
        </span>
    );
}

/**
 * A portrait print that leans toward the pointer. The photo sits deep in the
 * frame and the name floats in front, so the tilt reads as real depth. With no
 * photo, the member's initials are set large over a faint Kanku instead of a
 * stock avatar.
 */
export default function RankPortrait({ name, rank, photoUrl, detail, location, href, verifyHref, size = "base" }: RankPortraitProps) {
    const { ref, handlers, style } = useTilt(size === "lead" ? 5 : 8);
    // The frame clips (overflow hidden flattens 3D), so depth is faked the honest way:
    // the photo slides against the tilt and the caption with it.
    const deepX = useTransform(style.rotateY, (v) => v * -1.6);
    const deepY = useTransform(style.rotateX, (v) => v * 1.6);
    const nearX = useTransform(style.rotateY, (v) => v * 0.9);
    const nearY = useTransform(style.rotateX, (v) => v * -0.9);
    const dan = parseDan(rank);
    const initials = name
        .replace(/^(sensei|shihan|senpai)\s+/i, "")
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    const kyuColor = dan === 0 ? KYU_SWATCH[Object.keys(KYU_SWATCH).find((k) => rank.startsWith(k)) ?? ""] : undefined;

    const card = (
        <motion.div
            ref={ref as React.Ref<HTMLDivElement>}
            {...handlers}
            style={style}
            className={cn(
                "group relative overflow-hidden rounded-xl bg-surface ring-1 ring-white/10 transition-shadow duration-500 hover:ring-white/25",
                size === "lead" ? "aspect-[4/5] md:aspect-[5/6]" : "aspect-[4/5]",
            )}
        >
            {photoUrl ? (
                <motion.img
                    src={photoUrl}
                    alt={name}
                    loading="lazy"
                    style={{ x: deepX, y: deepY, scale: 1.1 }}
                    className="absolute inset-0 h-full w-full object-cover object-top grayscale transition-[filter] duration-700 group-hover:grayscale-0"
                />
            ) : (
                <motion.div aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-[#0b0b0b]" style={{ x: deepX, y: deepY, scale: 1.1 }}>
                    <KankuMark className="absolute h-[85%] w-[85%] text-white/[0.04]" />
                    <span className={cn("font-black leading-none tracking-[-0.04em] text-white/20", size === "lead" ? "text-[clamp(6rem,14vw,11rem)]" : "text-[clamp(4.5rem,9vw,6.5rem)]")}>
                        {initials}
                    </span>
                </motion.div>
            )}
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            <motion.div className="absolute inset-x-0 bottom-0 p-5 md:p-6" style={{ x: nearX, y: nearY }}>
                <p className="flex items-center gap-2.5 text-sm font-semibold text-secondary">
                    {dan > 0 ? (
                        <>
                            <DanBars dan={dan} />
                            {ordinal(dan)} Dan · {danTitle(dan)}
                        </>
                    ) : (
                        <span className="flex items-center gap-2.5 text-white/75">
                            <span className="h-3 w-6 rounded-sm ring-1 ring-white/30" style={{ backgroundColor: kyuColor ?? "#444" }} aria-hidden="true" />
                            {rank} belt
                        </span>
                    )}
                </p>
                {/* Line height comes after the size: tailwind-merge drops a leading-* that precedes a text-* size. */}
                <h3 className={cn("mt-2 text-balance font-black uppercase tracking-[-0.01em] text-white", size === "lead" ? "text-[clamp(1.75rem,3.2vw,2.75rem)]" : "text-xl md:text-2xl", "leading-[0.98]")}>
                    {name.trim()}
                </h3>
                {detail && <p className="mt-2 text-sm text-white/75">{detail}</p>}
                {location && (
                    <p className="mt-1 inline-flex items-center gap-1 text-sm text-white/60">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        {location}
                    </p>
                )}
            </motion.div>
        </motion.div>
    );

    return (
        <div>
            {href ? (
                <Link href={href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black">
                    {card}
                </Link>
            ) : (
                card
            )}
            {verifyHref && (
                <Link href={verifyHref} className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-white/70 transition-colors hover:text-white">
                    Verify membership <span aria-hidden="true">→</span>
                </Link>
            )}
        </div>
    );
}
