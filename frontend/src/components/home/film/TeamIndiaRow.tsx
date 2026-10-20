"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/imageUtils";
import { formatDateOnly } from "@/lib/dateOnly";
import type { Delegation } from "@/lib/teamIndia";
import FilmLink from "./FilmLink";
import { focusRing, h2, section, wrap } from "./ui";

/**
 * The featured Team India delegation, when an admin has published and
 * featured one; otherwise nothing at all. A still row you scroll yourself,
 * not a marquee.
 */
export default function TeamIndiaRow() {
    const [delegation, setDelegation] = useState<Delegation | null>(null);

    useEffect(() => {
        let cancelled = false;
        api.get("/delegations/featured")
            .then((res) => !cancelled && setDelegation(res.data.data.delegation ?? null))
            .catch(() => !cancelled && setDelegation(null)); // supplementary; stay silent
        return () => {
            cancelled = true;
        };
    }, []);

    if (!delegation || delegation.members.length === 0) return null;

    const where = [delegation.hostCity, delegation.hostCountry].filter(Boolean).join(", ");

    return (
        <section aria-labelledby="team-india-heading" className={section}>
            <div className={wrap}>
                <h2 id="team-india-heading" className={`${h2} max-w-[22ch]`}>{delegation.tournamentName}</h2>
                <p className="mt-4 font-gothic text-canvas">
                    Representing India in {where}, {formatDateOnly(delegation.startDate, { day: "numeric", month: "long", year: "numeric" }, "en-IN")}, {delegation.memberCount} travelling
                </p>
                <ul
                    tabIndex={0}
                    aria-label="The squad"
                    className={`mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 ${focusRing}`}
                >
                    {delegation.members.map((m) => {
                        const photo = getImageUrl(m.profilePhotoUrl || null);
                        return (
                            <li key={m.id} className="w-[11rem] shrink-0 snap-start">
                                <div className="aspect-[4/5] overflow-hidden bg-worn-belt">
                                    {photo && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={photo} alt={`${m.name}, ${m.rankLabel}`} loading="lazy" className="h-full w-full object-cover object-top grayscale" />
                                    )}
                                </div>
                                <p className="mt-3 truncate font-gothic font-bold text-canvas">{m.name}</p>
                                <p className="font-gothic text-[0.8rem] text-ash">{m.rankLabel}</p>
                            </li>
                        );
                    })}
                </ul>
                <div className="mt-8">
                    <FilmLink href="/team-india" variant="quiet">Meet the squad</FilmLink>
                </div>
            </div>
        </section>
    );
}
