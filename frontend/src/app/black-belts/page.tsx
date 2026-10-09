"use client";

import { useState, useEffect, useMemo } from "react";
import { Award } from "lucide-react";
import api from "@/lib/api";
import KarateLoader from "@/components/KarateLoader";
import { getImageUrl } from "@/lib/imageUtils";
import Reveal from "@/components/brand/Reveal";
import Section from "@/components/brand/Section";
import RankPortrait, { DanBars, danTitle, ordinal, parseDan } from "@/components/people/RankPortrait";

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

interface Tier {
    dan: number;
    members: BlackBelt[];
}

function dojosOf(member: BlackBelt) {
    if (member.teachingDojos && member.teachingDojos.length > 0) return member.teachingDojos;
    return member.dojo ? [{ id: "primary", name: member.dojo.name, city: member.dojo.city }] : [];
}

function Portrait({ member, size }: { member: BlackBelt; size: "lead" | "base" }) {
    const dojos = dojosOf(member);
    const dojoId = dojos.length > 0 && dojos[0].id !== "primary" ? dojos[0].id : null;
    return (
        <RankPortrait
            name={member.name}
            rank={member.currentBeltRank}
            photoUrl={getImageUrl(member.profilePhotoUrl || null)}
            detail={dojos[0]?.name}
            location={[member.city, member.state].filter(Boolean).join(", ") || undefined}
            href={dojoId ? `/dojos/${dojoId}` : undefined}
            verifyHref={member.membershipNumber ? `/verify/${member.membershipNumber}` : undefined}
            size={size}
        />
    );
}

const DAN_NOTES: Record<number, string> = {
    1: "Shodan. The 20-man kumite is behind them, and the real learning begins.",
    2: "Nidan. At least two years beyond Shodan, refining technique.",
    3: "Sandan. Expected to teach as well as train.",
    4: "Yondan. Authorised to open and lead a dojo.",
};
const danNote = (dan: number) => DAN_NOTES[dan] ?? "Exceptional contribution to Kyokushin, recognised over decades.";

/**
 * One dan grade: the rank and what it asks of a karateka on the left, its
 * members on the right. The senior-most grade on the page gets larger portraits.
 */
function TierSection({ tier, lead }: { tier: Tier; lead: boolean }) {
    return (
        <Section rhythm={lead ? "base" : "tight"} width="wide" aria-labelledby={`dan-${tier.dan}`}>
            <div className="grid gap-10 border-t border-white/15 pt-10 lg:grid-cols-[18rem_1fr] lg:gap-14">
                <Reveal className="lg:sticky lg:top-32 lg:self-start">
                    <DanBars dan={tier.dan} className="mb-5" />
                    <h2 id={`dan-${tier.dan}`} className="text-[clamp(2rem,4vw,3rem)] font-black uppercase leading-[0.95] tracking-[-0.02em] text-white">
                        {ordinal(tier.dan)} Dan
                    </h2>
                    <p className="mt-1 text-xl font-extrabold uppercase text-white/45">{danTitle(tier.dan)}</p>
                    <p className="mt-5 max-w-[34ch] leading-relaxed text-white/70">{danNote(tier.dan)}</p>
                    <p className="mt-4 text-sm font-semibold text-white/60">
                        {tier.members.length} {tier.members.length === 1 ? "member" : "members"}
                    </p>
                </Reveal>
                <ul className={lead ? "grid gap-x-8 gap-y-12 sm:grid-cols-2" : "grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3"}>
                    {tier.members.map((member, i) => (
                        <Reveal as="li" key={member.id} kind="depth" delay={(i % 3) * 0.06} className={lead && tier.members.length === 1 ? "sm:col-span-2 sm:max-w-md" : undefined}>
                            <Portrait member={member} size={lead ? "lead" : "base"} />
                        </Reveal>
                    ))}
                </ul>
            </div>
        </Section>
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

    const tiers = useMemo<Tier[]>(() => {
        const byDan = new Map<number, BlackBelt[]>();
        for (const bb of blackBelts) {
            const dan = parseDan(bb.currentBeltRank);
            if (dan < 1 || dan > 10) continue;
            byDan.set(dan, [...(byDan.get(dan) ?? []), bb]);
        }
        return [...byDan.entries()]
            .sort((a, b) => b[0] - a[0])
            .map(([dan, members]) => ({
                dan,
                // Photographed members first within a grade, then alphabetical.
                members: members.sort((a, b) => Number(!!b.profilePhotoUrl) - Number(!!a.profilePhotoUrl) || a.name.localeCompare(b.name)),
            }));
    }, [blackBelts]);

    const totalCount = blackBelts.length;
    const senior = tiers[0]?.members.find((m) => m.profilePhotoUrl);
    const seniorPhoto = senior ? getImageUrl(senior.profilePhotoUrl) : null;

    return (
        <div className="min-h-screen text-white">
            {/* ── Hero: the senior-most black belt, in shadow ── */}
            <header data-bleed className="relative flex min-h-[72svh] overflow-hidden bg-black">
                {seniorPhoto && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={seniorPhoto}
                        alt=""
                        style={{
                            maskImage: "linear-gradient(to right, transparent, black 35%), linear-gradient(to top, transparent, black 30%)",
                            WebkitMaskImage: "linear-gradient(to right, transparent, black 35%), linear-gradient(to top, transparent, black 30%)",
                            maskComposite: "intersect",
                            WebkitMaskComposite: "source-in",
                        }}
                        className="absolute inset-y-0 right-0 h-full w-full object-cover object-top opacity-50 grayscale md:w-[60%]"
                    />
                )}
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent md:bg-gradient-to-r md:from-black md:via-black/80 md:to-transparent" />
                <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col justify-end px-4 pb-[clamp(3rem,8vh,6rem)] pt-40 sm:px-6 lg:px-8">
                    <h1 className="max-w-[12ch] text-[clamp(2.75rem,8vw,6rem)] font-black uppercase leading-[0.92] tracking-[-0.035em] text-white">
                        Black belt registry<span className="text-secondary">.</span>
                    </h1>
                    <p className="mt-6 max-w-[44ch] text-pretty text-lg leading-relaxed text-white/80 md:text-xl">
                        The highest-ranked practitioners of Kyokushin Karate in India.
                        {!loading && totalCount > 0 && (
                            <>
                                {" "}
                                {totalCount} black belts across {tiers.length} dan {tiers.length === 1 ? "grade" : "grades"}, senior-most first.
                            </>
                        )}
                    </p>
                </div>
            </header>

            {/* ── Grades, most senior first ── */}
            <div className="bg-black pb-24">
                {loading ? (
                    <div className="flex justify-center py-40">
                        <KarateLoader />
                    </div>
                ) : tiers.length === 0 ? (
                    <div className="flex flex-col items-center px-4 py-40 text-center">
                        <Award className="mb-6 h-12 w-12 text-white/40" aria-hidden="true" />
                        <h2 className="mb-3 text-2xl font-bold text-white">No profiles found</h2>
                        <p className="max-w-sm text-white/70">The registry is currently empty.</p>
                    </div>
                ) : (
                    tiers.map((tier, i) => <TierSection key={tier.dan} tier={tier} lead={i === 0} />)
                )}
            </div>
        </div>
    );
}
