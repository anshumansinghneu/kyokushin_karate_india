"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin, Plane, Calendar, AlertTriangle, RefreshCw, Globe2, ChevronDown } from "lucide-react";
import api from "@/lib/api";
import KarateLoader from "@/components/KarateLoader";
import { getImageUrl } from "@/lib/imageUtils";
import { formatDateOnly } from "@/lib/dateOnly";

/* ─── Types ──────────────────────────────────────────────── */

export interface SquadMember {
    id: string;
    userId: string;
    name: string;
    profilePhotoUrl: string | null;
    membershipNumber: string | null;
    dojo: string | null;
    city: string | null;
    state: string | null;
    squadRole: "LEADER" | "COACH" | "COMPETITOR";
    rank: string;
    rankLabel: string;
    rankKind: "DAN" | "COLOUR" | "UNKNOWN";
    rankSortKey: number;
    title: string | null;
    /** Resolved copy: the admin's override when set, otherwise auto-generated. */
    bio: string;
    /** The raw override, so the admin editor can show what was actually typed. */
    bioOverride: string | null;
}

export interface Delegation {
    id: string;
    tournamentName: string;
    hostCountry: string;
    hostCity: string | null;
    startDate: string;
    endDate: string | null;
    summary: string | null;
    coverImageUrl: string | null;
    isPublished: boolean;
    isFeatured: boolean;
    memberCount: number;
    members: SquadMember[];
}

/* ─── Helpers ────────────────────────────────────────────── */

/** "3–7 May 2026", or a single date when there is no end. */
export function tripDates(start: string, end: string | null): string {
    if (!end || end === start) return formatDateOnly(start);
    const s = new Date(start);
    const e = new Date(end);
    const sameMonth =
        s.getUTCFullYear() === e.getUTCFullYear() && s.getUTCMonth() === e.getUTCMonth();
    return sameMonth
        ? `${s.getUTCDate()}–${formatDateOnly(end)}`
        : `${formatDateOnly(start)} – ${formatDateOnly(end)}`;
}

/**
 * Split the squad into the leader plus rank bands.
 *
 * The API already returns members sorted (leader first, then most senior), so
 * this only has to bucket them without re-sorting.
 */
export function groupSquad(members: SquadMember[]) {
    const leaders = members.filter((m) => m.squadRole === "LEADER");
    const rest = members.filter((m) => m.squadRole !== "LEADER");

    const bands: { label: string; members: SquadMember[] }[] = [];
    for (const m of rest) {
        const label = m.rankLabel || "Squad";
        const last = bands[bands.length - 1];
        if (last && last.label === label) last.members.push(m);
        else bands.push({ label, members: [m] });
    }
    return { leaders, bands };
}

/* ─── Member card ────────────────────────────────────────── */

