"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Plane, Calendar, AlertTriangle, RefreshCw, Globe2, ChevronDown, Users } from "lucide-react";
import api from "@/lib/api";
import KarateLoader from "@/components/KarateLoader";
import SceneSlot from "@/components/three/SceneSlot";
import Reveal from "@/components/brand/Reveal";
import Section from "@/components/brand/Section";
import BrandLink from "@/components/brand/BrandLink";
import { useTilt } from "@/hooks/useTilt";
import { getImageUrl } from "@/lib/imageUtils";
import {
    tripDates,
    groupSquad,
    squadStats,
    type Delegation,
    type SquadMember,
} from "@/lib/teamIndia";
import {
    INDIA_THEME,
    countryTheme,
    countryWordmark,
    findCountry,
    flagUrl,
    isCountryCode,
} from "@/lib/countries";

/* ─── Flag chip ─────────────────────────────────────────── */

function Flag({ code, w = 44 }: { code: string | null | undefined; w?: number }) {
    // Guarded rather than trusted: an unrecognised code would build
    // ".../w160/.png" and ship a broken-image box. Callers pass validated
    // codes today, but the flag is decorative and rendering nothing is always
    // better than rendering a broken tile.
    if (!isCountryCode(code)) return null;

    // Plain <img>, not next/image: flags are tiny, already optimised, and
    // there is no reason to route ~200 possible files through the optimizer.
    // Emoji flags are not an option — Windows Chrome renders them as letters.
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={flagUrl(code, 160)}
            alt=""
            width={w}
            height={Math.round((w * 2) / 3)}
            loading="lazy"
            className="block rounded-[3px] shadow-[0_2px_12px_rgba(0,0,0,.75)]"
        />
    );
}

/* ─── Hero backdrop ─────────────────────────────────────────
   India's colours bloom from the left, the host country's from the right, and
   the centre stays dark so the type never fights the colour. Both halves are
   generated from flag colours, so any country the admin picks is themed
   without hand art-direction.

   This is the one place on the page where colour outside the Kyokushin
   red/gold palette is allowed; everything below the fold stays on-system.
   ---------------------------------------------------------- */

function HeroBackdrop({ cover, hostCode }: { cover: string | null; hostCode: string | null }) {
    // An admin's cover image is a deliberate art-directed choice, so it wins.
    if (cover) {
        const src = getImageUrl(cover);
        return (
            <div aria-hidden="true" className="absolute inset-0">
                {src && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" className="h-full w-full object-cover object-center opacity-[0.55]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/45" />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/55 to-transparent" />
            </div>
        );
    }

    const host = countryTheme(hostCode);
    const [ind1, ind2] = INDIA_THEME.colors;
    const [host1, host2] = host.colors;

    return (
        <div aria-hidden="true" className="absolute inset-0">
            <div
                className="absolute inset-0"
                style={{
                    background: [
                        `radial-gradient(62% 105% at -6% 30%, ${ind1} 0%, ${hexA(ind1, 0.5)} 32%, transparent 62%)`,
                        `radial-gradient(52% 95% at 2% 90%, ${ind2} 0%, ${hexA(ind2, 0.42)} 34%, transparent 64%)`,
                        `radial-gradient(66% 110% at 104% 50%, ${host1} 0%, ${hexA(host1, 0.55)} 34%, transparent 66%)`,
                        `radial-gradient(44% 70% at 92% 96%, ${hexA(host2, 0.5)} 0%, transparent 62%)`,
                        "#05050a",
                    ].join(","),
                }}
            />
            {/* Type guard: darkens only the lower-left where the copy sits, so
                the colour survives instead of being flattened everywhere. */}
            <div
                className="absolute inset-0"
                style={{
                    background: [
                        "radial-gradient(ellipse 82% 66% at 16% 90%, rgba(0,0,0,.94), rgba(0,0,0,.55) 52%, transparent 78%)",
                        "linear-gradient(to top, rgba(0,0,0,.92) 0%, rgba(0,0,0,.30) 38%, transparent 62%)",
                    ].join(","),
                }}
            />
        </div>
    );
}

/* ─── Flag glows (globe mode) ───────────────────────────────
   With the globe as the hero, the two nations' colours stay but only as faint
   light at the edges: transparent, so the WebGL scene shows through, and kept
   off the centre so neither the globe nor the type has to fight them.
   ---------------------------------------------------------- */

function FlagGlows({ hostCode }: { hostCode: string | null }) {
    const [ind1, ind2] = INDIA_THEME.colors;
    const [host1] = countryTheme(hostCode).colors;
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
                background: [
                    `radial-gradient(40% 70% at -8% 20%, ${hexA(ind1, 0.28)} 0%, transparent 70%)`,
                    `radial-gradient(34% 60% at -4% 100%, ${hexA(ind2, 0.22)} 0%, transparent 70%)`,
                    `radial-gradient(38% 70% at 108% 50%, ${hexA(host1, 0.24)} 0%, transparent 70%)`,
                ].join(","),
            }}
        />
    );
}

