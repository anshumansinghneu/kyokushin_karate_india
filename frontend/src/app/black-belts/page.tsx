"use client";

import { useState, useEffect, useMemo, MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Award, MapPin, Users, ChevronRight, Shield } from "lucide-react";
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
    rank: string;
    dan: number;
    title: string;
    japanese: string;
    color: string;
    glow: string;
    badge: string;
}

// ─── Dan Tier Hierarchy (highest to lowest) ──────────────────────────
const DAN_TIERS: DanTier[] = [
    { rank: "Black 10th Dan", dan: 10, title: "Grand Master",        japanese: "Judan",    color: "from-yellow-400 to-amber-600",  glow: "rgba(251,191,36,0.4)",   badge: "bg-gradient-to-r from-yellow-400 to-amber-500 text-black" },
    { rank: "Black 9th Dan",  dan: 9,  title: "Grand Master",        japanese: "Kudan",    color: "from-yellow-400 to-amber-600",  glow: "rgba(251,191,36,0.35)",  badge: "bg-gradient-to-r from-yellow-400 to-amber-500 text-black" },
    { rank: "Black 8th Dan",  dan: 8,  title: "Grand Master",        japanese: "Hachidan", color: "from-yellow-500 to-orange-600",  glow: "rgba(245,158,11,0.3)",   badge: "bg-gradient-to-r from-yellow-500 to-orange-500 text-black" },
    { rank: "Black 7th Dan",  dan: 7,  title: "Master",              japanese: "Nanadan",  color: "from-red-500 to-red-700",       glow: "rgba(239,68,68,0.3)",    badge: "bg-gradient-to-r from-red-500 to-red-700 text-white" },
    { rank: "Black 6th Dan",  dan: 6,  title: "Master",              japanese: "Rokudan",  color: "from-red-500 to-red-700",       glow: "rgba(239,68,68,0.25)",   badge: "bg-gradient-to-r from-red-500 to-red-700 text-white" },
    { rank: "Black 5th Dan",  dan: 5,  title: "Master Instructor",   japanese: "Godan",    color: "from-red-600 to-red-800",       glow: "rgba(220,38,38,0.2)",    badge: "bg-gradient-to-r from-red-600 to-red-800 text-white" },
    { rank: "Black 4th Dan",  dan: 4,  title: "Senior Instructor",   japanese: "Yondan",   color: "from-zinc-300 to-zinc-500",     glow: "rgba(161,161,170,0.15)", badge: "bg-gradient-to-r from-zinc-300 to-zinc-500 text-black" },
    { rank: "Black 3rd Dan",  dan: 3,  title: "Instructor",          japanese: "Sandan",   color: "from-zinc-400 to-zinc-600",     glow: "rgba(161,161,170,0.12)", badge: "bg-gradient-to-r from-zinc-400 to-zinc-600 text-black" },
    { rank: "Black 2nd Dan",  dan: 2,  title: "Assistant Instructor", japanese: "Nidan",   color: "from-zinc-500 to-zinc-700",     glow: "rgba(113,113,122,0.1)",  badge: "bg-gradient-to-r from-zinc-500 to-zinc-700 text-white" },
    { rank: "Black 1st Dan",  dan: 1,  title: "Beginner Black Belt", japanese: "Shodan",   color: "from-zinc-500 to-zinc-700",     glow: "rgba(113,113,122,0.08)", badge: "bg-gradient-to-r from-zinc-500 to-zinc-700 text-white" },
];