function MemberCard({ member, index, featured = false }: { member: SquadMember; index: number; featured?: boolean }) {
    const reduceMotion = useReducedMotion();
    const photo = getImageUrl(member.profilePhotoUrl || null);
    const place = [member.city, member.state].filter(Boolean).join(", ");

    return (
        <motion.article
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
            className={`group relative overflow-hidden rounded-2xl border bg-white/[0.02] transition-colors ${
                featured
                    ? "border-[#FFD700]/30 hover:border-[#FFD700]/60"
                    : "border-white/[0.07] hover:border-red-600/40"
            }`}
        >
            <div className="relative aspect-[4/5] overflow-hidden bg-zinc-900">
                {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={photo}
                        alt={`${member.name}, ${member.rankLabel}`}
                        loading="lazy"
                        className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                ) : (
                    // A photo is mandatory to be added, so this is only reachable
                    // if the member's photo was removed afterwards.
                    <div className="flex h-full w-full items-center justify-center text-zinc-700">
                        <Globe2 className="h-10 w-10" aria-hidden="true" />
                    </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                {member.squadRole !== "COMPETITOR" && (
                    <span
                        className={`absolute left-3 top-3 rounded px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[2px] ${
                            member.squadRole === "LEADER"
                                ? "bg-[#FFD700] text-black"
                                : "bg-white/15 text-white backdrop-blur-sm"
                        }`}
                    >
                        {member.squadRole === "LEADER" ? "Head of Delegation" : "Coach"}
                    </span>
                )}

                <div className="absolute inset-x-0 bottom-0 p-4">
                    {member.title && (
                        <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-[3px] text-red-500">
                            {member.title}
                        </span>
                    )}
                    <h3 className="text-[15px] font-black leading-tight text-white">{member.name}</h3>
                    <span className="mt-0.5 block text-[12px] font-semibold text-zinc-300">
                        {member.rankLabel}
                    </span>
                </div>
            </div>

            <div className="p-4">
                <p className="text-[12px] leading-relaxed text-zinc-300">{member.bio}</p>
                {(member.dojo || place) && (
                    <p className="mt-2 flex items-start gap-1.5 text-[11px] text-zinc-500">
                        <MapPin className="mt-[2px] h-3 w-3 shrink-0" aria-hidden="true" />
                        <span>{member.dojo || place}</span>
                    </p>
                )}
            </div>
        </motion.article>
    );
}

/* ─── Squad ──────────────────────────────────────────────── */

function Squad({ delegation }: { delegation: Delegation }) {
    const { leaders, bands } = useMemo(() => groupSquad(delegation.members), [delegation.members]);

    if (delegation.members.length === 0) {
        return (
            <p className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-6 text-center text-sm text-zinc-400">
                The squad for this trip has not been announced yet.
            </p>
        );
    }

    return (
        <div className="space-y-12">
            {leaders.length > 0 && (
                <section>
                    <BandHeading label="Leading the delegation" accent="gold" />
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {leaders.map((m, i) => (
                            <MemberCard key={m.id} member={m} index={i} featured />
                        ))}
                    </div>
                </section>
            )}

            {bands.map((band) => (
                <section key={band.label}>
                    <BandHeading label={band.label} count={band.members.length} />
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {band.members.map((m, i) => (
                            <MemberCard key={m.id} member={m} index={i} />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}

function BandHeading({ label, count, accent = "red" }: { label: string; count?: number; accent?: "red" | "gold" }) {
    return (
        <div className="mb-5 flex items-center gap-3">
            <div className={`h-5 w-[3px] rounded-full ${accent === "gold" ? "bg-[#FFD700]" : "bg-red-600"}`} />
            <h2 className="text-base font-black uppercase tracking-tight text-white">{label}</h2>
            {count !== undefined && (
                <span className="text-[12px] font-semibold tabular-nums text-zinc-500">{count}</span>
            )}
        </div>
    );
}

/* ─── Trip header ────────────────────────────────────────── */

function TripHeader({ delegation }: { delegation: Delegation }) {
    return (
        <div className="mb-10">
            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-zinc-400">
                <span className="inline-flex items-center gap-1.5">
                    <Plane className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
                    {delegation.hostCity ? `${delegation.hostCity}, ` : ""}
                    {delegation.hostCountry}
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
                    {tripDates(delegation.startDate, delegation.endDate)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <Globe2 className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
                    {delegation.memberCount} representing India
                </span>
            </div>
            <h2
                className="font-black uppercase leading-[0.95] tracking-tight text-white"
                style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)", textWrap: "balance" }}
            >
                {delegation.tournamentName}
            </h2>
            {delegation.summary && (
                <p className="mt-3 max-w-[65ch] text-[14px] leading-relaxed text-zinc-300">
                    {delegation.summary}
                </p>
            )}
        </div>
    );
}

/* ─── Page ───────────────────────────────────────────────── */

export default function TeamIndiaPage() {
    const [delegations, setDelegations] = useState<Delegation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [openArchive, setOpenArchive] = useState<string | null>(null);

    const fetchDelegations = useCallback(async () => {
        setIsLoading(true);
        setLoadError(false);
        try {
            const res = await api.get("/delegations");
            setDelegations(res.data.data.delegations ?? []);
        } catch (err) {
            console.error("Failed to fetch delegations", err);
            setLoadError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDelegations();
    }, [fetchDelegations]);

    // Most recent trip leads; everything older becomes the archive.
    const [current, ...archive] = delegations;

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                {/* Masthead */}
                <header className="mb-12">
                    <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[4px] text-red-500">
                        Kyokushin Karate Foundation of India
                    </span>
                    <h1
                        className="font-black uppercase leading-[0.88] tracking-tighter"
                        style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)" }}
                    >
                        <span className="text-white">TEAM </span>
                        <span className="text-[#FF0000]">INDIA</span>
                    </h1>
                    <p className="mt-4 max-w-[60ch] text-[14px] leading-relaxed text-zinc-300">
                        When a federation abroad invites us to their tournament, these are the karateka
                        who travel to represent India on the international floor.
                    </p>
                </header>

                {isLoading ? (
                    <div className="py-24">
                        <KarateLoader />
                    </div>
                ) : loadError ? (
                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-6 py-16 text-center">
                        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-400" aria-hidden="true" />
                        <p className="text-[15px] font-bold text-zinc-100">Couldn&apos;t load Team India</p>
                        <p className="mx-auto mt-1 max-w-[40ch] text-[12px] text-zinc-400">
                            The server didn&apos;t respond. It may be waking up — this usually takes a few seconds.
                        </p>
                        <button
                            type="button"
                            onClick={fetchDelegations}
                            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-5 text-[12px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                        >
                            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                            Try again
                        </button>
                    </div>
                ) : !current ? (
                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-6 py-16 text-center">
                        <Plane className="mx-auto mb-3 h-8 w-8 text-zinc-600" aria-hidden="true" />
                        <p className="text-[15px] font-bold text-zinc-100">No international trips announced yet</p>
                        <p className="mx-auto mt-1 max-w-[44ch] text-[12px] text-zinc-400">
                            When KKFI is invited to compete abroad, the travelling squad will appear here.
                        </p>
                    </div>
                ) : (
                    <>
                        <TripHeader delegation={current} />
                        <Squad delegation={current} />

                        {archive.length > 0 && (
                            <section className="mt-20 border-t border-white/[0.07] pt-10">
                                <BandHeading label="Previous delegations" count={archive.length} />
                                <div className="space-y-3">
                                    {archive.map((d) => {
                                        const open = openArchive === d.id;
                                        return (
                                            <div
                                                key={d.id}
                                                className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02]"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenArchive(open ? null : d.id)}
                                                    aria-expanded={open}
                                                    className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                                                >
                                                    <span className="min-w-0">
                                                        <span className="block truncate text-[13px] font-bold text-white">
                                                            {d.tournamentName}
                                                        </span>
                                                        <span className="mt-0.5 block text-[11px] text-zinc-400">
                                                            {d.hostCountry} · {tripDates(d.startDate, d.endDate)} ·{" "}
                                                            {d.memberCount} representing India
                                                        </span>
                                                    </span>
                                                    <ChevronDown
                                                        aria-hidden="true"
                                                        className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
                                                    />
                                                </button>
                                                {open && (
                                                    <div className="border-t border-white/[0.06] p-4">
                                                        <Squad delegation={d} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