/** Static stand-in for the globe: India's official outline, lit, on black. */
function GlobePoster() {
    return (
        <div className="absolute inset-0 bg-black">
            <div className="absolute right-[6%] top-1/2 aspect-square h-[78%] max-h-[640px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#1a1a1a,#050505_60%)] ring-1 ring-white/10 max-md:left-1/2 max-md:right-auto max-md:top-[30%] max-md:h-[44%] max-md:-translate-x-1/2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/geo/india-poster.svg" alt="" className="absolute left-1/2 top-1/2 h-[46%] -translate-x-1/2 -translate-y-1/2 opacity-80" />
            </div>
        </div>
    );
}

/** #RRGGBB + alpha -> rgba(), so flag hexes can be faded in a gradient. */
function hexA(hex: string, alpha: number): string {
    const h = hex.replace("#", "");
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/* ─── Host wordmark ─────────────────────────────────────────
   The host country's name in its own language, sitting behind the type. For
   Japan that is 日本; for a country with no distinct endonym it is the English
   name. Purely decorative, so it is hidden from assistive tech.
   ---------------------------------------------------------- */

function HostWordmark({ hostCode }: { hostCode: string | null }) {
    const word = countryWordmark(hostCode);
    if (!word) return null;

    // Count code points, not UTF-16 units, so 日本 measures as 2 and not 4.
    const len = [...word].length;

    // A very long name stops being a graphic and becomes unreadable clutter at
    // any size that would still fit, so it is simply not drawn.
    if (len > 14) return null;

    // Sized by length rather than a single ceiling: a 2-glyph script can fill
    // the fold, but "Brazil" at the same size overflows and gets clipped
    // mid-word, which reads as a rendering bug rather than a design.
    const fontSize =
        len <= 3
            ? "clamp(6rem, 20vw, 17rem)"
            : len <= 7
              ? "clamp(2.5rem, 8vw, 7rem)"
              : "clamp(2rem, 5.5vw, 4.75rem)";

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 hidden items-center justify-end overflow-hidden pr-10 font-black leading-none text-white/[0.10] sm:flex"
            style={{ fontSize, maxWidth: "62%" }}
        >
            <span className="whitespace-nowrap">{word}</span>
        </div>
    );
}

/* ─── Flag rule ─────────────────────────────────────────────
   A hairline along the bottom of the fold that runs India's colours into the
   host's — the two nations meeting, and a clean edge into the black page.
   ---------------------------------------------------------- */

function FlagRule({ hostCode }: { hostCode: string | null }) {
    const [ind1, ind2] = INDIA_THEME.colors;
    const [host1, host2] = countryTheme(hostCode).colors;
    return (
        <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-[4px]"
            style={{
                background: `linear-gradient(to right, ${ind1}, #ffffff 22%, ${ind2} 40%, ${host1} 68%, ${host2})`,
            }}
        />
    );
}

/* ─── Programme figures ─────────────────────────────────────
   Deliberately an inline credibility line, not three metric cards: the numbers
   support the story, they are not the headline.
   ---------------------------------------------------------- */

function StatLine({ delegations }: { delegations: Delegation[] }) {
    const { trips, athletes, countries } = useMemo(() => squadStats(delegations), [delegations]);

    const figures: [number, string][] = [
        [trips, trips === 1 ? "international trip" : "international trips"],
        [athletes, athletes === 1 ? "karateka sent" : "karateka sent"],
        [countries, countries === 1 ? "country" : "countries"],
    ];

    return (
        <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:gap-x-7">
            {figures.map(([value, label], i) => (
                <div key={label} className="flex items-baseline gap-2">
                    {i > 0 && (
                        <span aria-hidden="true" className="mr-3 hidden h-3 w-px bg-white/20 sm:block" />
                    )}
                    <dd className="text-xl font-black tabular-nums leading-none text-white">
                        {value}
                    </dd>
                    <dt className="text-sm font-semibold text-white/60">
                        {label}
                    </dt>
                </div>
            ))}
        </dl>
    );
}

