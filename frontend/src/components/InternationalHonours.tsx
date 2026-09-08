"use client";

import Link from "next/link";
import { Plane } from "lucide-react";
import { findCountry, flagUrl } from "@/lib/countries";
import {
    appearancePlace,
    capsLabel,
    hasInternational,
    roleLabel,
    type Appearance,
    type InternationalRecord,
} from "@/lib/international";

/**
 * A member's record of representing India abroad.
 *
 * Shared by the public verification profile and the member's own profile so
 * the two can never describe the same record differently. Both pieces render
 * nothing at all when the member has never travelled — an ordinary profile
 * should look untouched rather than carry an empty "no honours" panel.
 *
 * Gold is deliberate: DESIGN.md reserves it for achievement that was earned,
 * which is exactly what this is, and it is already the mark used for Head of
 * Delegation on the Team India page.
 */

/* ─── The chip, for sitting beside a member's name ───────── */

export function InternationalChip({ record }: { record: InternationalRecord | null | undefined }) {
    if (!hasInternational(record)) return null;

    return (
        <span
            title={`Has represented India internationally ${record!.trips} ${record!.trips === 1 ? "time" : "times"}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded border border-[#FFD700]/40 bg-[#FFD700]/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[1.5px] text-[#FFD700]"
        >
            <Plane className="h-3 w-3" aria-hidden="true" />
            International
            <span aria-hidden="true" className="text-[#FFD700]/50">·</span>
            <span className="tabular-nums">{capsLabel(record!)}</span>
        </span>
    );
}

/* ─── Passport: the countries competed in ────────────────── */

function Passport({ countries }: { countries: string[] }) {
    const known = countries.filter((c) => findCountry(c));
    if (known.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-2">
            {known.map((code) => {
                const country = findCountry(code)!;
                return (
                    <span
                        key={code}
                        title={country.name}
                        className="inline-flex items-center gap-1.5 rounded border border-white/[0.1] bg-white/[0.04] py-1 pl-1 pr-2"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={flagUrl(code, 40)}
                            alt=""
                            width={20}
                            height={14}
                            loading="lazy"
                            className="rounded-[2px]"
                        />
                        <span className="text-[11px] font-bold uppercase tracking-[1px] text-zinc-200">
                            {country.name}
                        </span>
                    </span>
                );
            })}
        </div>
    );
}

/* ─── One trip ───────────────────────────────────────────── */

function AppearanceRow({ appearance }: { appearance: Appearance }) {
    const country = findCountry(appearance.hostCountryCode);
    const place = appearancePlace(appearance);
    const isOfficial = appearance.squadRole !== "COMPETITOR";

    return (
        <li className="flex items-start gap-3 py-3">
            {country ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={flagUrl(country.code, 40)}
                    alt=""
                    width={22}
                    height={15}
                    loading="lazy"
                    className="mt-[3px] shrink-0 rounded-[2px]"
                />
            ) : (
                <Plane className="mt-[3px] h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
            )}

            <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold leading-snug text-white">
                    {appearance.tournamentName}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-400">
                    {place}
                    {" · "}
                    <span className="tabular-nums">{appearance.year}</span>
                </p>
                {/* The rank is the one held on that trip, not today's — that is
                    the whole point of freezing it at selection. */}
                <p className="mt-1 text-[11px] text-zinc-300">
                    {isOfficial ? (
                        <span className="font-semibold text-[#FFD700]">{roleLabel(appearance.squadRole)}</span>
                    ) : (
                        <>Competed as {appearance.rankAtSelection}</>
                    )}
                    {isOfficial && <> · {appearance.rankAtSelection}</>}
                </p>
            </div>
        </li>
    );
}

/* ─── The section ────────────────────────────────────────── */

export default function InternationalHonours({
    record,
    className = "",
}: {
    record: InternationalRecord | null | undefined;
    className?: string;
}) {
    if (!hasInternational(record)) return null;
    const r = record!;

    return (
        <section className={`rounded-2xl border border-[#FFD700]/20 bg-white/[0.02] p-5 ${className}`}>
            <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-[13px] font-black uppercase tracking-[2px] text-[#FFD700]">
                        Represented India
                    </h3>
                    <p className="mt-1 text-[11px] text-zinc-400">
                        {r.trips === 1
                            ? "One international delegation"
                            : `${r.trips} international delegations`}
                        {r.countries.length > 0 && (
                            <>
                                {" · "}
                                {r.countries.length === 1 ? "1 country" : `${r.countries.length} countries`}
                            </>
                        )}
                    </p>
                </div>
                <Link
                    href="/team-india"
                    className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-zinc-300 underline decoration-white/25 underline-offset-4 transition-colors hover:text-white"
                >
                    Team India
                </Link>
            </header>

            <Passport countries={r.countries} />

            <ul className="mt-4 divide-y divide-white/[0.06] border-t border-white/[0.06]">
                {r.appearances.map((a) => (
                    <AppearanceRow key={`${a.delegationId}-${a.startDate}`} appearance={a} />
                ))}
            </ul>
        </section>
    );
}