// ─── 3D Tilt Card ─────────────────────────────────────────────────────
function BlackBeltCard({ member, tier, index, featured }: { member: BlackBelt; tier: DanTier; index: number; featured?: boolean }) {
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ delay: index * 0.06, duration: 0.5 }}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            onMouseMove={onMouseMove}
            onMouseLeave={() => { x.set(0); y.set(0); }}
            className="group relative rounded-2xl overflow-hidden border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl shadow-2xl"
        >
            {/* Hover glow */}
            <div
                className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl -z-10"
                style={{ background: `radial-gradient(600px circle, ${tier.glow}, transparent 70%)` }}
            />

            {/* Top accent bar */}
            <div className={`h-1 bg-gradient-to-r ${tier.color}`} />

            <div className={featured ? "flex flex-col md:flex-row" : ""}>
                {/* Profile photo */}
                <div className={`relative ${featured ? "md:w-64 md:shrink-0 h-52 md:h-auto" : "h-48"} bg-gradient-to-br from-zinc-800 to-zinc-900 overflow-hidden`}>
                    {photoUrl ? (
                        <img
                            src={photoUrl}
                            alt={member.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                            <span className="text-6xl font-black text-white/15">{member.name.charAt(0)}</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                    {/* Dan badge */}
                    <div className="absolute top-3 right-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${tier.badge} shadow-lg`}>
                            {tier.dan === 10 ? "10th" : tier.dan === 9 ? "9th" : tier.dan === 8 ? "8th" : tier.dan === 7 ? "7th" : tier.dan === 6 ? "6th" : tier.dan === 5 ? "5th" : tier.dan === 4 ? "4th" : tier.dan === 3 ? "3rd" : tier.dan === 2 ? "2nd" : "1st"} Dan
                        </span>
                    </div>

                    {/* Role badge */}
                    {member.role && member.role !== "STUDENT" && (
                        <div className="absolute top-3 left-3">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-black/60 text-white/80 border border-white/10 backdrop-blur-sm">
                                {member.role === "ADMIN" ? "Director" : "Instructor"}
                            </span>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className={`p-5 ${featured ? "flex-1" : ""}`}>
                    <h3 className="text-lg font-black text-white mb-0.5 group-hover:text-red-400 transition-colors">
                        {member.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-3">
                        {tier.title} &middot; {tier.japanese}
                    </p>

                    <div className="space-y-1.5 mb-4">
                        {/* Show all teaching dojos for instructors, fall back to primary dojo */}
                        {member.teachingDojos && member.teachingDojos.length > 0 ? (
                            member.teachingDojos.map((d) => (
                                <p key={d.id} className="text-sm text-gray-400 flex items-center gap-2">
                                    <Shield className="w-3.5 h-3.5 text-red-500/70 shrink-0" />
                                    <span className="truncate">{d.name}</span>
                                </p>
                            ))
                        ) : member.dojo ? (
                            <p className="text-sm text-gray-400 flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5 text-red-500/70 shrink-0" />
                                <span className="truncate">{member.dojo.name}</span>
                            </p>
                        ) : null}
                        {location && (
                            <p className="text-sm text-gray-400 flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-red-500/70 shrink-0" />
                                {location}
                            </p>
                        )}
                    </div>

                    {member.membershipNumber && (
                        <Link
                            href={`/verify/${member.membershipNumber}`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition-colors py-1.5 active:opacity-70"
                        >
                            Verify Credentials <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ─── Tier Section ─────────────────────────────────────────────────────
function TierSection({ tier, members }: { tier: DanTier; members: BlackBelt[] }) {
    const gridCols = tier.dan >= 7
        ? "grid-cols-1"
        : tier.dan >= 5
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    const featured = tier.dan >= 7;

    return (
        <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
        >
            {/* Tier header */}
            <div className="flex items-center gap-4 mb-8">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center shadow-lg shrink-0`}>
                    <span className="text-lg font-black text-white drop-shadow-md" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
                        {tier.dan}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3 flex-wrap">
                        <h2 className="text-2xl font-black text-white">
                            {tier.title}
                        </h2>
                        <span className="text-sm text-gray-500 font-medium italic">
                            {tier.japanese} &mdash; {tier.dan}{tier.dan === 1 ? "st" : tier.dan === 2 ? "nd" : tier.dan === 3 ? "rd" : "th"} Dan
                        </span>
                    </div>
                    <div className={`h-0.5 bg-gradient-to-r ${tier.color} mt-2 rounded-full`} style={{ width: `${Math.min(100, 40 + tier.dan * 6)}%` }} />
                </div>
                <span className="text-sm font-bold text-gray-600 shrink-0">
                    {members.length} member{members.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Cards grid */}
            <div className={`grid ${gridCols} gap-6`}>
                {members.map((member, i) => (
                    <BlackBeltCard key={member.id} member={member} tier={tier} index={i} featured={featured} />
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

    // Parse Dan number from varied belt rank formats:
    // "Black 1st Dan" -> 1, "3rd Dan" -> 3, "Black" -> 1, "5th Dan" -> 5
    const parseDan = (rank: string): number => {
        const match = rank.match(/(\d+)/);
        if (match) return parseInt(match[1], 10);
        if (rank === "Black") return 1; // Plain "Black" = 1st Dan
        return 0;
    };

    // Group members by Dan tier, skip empty tiers
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
        <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
            {/* ── Background atmosphere ─────────────────────────────────── */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-red-600/[0.04] rounded-full blur-[150px]" />
                <div className="absolute bottom-1/3 -right-32 w-96 h-96 bg-yellow-600/[0.03] rounded-full blur-[150px]" />
            </div>

            {/* ── Hero Section ──────────────────────────────────────────── */}
            <div className="relative overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-yellow-900/10 via-transparent to-transparent" />

                <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full mb-6">
                            <Award className="w-4 h-4 text-red-500" />
                            <span className="text-xs font-bold text-red-400 uppercase tracking-[0.2em]">
                                Kyokushin Black Belts
                            </span>
                        </div>

                        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black mb-4 tracking-tight">
                            Black Belt{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-amber-500">
                                Directory
                            </span>
                        </h1>

                        <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
                            The practitioners who have earned the rank of Yudansha &mdash; organized
                            from Grand Master to Shodan, representing the spirit and discipline
                            of Kyokushin Karate.
                        </p>

                        {/* Stats */}
                        {!loading && totalCount > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-wrap items-center justify-center gap-3"
                            >
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                                    <Users className="w-3.5 h-3.5 text-red-400" />
                                    <span className="text-sm font-bold text-white">{totalCount}</span>
                                    <span className="text-xs text-gray-500">Black Belts</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                                    <Award className="w-3.5 h-3.5 text-amber-400" />
                                    <span className="text-sm font-bold text-white">{tiers.length}</span>
                                    <span className="text-xs text-gray-500">Dan Levels</span>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* ── Content ──────────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <KarateLoader />
                    </div>
                ) : tiers.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-zinc-900/80 border border-white/10 flex items-center justify-center">
                            <Award className="w-8 h-8 text-zinc-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-400">No black belt holders listed yet</h3>
                        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                            Black belt profiles will appear here once members are approved and active.
                        </p>
                    </div>
                ) : (
                    tiers.map((tier) => (
                        <TierSection key={tier.rank} tier={tier} members={tier.members} />
                    ))
                )}
            </div>
        </div>
    );
}