/* ─── Trip facts ────────────────────────────────────────── */

function TripFacts({ delegation, className = "" }: { delegation: Delegation; className?: string }) {
    return (
        <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/75 ${className}`}>
            <span className="inline-flex items-center gap-1.5">
                <Plane className="h-3.5 w-3.5 text-primary-light" aria-hidden="true" />
                {delegation.hostCity ? `${delegation.hostCity}, ` : ""}
                {delegation.hostCountry}
            </span>
            <span aria-hidden="true" className="h-3 w-px bg-white/15" />
            <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary-light" aria-hidden="true" />
                {tripDates(delegation.startDate, delegation.endDate)}
            </span>
            <span aria-hidden="true" className="h-3 w-px bg-white/15" />
            <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary-light" aria-hidden="true" />
                {delegation.memberCount} representing India
            </span>
        </div>
    );
}

/* ─── Profile link ───────────────────────────────────────────
   Closes the loop with the public verification profile, which now carries the
   member's international record. Members without a membership number are not
   linkable, so they render as plain content rather than a dead link.
   ---------------------------------------------------------- */

function ProfileLink({
    membershipNumber,
    name,
    className = "",
    children,
}: {
    membershipNumber: string | null;
    name: string;
    className?: string;
    children: React.ReactNode;
}) {
    if (!membershipNumber) return <div className={className}>{children}</div>;
    return (
        <Link
            href={`/verify/${encodeURIComponent(membershipNumber)}`}
            aria-label={`View ${name}'s profile`}
            className={`${className} focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black`}
        >
            {children}
        </Link>
    );
}

/* ─── Portrait ───────────────────────────────────────────────
   One portrait treatment for everyone: the photo tilts toward the pointer like
   a print held in the hand. Rank is shown by composition (the leader's
   portrait is larger and stands apart), not by a different card skin.
   ---------------------------------------------------------- */

function Portrait({ member, eager = false }: { member: SquadMember; eager?: boolean }) {
    const { ref: tiltRef, handlers, style } = useTilt(7);
    const photo = getImageUrl(member.profilePhotoUrl || null);
    return (
        <motion.div
            ref={tiltRef as React.Ref<HTMLDivElement>}
            {...handlers}
            style={style}
            className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-surface"
        >
            {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={photo}
                    alt={`${member.name}, ${member.rankLabel}`}
                    loading={eager ? "eager" : "lazy"}
                    className="h-full w-full object-cover object-top grayscale-[0.35] transition-[filter,transform] duration-700 ease-out group-hover:scale-[1.03] group-hover:grayscale-0"
                />
            ) : (
                // A photo is mandatory to be added, so this is only reachable
                // if the member's photo was removed afterwards.
                <div className="flex h-full w-full items-center justify-center text-white/25">
                    <Globe2 className="h-10 w-10" aria-hidden="true" />
                </div>
            )}
            {/* Light catching the print's edge as it tilts. */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </motion.div>
    );
}

/* ─── Leader ─────────────────────────────────────────────────
   The head of delegation stands apart: a large portrait beside the copy.
   Gold is earned here — it marks the rank of the person who leads the team.
   ---------------------------------------------------------- */

function Leader({ member }: { member: SquadMember }) {
    const place = [member.city, member.state].filter(Boolean).join(", ");
    return (
        <Reveal kind="depth" className="grid items-end gap-8 md:grid-cols-[minmax(0,22rem)_1fr] md:gap-12">
            <ProfileLink membershipNumber={member.membershipNumber} name={member.name} className="block">
                <Portrait member={member} eager />
            </ProfileLink>
            <div className="pb-2">
                <p className="text-sm font-semibold text-secondary">Head of delegation</p>
                <h3 className="mt-3 text-balance text-[clamp(2rem,4.5vw,3.25rem)] font-black uppercase leading-[0.95] tracking-[-0.02em] text-white">
                    {member.name}
                </h3>
                <p className="mt-3 text-lg font-bold text-white/85">
                    {member.rankLabel}
                    {member.title && <span className="font-semibold text-white/60"> · {member.title}</span>}
                </p>
                <p className="mt-5 max-w-[56ch] text-pretty leading-relaxed text-white/75">{member.bio}</p>
                {(member.dojo || place) && (
                    <p className="mt-4 flex items-start gap-1.5 text-sm text-white/60">
                        <MapPin className="mt-[3px] h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{member.dojo || place}</span>
                    </p>
                )}
            </div>
        </Reveal>
    );
}

