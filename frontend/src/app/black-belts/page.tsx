
"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Award, MapPin, Building2, BadgeCheck, User } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import KarateLoader from "@/components/KarateLoader";
import { getImageUrl } from "@/lib/imageUtils";

// ─── Types ────────────────────────────────────────────────────────────
interface BlackBelt {
    id: string;
    name: string;
    currentBeltRank: string;
    profilePhotoUrl?: string;
    city?: string;
    state?: string;
    membershipNumber?: string;
    role?: string;
    dojo?: { name: string; city: string } | null;
    teachingDojos?: { id: string; name: string; city: string }[];
}

interface DanTier {
    dan: number;
    label: string;
    accent: string;
    bgGlow: string;
    borderHover: string;
}

// ─── Dan Tiers ─────────────────────────────────────────────────────────
const DAN_TIERS: DanTier[] = [
    { dan: 10, label: "10th Dan", accent: "text-yellow-500", bgGlow: "group-hover:shadow-[0_0_50px_-12px_rgba(234,179,8,0.3)]", borderHover: "group-hover:border-yellow-500/50" },
    { dan: 9,  label: "9th Dan",  accent: "text-yellow-500", bgGlow: "group-hover:shadow-[0_0_50px_-12px_rgba(234,179,8,0.3)]", borderHover: "group-hover:border-yellow-500/50" },
    { dan: 8,  label: "8th Dan",  accent: "text-amber-500", bgGlow: "group-hover:shadow-[0_0_50px_-12px_rgba(245,158,11,0.3)]", borderHover: "group-hover:border-amber-500/50" },
    { dan: 7,  label: "7th Dan",  accent: "text-red-500", bgGlow: "group-hover:shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)]", borderHover: "group-hover:border-red-500/50" },
    { dan: 6,  label: "6th Dan",  accent: "text-red-500", bgGlow: "group-hover:shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)]", borderHover: "group-hover:border-red-500/50" },
    { dan: 5,  label: "5th Dan",  accent: "text-red-500", bgGlow: "group-hover:shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)]", borderHover: "group-hover:border-red-500/50" },
    { dan: 4,  label: "4th Dan",  accent: "text-zinc-200", bgGlow: "group-hover:shadow-[0_0_50px_-12px_rgba(255,255,255,0.15)]", borderHover: "group-hover:border-white/30" },
    { dan: 3,  label: "3rd Dan",  accent: "text-zinc-300", bgGlow: "group-hover:shadow-[0_0_50px_-12px_rgba(255,255,255,0.1)]", borderHover: "group-hover:border-white/20" },
    { dan: 2,  label: "2nd Dan",  accent: "text-zinc-400", bgGlow: "group-hover:shadow-[0_0_50px_-12px_rgba(255,255,255,0.1)]", borderHover: "group-hover:border-white/20" },
    { dan: 1,  label: "1st Dan",  accent: "text-zinc-400", bgGlow: "group-hover:shadow-[0_0_50px_-12px_rgba(255,255,255,0.05)]", borderHover: "group-hover:border-white/10" },
];

const getTitle = (dan: number, isPlural: boolean = false) => {
    let title = "";
    if (dan >= 5) title = "SHIHAN";
    else if (dan >= 3) title = "SENSEI";
    else title = "SENPAI";
    
    return isPlural ? title + "S" : title;
};

