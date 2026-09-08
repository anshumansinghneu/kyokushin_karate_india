"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plane, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/imageUtils";
import { formatDateOnly } from "@/lib/dateOnly";
import { findCountry, flagUrl } from "@/lib/countries";
import type { Delegation, SquadMember } from "@/lib/teamIndia";

/**
 * Homepage ticker for the featured Team India delegation.
 *
 * Renders nothing at all — no heading, no empty container — unless an admin has
 * both published and featured a trip. A silent absence is correct here: the
 * homepage should not advertise a section that has no content.
 */
export default function TeamIndiaStrip() {
    const [delegation, setDelegation] = useState<Delegation | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await api.get("/delegations/featured");
                if (!cancelled) setDelegation(res.data.data.delegation ?? null);
            } catch {
                // A failure here must stay silent. This is a supplementary strip
                // on the homepage, not the page's purpose — an error box would be
                // noisier than showing nothing.
                if (!cancelled) setDelegation(null);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (!delegation || delegation.members.length === 0) return null;

    // The marquee needs the list twice so the loop has no visible seam.
    const reel = [...delegation.members, ...delegation.members];

    return (
        <section
            aria-labelledby="team-india-strip-heading"
            className="relative border-y border-white/[0.07] bg-black py-12"
        >
            <div className="mx-auto mb-7 max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <span className="mb-1.5 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[3px] text-red-500">
                            <Plane className="h-3.5 w-3.5" aria-hidden="true" />
                            Representing India
                        </span>
                        <h2
                            id="team-india-strip-heading"
                            className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl"
                        >
                            {delegation.tournamentName}
                        </h2>
                        <p className="mt-1 flex items-center gap-1.5 text-[12px] text-zinc-400">
                            {findCountry(delegation.hostCountryCode) && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={flagUrl(delegation.hostCountryCode, 40)} alt="" width={18} height={12}
                                    loading="lazy" className="shrink-0 rounded-[2px]" />
                            )}
                            <span>
                                {delegation.hostCity ? `${delegation.hostCity}, ` : ""}
                                {delegation.hostCountry} · {formatDateOnly(delegation.startDate)} ·{" "}
                                {delegation.memberCount} travelling
                            </span>
                        </p>
                    </div>
                    <Link
                        href="/team-india"
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/[0.12] px-4 text-[12px] font-bold uppercase tracking-wider text-white transition-colors hover:border-red-600/60 hover:bg-red-600/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                        Meet the squad
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                </div>
            </div>

            {/* Edge fades so cards enter and leave rather than being cut off */}
            <div className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-black to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-black to-transparent" />

                <ul className="kkfi-marquee flex w-max gap-4 px-4">
                    {reel.map((member: SquadMember, i) => (
                        <li
                            key={`${member.id}-${i}`}
                            // The duplicated half is decorative; hide it from
                            // assistive tech so names are not announced twice.
                            aria-hidden={i >= delegation.members.length}
                            className="w-[168px] shrink-0"
                        >
                            <Link
                                href="/team-india"
                                className="group block overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] transition-colors hover:border-red-600/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                                tabIndex={i >= delegation.members.length ? -1 : undefined}
                            >
                                <div className="relative aspect-[4/5] overflow-hidden bg-zinc-900">
                                    {getImageUrl(member.profilePhotoUrl || null) && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={getImageUrl(member.profilePhotoUrl || null) as string}
                                            alt={i >= delegation.members.length ? "" : `${member.name}, ${member.rankLabel}`}
                                            loading="lazy"
                                            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                        />
                                    )}
                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                                    <div className="absolute inset-x-0 bottom-0 p-2.5">
                                        <span className="block truncate text-[12px] font-bold leading-tight text-white">
                                            {member.name}
                                        </span>
                                        <span className="block text-[10px] font-semibold text-red-400">
                                            {member.rankLabel}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