/* ─── Member ────────────────────────────────────────────────
   Portrait with the name set beneath it, not printed over a gradient: the
   line-up reads like a team sheet.
   ---------------------------------------------------------- */

function Member({ member, index }: { member: SquadMember; index: number }) {
    const place = [member.city, member.state].filter(Boolean).join(", ");
    return (
        <Reveal as="li" kind="depth" delay={Math.min(index * 0.05, 0.3)}>
            <ProfileLink membershipNumber={member.membershipNumber} name={member.name} className="group block">
                <Portrait member={member} />
                <div className="mt-4">
                    <p className="text-sm font-semibold text-white/60">
                        {member.squadRole === "COACH" ? "Coach · " : ""}
                        {member.rankLabel}
                    </p>
                    <h3 className="mt-1 text-lg font-extrabold leading-tight text-white transition-colors group-hover:text-primary-light">
                        {member.name}
                    </h3>
                    {member.title && <p className="mt-1 text-sm font-semibold text-white/75">{member.title}</p>}
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/65">{member.bio}</p>
                    {/* The generated bio usually names the dojo already; don't say it twice. */}
                    {(member.dojo || place) && !member.bio.includes(member.dojo || place) && (
                        <p className="mt-2 flex items-start gap-1.5 text-sm text-white/55">
                            <MapPin className="mt-[3px] h-3 w-3 shrink-0" aria-hidden="true" />
                            <span className="line-clamp-1">{member.dojo || place}</span>
                        </p>
                    )}
                </div>
            </ProfileLink>
        </Reveal>
    );
}

/** The line-up, in rank order. */
function LineUp({ members }: { members: SquadMember[] }) {
    return (
        <ul className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 sm:gap-x-6 xl:grid-cols-4">
            {members.map((m, i) => (
                <Member key={m.id} member={m} index={i} />
            ))}
        </ul>
    );
}

/* ─── Squad ─────────────────────────────────────────────── */

function Squad({ delegation }: { delegation: Delegation }) {
    const { leaders, coaches, bands } = useMemo(
        () => groupSquad(delegation.members),
        [delegation.members],
    );

    const groupCount = bands.length + (coaches.length > 0 ? 1 : 0);
    const sparse = groupCount > 2 && (coaches.length + bands.reduce((n, b) => n + b.members.length, 0)) / groupCount < 2;

    if (delegation.members.length === 0) {
        return (
            <p className="border-y border-white/10 py-8 text-center text-white/70">
                The squad for this trip has not been announced yet.
            </p>
        );
    }

    return (
        <div className="space-y-20">
            {leaders.map((m) => (
                <Leader key={m.id} member={m} />
            ))}

            {/* A ledger by rank: the grade sits in its own column, pinned while its
                line-up scrolls past, so small bands don't leave rows of dead space. */}
            <div className="divide-y divide-white/10 border-y border-white/10">
                {sparse ? (
                    // Mostly one-person grades: a single line-up in rank order reads
                    // better than a ladder of near-empty rows. Each portrait carries its rank.
                    <Band label="The squad" count={coaches.length + bands.reduce((n, b) => n + b.members.length, 0)} members={[...coaches, ...bands.flatMap((b) => b.members)]} />
                ) : (
                <>
                {coaches.length > 0 && (
                    <Band
                        label={coaches.length === 1 ? "Coach" : "Coaching staff"}
                        count={coaches.length > 1 ? coaches.length : undefined}
                        members={coaches}
                    />
                )}
                {bands.map((band) => (
                    <Band key={`${band.label}-${band.members[0]?.id}`} label={band.label} count={band.members.length} members={band.members} />
                ))}
                </>
                )}
            </div>
        </div>
    );
}

function Band({ label, count, members }: { label: string; count?: number; members: SquadMember[] }) {
    return (
        <section className="grid gap-6 py-12 md:grid-cols-[11rem_1fr] md:gap-10 lg:grid-cols-[14rem_1fr]">
            <div>
                <div className="md:sticky md:top-32">
                    <h2 className="text-2xl font-extrabold text-white md:text-3xl">{label}</h2>
                    {count !== undefined && (
                        <p className="mt-1 text-sm font-semibold tabular-nums text-white/55">
                            {count} karateka
                        </p>
                    )}
                </div>
            </div>
            <LineUp members={members} />
        </section>
    );
}

