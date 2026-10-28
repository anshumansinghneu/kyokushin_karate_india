"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { MapPin, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
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

/** The Japanese name of each dan grade. Titles (Senpai, Sensei, Shihan) wait on KKFI's rule. */
const DAN_NAMES = ["", "Shodan", "Nidan", "Sandan", "Yondan", "Godan", "Rokudan", "Nanadan", "Hachidan", "Kudan", "Judan"];
export function danName(dan: number): string {
    return DAN_NAMES[dan] ?? `${dan}th Dan`;
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
    /** "Verify membership" link, on the back of the card. */
    verifyHref?: string;
    /** A role above the rank on the back, e.g. "Coach". */
    role?: string;
    /** A short bio on the back. */
    note?: string;
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

function RankLine({ rank, dan }: { rank: string; dan: number }) {
    const kyuColor = dan === 0 ? KYU_SWATCH[Object.keys(KYU_SWATCH).find((k) => rank.startsWith(k)) ?? ""] : undefined;
    return dan > 0 ? (
        <p className="flex items-center gap-2.5 text-sm font-semibold text-secondary">
            <DanBars dan={dan} />
            {ordinal(dan)} Dan · {danName(dan)}
        </p>
    ) : (
        <p className="flex items-center gap-2.5 text-sm font-semibold text-white/75">
            <span className="h-3 w-6 rounded-sm ring-1 ring-white/30" style={{ backgroundColor: kyuColor ?? "#444" }} aria-hidden="true" />
            {rank} belt
        </p>
    );
}

/**
 * A flip card (Oddball): the front is a photographic print with the name set vertically,
 * the back carries rank, dojo and the way to verify. A real button flips it, so it
 * works by keyboard and touch; the hidden face is inert. Reduced motion swaps faces
 * without the turn. With no photo, the initials are set large over a faint Kanku.
 */
export default function RankPortrait({ name, rank, photoUrl, detail, location, href, verifyHref, role, note, size = "base" }: RankPortraitProps) {
    const [flipped, setFlipped] = useState(false);
    const front = useRef<HTMLButtonElement>(null);
    const back = useRef<HTMLButtonElement>(null);
    // The face being left goes inert, so focus moves with the card to the face now showing.
    const flip = (to: boolean) => {
        setFlipped(to);
        requestAnimationFrame(() => (to ? back : front).current?.focus());
    };
    const dan = parseDan(rank);
    const clean = name.trim();
    const initials = clean
        .replace(/^(sensei|shihan|senpai)\s+/i, "")
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    const face = "absolute inset-0 overflow-hidden rounded-xl ring-1 ring-white/10 [backface-visibility:hidden]";

    return (
        <div className="[perspective:1400px]">
            <div
                className={cn(
                    "relative transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] [transform-style:preserve-3d] motion-reduce:transition-none",
                    size === "lead" ? "aspect-[4/5] md:aspect-[5/6]" : "aspect-[4/5]",
                    flipped && "[transform:rotateY(180deg)]",
                )}
            >
                {/* Front: the print. */}
                <div className={cn(face, "group bg-surface")} inert={flipped}>
                    {photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={photoUrl}
                            alt=""
                            loading="lazy"
 className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                    ) : (
                        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-[#0b0b0b]">
                            <KankuMark className="absolute h-[85%] w-[85%] text-white/[0.04]" />
                            <span className={cn("font-black leading-none tracking-[-0.04em] text-white/20", size === "lead" ? "text-[clamp(6rem,14vw,11rem)]" : "text-[clamp(4.5rem,9vw,6.5rem)]")}>
                                {initials}
                            </span>
                        </div>
                    )}
                    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/10 to-transparent" />
                    <h3
                        className={cn(
                            "absolute bottom-5 left-4 max-h-[calc(100%-2.5rem)] overflow-hidden text-ellipsis whitespace-nowrap font-black uppercase leading-none tracking-[0.02em] text-white [writing-mode:vertical-rl] rotate-180 md:left-5",
                            size === "lead" ? "text-[clamp(1.5rem,2.6vw,2.25rem)]" : "text-xl md:text-2xl",
                        )}
                    >
                        {clean}
                    </h3>
                    <div className="absolute bottom-5 right-5">
                        {dan > 0 ? <DanBars dan={dan} /> : <RankLine rank={rank} dan={dan} />}
                    </div>
                    <button
                        type="button"
                        aria-pressed={flipped}
                        aria-label={`Show details for ${clean}`}
                        ref={front}
                        onClick={() => flip(true)}
                        className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                    />
                </div>

                {/* Back: the record. */}
                <div className={cn(face, "flex flex-col bg-[#0b0b0b] p-5 [transform:rotateY(180deg)] md:p-6")} inert={!flipped}>
                    <KankuMark aria-hidden="true" className="pointer-events-none absolute -right-[20%] -top-[10%] h-[80%] w-[80%] text-white/[0.04]" />
                    {role && <p className="mb-2 text-sm font-semibold text-white/60">{role}</p>}
                    <RankLine rank={rank} dan={dan} />
                    <p className={cn("mt-3 text-balance font-black uppercase leading-[0.98] tracking-[-0.01em] text-white", size === "lead" ? "text-[clamp(1.75rem,3.2vw,2.75rem)]" : "text-xl md:text-2xl")}>
                        {clean}
                    </p>
                    {note && <p className="mt-4 line-clamp-3 shrink-0 text-sm leading-relaxed text-white/70">{note}</p>}
                    <dl className="mt-5 space-y-3 text-sm">
                        {detail && (
                            <div>
                                <dt className="text-white/50">Dojo</dt>
                                <dd className="mt-0.5 font-semibold text-white">
                                    {href ? (
                                        <Link href={href} className="underline decoration-white/30 underline-offset-4 hover:decoration-white">
                                            {detail}
                                        </Link>
                                    ) : (
                                        detail
                                    )}
                                </dd>
                            </div>
                        )}
                        {location && (
                            <div>
                                <dt className="sr-only">Location</dt>
                                <dd className="inline-flex items-center gap-1 text-white/70">
                                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                                    {location}
                                </dd>
                            </div>
                        )}
                    </dl>
                    <div className="mt-auto flex items-center justify-between gap-4 pt-6">
                        {verifyHref ? (
                            <Link href={verifyHref} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-white transition-colors hover:text-primary-light">
                                Verify membership <span aria-hidden="true">→</span>
                            </Link>
                        ) : (
                            <span />
                        )}
                        <button
                            type="button"
                            aria-pressed={flipped}
                            ref={back}
                            onClick={() => flip(false)}
                            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full text-sm font-semibold text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            <RotateCcw className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">Show portrait of {clean}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
