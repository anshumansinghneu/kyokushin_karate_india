"use client";

import { useState, useEffect, useMemo, MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Award, MapPin, Users, ChevronRight, Shield, Building2, BadgeCheck } from "lucide-react";
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
    glow: string;
    badgeClass: string;
    barClass: string;
}

// ─── Dan Tiers — clean labels, no Japanese ───────────────────────────
const DAN_TIERS: DanTier[] = [
    { dan: 10, label: "10th Dan", accent: "text-amber-400",  glow: "rgba(251,191,36,0.35)",  badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",  barClass: "from-amber-400 to-yellow-600" },
    { dan: 9,  label: "9th Dan",  accent: "text-amber-400",  glow: "rgba(251,191,36,0.3)",   badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",  barClass: "from-amber-400 to-yellow-600" },
    { dan: 8,  label: "8th Dan",  accent: "text-amber-400",  glow: "rgba(245,158,11,0.25)",  badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/25",  barClass: "from-amber-500 to-orange-600" },
    { dan: 7,  label: "7th Dan",  accent: "text-red-400",    glow: "rgba(239,68,68,0.25)",   badgeClass: "bg-red-500/15 text-red-400 border-red-500/30",        barClass: "from-red-500 to-red-700" },
    { dan: 6,  label: "6th Dan",  accent: "text-red-400",    glow: "rgba(239,68,68,0.2)",    badgeClass: "bg-red-500/15 text-red-400 border-red-500/25",        barClass: "from-red-500 to-red-700" },
    { dan: 5,  label: "5th Dan",  accent: "text-red-400",    glow: "rgba(220,38,38,0.18)",   badgeClass: "bg-red-500/10 text-red-400 border-red-500/20",        barClass: "from-red-600 to-red-800" },
    { dan: 4,  label: "4th Dan",  accent: "text-gray-300",   glow: "rgba(161,161,170,0.15)", badgeClass: "bg-white/10 text-gray-300 border-white/15",           barClass: "from-zinc-400 to-zinc-600" },
    { dan: 3,  label: "3rd Dan",  accent: "text-gray-300",   glow: "rgba(161,161,170,0.12)", badgeClass: "bg-white/10 text-gray-300 border-white/15",           barClass: "from-zinc-400 to-zinc-600" },
    { dan: 2,  label: "2nd Dan",  accent: "text-gray-400",   glow: "rgba(113,113,122,0.1)",  badgeClass: "bg-white/8 text-gray-400 border-white/10",            barClass: "from-zinc-500 to-zinc-700" },
    { dan: 1,  label: "1st Dan",  accent: "text-gray-400",   glow: "rgba(113,113,122,0.08)", badgeClass: "bg-white/8 text-gray-400 border-white/10",            barClass: "from-zinc-500 to-zinc-700" },
];

const ordinal = (n: number) => n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;

// ─── 3D Tilt Card ─────────────────────────────────────────────────────
function BlackBeltCard({ member, tier, index }: { member: BlackBelt; tier: DanTier; index: number }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    function onMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        x.set(clientX - left - width / 2);
        y.set(clientY - top - height / 2);
    }

    const rotateX = useTransform(mouseY, [-200, 200], [3, -3]);
    const rotateY = useTransform(mouseX, [-200, 200], [-3, 3]);

    const photoUrl = getImageUrl(member.profilePhotoUrl || null);
    const location = [member.city, member.state].filter(Boolean).join(", ");

    // Collect all dojos
    const dojos = member.teachingDojos && member.teachingDojos.length > 0
        ? member.teachingDojos
        : member.dojo ? [{ id: "primary", name: member.dojo.name, city: member.dojo.city }] : [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ delay: index * 0.05, duration: 0.45 }}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            onMouseMove={onMouseMove}
            onMouseLeave={() => { x.set(0); y.set(0); }}
            className="group relative rounded-2xl overflow-hidden border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm hover:border-white/[0.14] transition-colors duration-300"
        >
            {/* Hover glow */}
            <div
                className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl -z-10"
                style={{ background: `radial-gradient(500px circle, ${tier.glow}, transparent 70%)` }}
            />

            <div className="flex items-stretch">
                {/* Photo column */}
                <div className="relative w-28 sm:w-36 shrink-0 bg-zinc-900 overflow-hidden">
                    {photoUrl ? (
                        <img
                            src={photoUrl}
                            alt={member.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 min-h-[140px]">
                            <span className="text-5xl font-black text-white/10">{member.name.charAt(0)}</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/40" />
                </div>

                {/* Content column */}
                <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center min-h-[140px]">
                    {/* Name + Dan badge row */}
                    <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                            {member.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${tier.badgeClass}`}>
                            {ordinal(tier.dan)} Dan
                        </span>
                    </div>

                    {/* Role */}
                    {member.role && member.role !== "STUDENT" && (
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
                            {member.role === "ADMIN" ? "Country Director" : "Instructor"}
                        </p>
                    )}
                    {member.role === "STUDENT" && (
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
                            Black Belt Holder
                        </p>
                    )}

                    {/* Dojos + Location */}
                    <div className="space-y-1">
                        {dojos.map((d) => (
                            <p key={d.id} className="text-[13px] text-gray-400 flex items-center gap-1.5">
                                <Building2 className="w-3 h-3 text-gray-600 shrink-0" />
                                <span className="truncate">{d.name}</span>
                            </p>
                        ))}
                        {location && (
                            <p className="text-[13px] text-gray-500 flex items-center gap-1.5">
                                <MapPin className="w-3 h-3 text-gray-600 shrink-0" />
                                {location}
                            </p>
                        )}
                    </div>

                    {/* Verify link */}
                    {member.membershipNumber && (
                        <Link
                            href={`/verify/${member.membershipNumber}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400/80 hover:text-red-400 transition-colors mt-3"
                        >
                            <BadgeCheck className="w-3 h-3" /> Verify <ChevronRight className="w-3 h-3" />
                        </Link>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ─── Tier Section ─────────────────────────────────────────────────────
function TierSection({ tier, members }: { tier: DanTier; members: BlackBelt[] }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5 }}
            className="mb-14"
        >
            {/* Tier header — minimal */}
            <div className="flex items-center gap-3 mb-6">
                <div className={`h-px flex-1 bg-gradient-to-r ${tier.barClass} opacity-30`} />
                <h2 className={`text-sm font-bold uppercase tracking-[0.15em] ${tier.accent}`}>
                    {tier.label}
                </h2>
                <span className="text-xs text-gray-600">{members.length}</span>
                <div className={`h-px flex-1 bg-gradient-to-l ${tier.barClass} opacity-30`} />
            </div>

            {/* Cards — always 2-column on desktop for a uniform professional look */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {members.map((member, i) => (
                    <BlackBeltCard key={member.id} member={member} tier={tier} index={i} />
                ))}
            </div>
        </motion.section>
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
        const match = rank.match(/(\d+)/);
        if (match) return parseInt(match[1], 10);
        if (rank === "Black") return 1;
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
        <div className="min-h-screen bg-black text-white">
            {/* ── Hero ─────────────────────────────────────────────────── */}
            <div className="relative overflow-hidden border-b border-white/[0.06]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/40 via-black to-black" />

                <div className="max-w-5xl mx-auto px-4 pt-24 pb-16 md:pt-32 md:pb-20 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center"
                    >
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4">
                            Black Belt{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">
                                Directory
                            </span>
                        </h1>
                        <p className="text-gray-500 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
                            Active Dan-graded practitioners of Kyokushin Karate Federation of India.
                        </p>

                        {!loading && totalCount > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.25 }}
                                className="flex items-center justify-center gap-4 mt-6 text-xs text-gray-500"
                            >
                                <span className="flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-gray-600" />
                                    <strong className="text-white font-bold">{totalCount}</strong> Members
                                </span>
                                <span className="w-px h-3 bg-white/10" />
                                <span className="flex items-center gap-1.5">
                                    <Award className="w-3.5 h-3.5 text-gray-600" />
                                    <strong className="text-white font-bold">{tiers.length}</strong> Dan Levels
                                </span>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* ── Content ──────────────────────────────────────────────── */}
            <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <KarateLoader />
                    </div>
                ) : tiers.length === 0 ? (
                    <div className="text-center py-20">
                        <Award className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-400">No black belt holders listed yet</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Profiles will appear here once members are approved and active.
                        </p>
                    </div>
                ) : (
                    tiers.map((tier) => (
                        <TierSection key={tier.dan} tier={tier} members={tier.members} />
                    ))
                )}
            </div>
        </div>
    );
}