function BandHeading({ label, count }: { label: string; count?: number }) {
    return (
        <div className="mb-8 flex items-baseline gap-4 border-b border-white/10 pb-4">
            <h2 className="text-2xl font-extrabold text-white md:text-3xl">{label}</h2>
            {count !== undefined && (
                <span className="text-lg font-semibold tabular-nums text-white/50">{count}</span>
            )}
        </div>
    );
}

/* ─── Archive ───────────────────────────────────────────────
   A flat roster list, not accordions-of-card-grids: each past trip is one row
   with a strip of the faces that travelled, expanding to the full squad.
   ---------------------------------------------------------- */

function AvatarStrip({ members }: { members: SquadMember[] }) {
    const shown = members.slice(0, 6);
    const extra = members.length - shown.length;

    return (
        <div className="flex items-center">
            <div className="flex -space-x-2">
                {shown.map((m) => {
                    const photo = getImageUrl(m.profilePhotoUrl || null);
                    return (
                        <span
                            key={m.id}
                            title={m.name}
                            className="inline-block h-8 w-8 overflow-hidden rounded-full border border-black bg-surface-active ring-1 ring-white/10"
                        >
                            {photo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={photo} alt="" loading="lazy" className="h-full w-full object-cover object-top" />
                            ) : null}
                        </span>
                    );
                })}
            </div>
            {extra > 0 && (
                <span className="ml-2 text-sm font-semibold tabular-nums text-white/60">+{extra}</span>
            )}
        </div>
    );
}