// ─── Fighter Card ───────────────────────────────────────────
function FighterCard({ member, tier, index }: { member: BlackBelt; tier: DanTier; index: number }) {
    const photoUrl = getImageUrl(member.profilePhotoUrl || null);
    const location = [member.city, member.state].filter(Boolean).join(", ");
    const initials = member.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

    const dojos = member.teachingDojos && member.teachingDojos.length > 0
        ? member.teachingDojos
        : member.dojo ? [{ id: "primary", name: member.dojo.name, city: member.dojo.city }] : [];

    // Link to dojo profile if available
    const dojoId = dojos.length > 0 && dojos[0].id !== "primary" ? dojos[0].id : null;

    const card = (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ delay: (index % 4) * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={`group relative flex flex-col h-[360px] w-full rounded-2xl bg-white/[0.02] border border-white/[0.04] overflow-hidden transition-all duration-500 hover:border-red-600/15 hover:-translate-y-1 ${tier.bgGlow}`}
        >
            {/* Sweep light on hover */}
            <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden rounded-2xl">
                <div className="absolute top-0 left-[-100%] h-full w-1/2 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent skew-x-[-25deg] group-hover:left-[200%] transition-all duration-1000 ease-in-out" />
            </div>

            {/* Photo */}
            <div className="relative h-[55%] w-full overflow-hidden bg-black">
                {photoUrl ? (
                    <img
                        src={photoUrl}
                        alt={member.name}
                        className="w-full h-full object-cover object-top filter grayscale contrast-[1.1] opacity-80 group-hover:scale-105 group-hover:grayscale-[30%] group-hover:opacity-100 transition-all duration-1000 ease-out"
                    />
                ) : (
                    <div className="w-full h-full bg-[#080808] flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-red-600/10 border border-red-600/20 flex items-center justify-center">
                            <span className="text-2xl font-black text-red-500/60">{initials}</span>
                        </div>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/30 to-transparent" />

                {member.membershipNumber && (
                    <div className="absolute top-3 right-3 z-20">
                        <div className="bg-black/50 backdrop-blur-xl p-1.5 rounded-full border border-white/10 text-white/40 group-hover:text-emerald-400 group-hover:border-emerald-400/30 transition-all duration-500">
                            <BadgeCheck className="w-3.5 h-3.5" />
                        </div>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="relative -mt-6 px-5 pb-5 flex flex-col flex-1 z-10">
                {/* Belt indicator */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-[2px] h-3.5 rounded-full bg-red-600" />
                    <span className="text-[9px] font-extrabold text-red-500 uppercase tracking-[2px]">
                        {tier.label} &middot; {getTitle(tier.dan)}
                    </span>
                </div>

                <h3 className="text-lg font-extrabold text-white tracking-tight leading-snug mb-2">
                    {member.name}
                </h3>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-auto text-[11px] text-zinc-500">
                    {dojos.slice(0,1).map((d) => (
                        <span key={d.id} className="flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 opacity-40" />
                            <span className="truncate">{d.name}</span>
                        </span>
                    ))}
                    {dojos.length > 0 && location && <span className="w-1 h-1 rounded-full bg-zinc-700" />}
                    {location && (
                        <span className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 opacity-40" />
                            <span className="truncate">{location}</span>
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );

    // Wrap in link if dojo exists
    if (dojoId) {
        return <Link href={`/dojos/${dojoId}`} className="block">{card}</Link>;
    }
    return card;
}

// ─── Tier Section ────────────────────────────────────────────
function TierSection({ tier, members }: { tier: DanTier; members: BlackBelt[] }) {
    return (
        <section className="relative mb-20 pt-12">
            <div className="container-responsive relative z-10">
                {/* Tier Header — centered */}
                <div className="flex flex-col items-center text-center pb-4 mb-10 relative">
                    {/* Red gradient underline */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-600/30 to-transparent" />

                    <div className="flex items-baseline gap-3 mb-2">
                        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                            {tier.label}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-[2px] bg-red-600/10 text-red-500 border border-red-600/15">
                            {getTitle(tier.dan)}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex gap-[3px]">
                            {[...Array(tier.dan)].map((_, i) => (
                                <div key={i} className={`w-[3px] h-4 rounded-sm opacity-40 ${tier.dan >= 8 ? 'bg-yellow-500' : tier.dan >= 5 ? 'bg-red-500' : 'bg-white'}`} />
                            ))}
                        </div>
                        <span className="text-[10px] font-semibold text-zinc-500">
                            {members.length} {members.length === 1 ? 'Member' : 'Members'}
                        </span>
                    </div>
                </div>

                {/* Card Grid — centered, fills from center outward */}
                <div className="flex flex-wrap justify-center gap-5">
                    {members.map((member, i) => (
                        <div key={member.id} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] xl:w-[calc(25%-15px)]">
                            <FighterCard member={member} tier={tier} index={i} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────
export default function BlackBeltsPage() {
    const [blackBelts, setBlackBelts] = useState<BlackBelt[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlackBelts = async () => {
            try {
                const res = await api.get("/users/public-black-belts");
                if (res.data?.data?.blackBelts) {
                    setBlackBelts(res.data.data.blackBelts);
                }
            } catch (err) {
                console.error("Failed to fetch black belts", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBlackBelts();
    }, []);

    const parseDan = (rank: string): number => {
        if (!rank) return 0;
        const match = String(rank).match(/(\d+)/);
        if (match) return parseInt(match[1], 10);
        if (String(rank).includes("Black")) return 1;
        return 0;
    };

    const tiers = useMemo(() => {
        return DAN_TIERS
            .map((tier) => ({
                ...tier,
                members: blackBelts.filter((bb) => parseDan(bb.currentBeltRank) === tier.dan),
            }))
            .filter((tier) => tier.members.length > 0);
    }, [blackBelts]);

    const totalCount = blackBelts.length;

    return (
        <div className="min-h-screen bg-[#050505] text-white relative font-sans">
            {/* Subtle top vignette */}
            <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-zinc-900/10 to-transparent pointer-events-none" />

            {/* ── Hero ─── */}
            <div className="relative pt-20 pb-6 md:pt-24 md:pb-8 overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                <div className="container-responsive relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className="text-center flex flex-col items-center"
                    >
                        {/* Title: BLACK [logo] BELT / REGISTRY */}
                        <h1 className="font-black uppercase leading-[0.9] tracking-tighter mb-5" style={{ fontSize: 'clamp(2.5rem, 7vw, 4.5rem)' }}>
                            <span className="inline-flex items-center gap-3 md:gap-4">
                                <span className="text-white">BLACK</span>
                                <img src="/kkfi-logo.png" alt="KKFI" className="w-10 h-10 md:w-14 md:h-14 inline-block rounded-full border-2 border-white/10 shadow-[0_0_20px_rgba(220,38,38,0.2)]" />
                                <span className="text-white">BELT</span>
                            </span>
                            <br />
                            <span
                                className="drop-shadow-[0_4px_25px_rgba(220,38,38,0.4)]"
                                style={{
                                    background: 'linear-gradient(180deg, #ef4444, #991b1b)',
                                    WebkitBackgroundClip: 'text',
                                    backgroundClip: 'text',
                                    color: 'transparent',
                                }}
                            >REGISTRY</span>
                        </h1>

                        {/* Divider line with stats inline */}
                        <div className="flex items-center gap-4 md:gap-6 w-full max-w-2xl mb-5">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/[0.06]" />
                            {!loading && totalCount > 0 && (
                                <>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-lg font-extrabold text-white">{totalCount}</span>
                                        <span className="text-[8px] font-semibold text-zinc-600 uppercase tracking-widest">Members</span>
                                    </div>
                                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-lg font-extrabold text-white">{tiers.length}</span>
                                        <span className="text-[8px] font-semibold text-zinc-600 uppercase tracking-widest">Dan Tiers</span>
                                    </div>
                                </>
                            )}
                            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/[0.06]" />
                        </div>

                        <p className="text-xs md:text-sm text-zinc-600 max-w-md leading-relaxed">
                            The highest-ranked practitioners of Kyokushin Karate in India.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* ── Tiers Pipeline ──────────────────────────────────────── */}
            <div className="relative z-10 w-full bg-[#050505] pb-32">
                {loading ? (
                    <div className="flex justify-center py-40">
                        <KarateLoader />
                    </div>
                ) : tiers.length === 0 ? (
                    <div className="container-responsive text-center py-40 flex flex-col items-center">
                        <Award className="w-12 h-12 text-zinc-700 mb-6 opacity-50" />
                        <h3 className="text-2xl font-light text-white mb-3">No Profiles Found</h3>
                        <p className="text-zinc-500 font-light max-w-sm">
                            The registry is currently empty.
                        </p>
                    </div>
                ) : (
                    <div className="w-full">
                        {tiers.map((tier) => (
                            <TierSection key={tier.dan} tier={tier} members={tier.members} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