function ArchiveRow({ delegation }: { delegation: Delegation }) {
    const [open, setOpen] = useState(false);

    return (
        <li>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="flex min-h-16 w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:bg-white/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg font-bold text-white">
                        {delegation.tournamentName}
                    </span>
                    <span className="mt-1 flex items-center gap-2 text-sm text-white/65">
                        <Flag code={delegation.hostCountryCode} w={18} />
                        <span className="truncate">
                            {delegation.hostCountry} · {tripDates(delegation.startDate, delegation.endDate)} ·{" "}
                            {delegation.memberCount} representing India
                        </span>
                    </span>
                </span>
                <span className="hidden shrink-0 sm:block">
                    <AvatarStrip members={delegation.members} />
                </span>
                <ChevronDown
                    aria-hidden="true"
                    className={`h-5 w-5 shrink-0 text-white/60 transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>
            {open && (
                <div className="pb-14 pt-6">
                    <Squad delegation={delegation} />
                </div>
            )}
        </li>
    );
}

/* ─── Empty state ───────────────────────────────────────────
   The live state until the first trip is published, so it is designed rather
   than apologised for, and it always offers somewhere to go next.
   ---------------------------------------------------------- */

function EmptyState() {
    // Shown inside the hero, so nobody has to scroll past a globe to learn there is no trip.
    return (
        <div className="mt-8 max-w-xl border-t border-white/15 pt-6">
            <h2 className="text-2xl font-extrabold text-white">No international trip announced yet.</h2>
            <p className="mt-3 max-w-[50ch] text-pretty leading-relaxed text-white/75">
                When a federation abroad invites KKFI to compete, the travelling squad, and every
                karateka in it, will be published here.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <BrandLink href="/events">Upcoming events</BrandLink>
                <BrandLink href="/find-a-dojo" variant="outline">Find a dojo</BrandLink>
            </div>
        </div>
    );
}

/* ─── Page ──────────────────────────────────────────────── */

export default function TeamIndiaPage() {
    const [delegations, setDelegations] = useState<Delegation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

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
    const hostCode = current?.hostCountryCode ?? null;
    const hostCountry = findCountry(hostCode);
    // An admin's cover image is a deliberate art-directed choice, so it takes
    // the hero; the globe then moves to its own band below.
    const cover = current?.coverImageUrl ?? null;
    const sceneProps = useMemo(() => ({ hostCode: isCountryCode(hostCode) ? hostCode : null }), [hostCode]);

    const globe = (
        <SceneSlot scene="globe" sceneProps={sceneProps} className="absolute inset-0" fallback={<GlobePoster />} />
    );

    const heroCopy = (
        <>
            {/* The one kicker on the page: the journey itself, in flags. */}
            <p className="mb-6 flex flex-wrap items-center gap-3 text-sm font-semibold text-white/80">
                <span className="flex items-center gap-2">
                    <Flag code="IN" w={28} /> India
                </span>
                {current && hostCountry && (
                    <>
                        <Plane className="h-4 w-4 text-primary-light" aria-hidden="true" />
                        <span className="flex items-center gap-2">
                            <Flag code={hostCountry.code} w={28} /> {hostCountry.name}
                        </span>
                    </>
                )}
            </p>

            <h1 className="text-[clamp(3rem,9vw,6rem)] font-black uppercase leading-[0.9] tracking-[-0.035em] text-white">
                Team<br />India<span className="text-primary">.</span>
            </h1>

            <p className="mt-6 max-w-[44ch] text-pretty text-lg leading-relaxed text-white/80">
                When a federation abroad invites us to their tournament, these are the karateka who
                travel to represent India on the international floor.
            </p>

            {current && (
                <div className="mt-8 max-w-xl border-t border-white/15 pt-6">
                    <h2 className="text-balance text-[clamp(1.35rem,2.6vw,2rem)] font-extrabold uppercase leading-[1.02] tracking-[-0.01em] text-white">
                        {current.tournamentName}
                    </h2>
                    <TripFacts delegation={current} className="mt-4" />
                </div>
            )}

            {delegations.length > 0 && (
                <div className="mt-7">
                    <StatLine delegations={delegations} />
                </div>
            )}

            {!isLoading && !loadError && !current && <EmptyState />}
        </>
    );

    return (
        // Transparent so the globe shows through from the canvas behind <main>.
        <div className="min-h-screen text-white">
            {/* ── Hero ── */}
            {cover ? (
                <section data-bleed className="relative isolate flex min-h-[78svh] items-end overflow-hidden pb-16 pt-40">
                    <HeroBackdrop cover={cover} hostCode={hostCode} />
                    <HostWordmark hostCode={hostCode} />
                    <div className="relative mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">{heroCopy}</div>
                    <FlagRule hostCode={hostCode} />
                </section>
            ) : (
                <section data-bleed className="relative isolate flex min-h-[100svh] overflow-hidden">
                    {/* Phones: the globe gets the top band and the copy sits beneath it. */}
                    <div className="absolute inset-x-0 top-0 h-[52svh] md:inset-0 md:h-auto">{globe}</div>
                    <FlagGlows hostCode={hostCode} />
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,black_40%,transparent_60%)] md:bg-[linear-gradient(to_right,rgba(0,0,0,0.85),rgba(0,0,0,0.35)_45%,transparent_65%)]" />
                    <div className="relative mx-auto flex w-full max-w-[1400px] flex-col justify-end px-4 pb-20 pt-[46svh] sm:px-6 md:justify-center md:pb-16 md:pt-40 lg:px-8">
                        {heroCopy}
                    </div>
                    {current && <FlagRule hostCode={hostCode} />}
                </section>
            )}

            {/* With a cover image in the hero, the journey gets its own band. */}
            {cover && (
                <section className="relative h-[70svh] overflow-hidden" aria-label={`From India to ${hostCountry?.name ?? "the host country"}`}>
                    {globe}
                </section>
            )}

            {/* ── Body ── (nothing to show below the hero when no trip is published) */}
            {(isLoading || loadError || current) && (
            <Section rhythm="base" width="wide" className="bg-black">
                {isLoading ? (
                    <div className="py-24">
                        <KarateLoader />
                    </div>
                ) : loadError ? (
                    <div className="border-y border-white/10 py-20 text-center">
                        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-secondary" aria-hidden="true" />
                        <p className="text-lg font-bold text-white">Couldn&apos;t load Team India</p>
                        <p className="mx-auto mt-2 max-w-[42ch] text-white/70">
                            The server didn&apos;t respond. It may be waking up — this usually takes a few
                            seconds.
                        </p>
                        <button
                            type="button"
                            onClick={fetchDelegations}
                            className="mt-6 inline-flex min-h-12 items-center gap-2 bg-primary px-7 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                        >
                            <RefreshCw className="h-4 w-4" aria-hidden="true" />
                            Try again
                        </button>
                    </div>
                ) : !current ? null : (
                    <>
                        {current.summary && (
                            <Reveal>
                                <p className="mb-16 max-w-[62ch] text-pretty text-xl leading-relaxed text-white/80">
                                    {current.summary}
                                </p>
                            </Reveal>
                        )}

                        <Squad delegation={current} />

                        {archive.length > 0 && (
                            <section className="mt-32">
                                <BandHeading label="Previous delegations" count={archive.length} />
                                <ul className="divide-y divide-white/10 border-b border-white/10">
                                    {archive.map((d) => (
                                        <ArchiveRow key={d.id} delegation={d} />
                                    ))}
                                </ul>
                            </section>
                        )}
                    </>
                )}
            </Section>
            )}
        </div>
    );
}
