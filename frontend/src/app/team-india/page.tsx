"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin, Plane, Calendar, AlertTriangle, RefreshCw, Globe2, ChevronDown, Users } from "lucide-react";
import api from "@/lib/api";
import KarateLoader from "@/components/KarateLoader";
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
                    <dd className="text-[17px] font-black tabular-nums leading-none text-white">
                        {value}
                    </dd>
                    <dt className="text-[10px] font-bold uppercase tracking-[2px] text-zinc-400">
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
        <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-zinc-300 ${className}`}>
            <span className="inline-flex items-center gap-1.5">
                <Plane className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
                {delegation.hostCity ? `${delegation.hostCity}, ` : ""}
                {delegation.hostCountry}
            </span>
            <span aria-hidden="true" className="h-3 w-px bg-white/15" />
            <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
                {tripDates(delegation.startDate, delegation.endDate)}
            </span>
            <span aria-hidden="true" className="h-3 w-px bg-white/15" />
            <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
                {delegation.memberCount} representing India
            </span>
        </div>
    );
}

/* ─── Leader (feature card) ─────────────────────────────────
   The head of delegation gets a different composition, not just a gold border:
   a wide landscape card with the portrait beside the copy. Breaking the grid is
   what communicates rank.
   ---------------------------------------------------------- */

function LeaderCard({ member }: { member: SquadMember }) {
    const reduceMotion = useReducedMotion();
    const photo = getImageUrl(member.profilePhotoUrl || null);
    const place = [member.city, member.state].filter(Boolean).join(", ");

    return (
        <motion.article
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            // Capped rather than full-bleed: the auto-generated bio is a single
            // line, so a 1150px-wide card left a dead zone to the right of it.
            className="group relative max-w-3xl overflow-hidden rounded-2xl border border-[#FFD700]/25 bg-white/[0.03] transition-colors hover:border-[#FFD700]/50"
        >
            <div className="flex flex-col sm:flex-row">
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-900 sm:aspect-auto sm:w-[40%] sm:min-h-[280px]">
                    {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={photo}
                            alt={`${member.name}, ${member.rankLabel}`}
                            loading="lazy"
                            className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-700">
                            <Globe2 className="h-10 w-10" aria-hidden="true" />
                        </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 to-transparent sm:bg-gradient-to-r" />
                </div>

                <div className="flex flex-1 flex-col justify-center gap-2 p-5 sm:p-6">
                    <span className="inline-flex w-fit items-center rounded bg-[#FFD700] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[2px] text-black">
                        Head of Delegation
                    </span>
                    {member.title && (
                        <span className="text-[11px] font-extrabold uppercase tracking-[3px] text-red-500">
                            {member.title}
                        </span>
                    )}
                    <h3
                        className="text-[22px] font-black leading-[1.1] text-white sm:text-[26px]"
                        style={{ textWrap: "balance" }}
                    >
                        {member.name}
                    </h3>
                    <span className="text-[13px] font-semibold text-[#FFD700]">{member.rankLabel}</span>
                    <p className="max-w-[60ch] text-[13px] leading-relaxed text-zinc-300">{member.bio}</p>
                    {(member.dojo || place) && (
                        <p className="mt-1 flex items-start gap-1.5 text-[11px] text-zinc-400">
                            <MapPin className="mt-[2px] h-3 w-3 shrink-0" aria-hidden="true" />
                            <span>{member.dojo || place}</span>
                        </p>
                    )}
                </div>
            </div>
        </motion.article>
    );
}

/* ─── Member card ───────────────────────────────────────── */

function MemberCard({ member, index }: { member: SquadMember; index: number }) {
    const reduceMotion = useReducedMotion();
    const photo = getImageUrl(member.profilePhotoUrl || null);
    const place = [member.city, member.state].filter(Boolean).join(", ");

    return (
        <motion.article
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] transition-colors hover:border-red-600/40"
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
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />

                {member.squadRole === "COACH" && (
                    <span className="absolute left-3 top-3 rounded bg-white/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[2px] text-white backdrop-blur-sm">
                        Coach
                    </span>
                )}

                <div className="absolute inset-x-0 bottom-0 p-4">
                    {member.title && (
                        <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-[3px] text-red-500">
                            {member.title}
                        </span>
                    )}
                    <h3 className="text-[16px] font-black leading-tight text-white">{member.name}</h3>
                    <span className="mt-1 inline-flex items-center rounded border border-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[1.5px] text-zinc-200">
                        {member.rankLabel}
                    </span>
                </div>
            </div>

            <div className="p-4">
                <p className="line-clamp-2 text-[12px] leading-relaxed text-zinc-300">{member.bio}</p>
                {(member.dojo || place) && (
                    <p className="mt-2 flex items-start gap-1.5 text-[11px] text-zinc-400">
                        <MapPin className="mt-[2px] h-3 w-3 shrink-0" aria-hidden="true" />
                        <span className="line-clamp-1">{member.dojo || place}</span>
                    </p>
                )}
            </div>
        </motion.article>
    );
}

/* ─── Squad ─────────────────────────────────────────────── */

function Squad({ delegation }: { delegation: Delegation }) {
    const { leaders, coaches, bands } = useMemo(
        () => groupSquad(delegation.members),
        [delegation.members],
    );

    if (delegation.members.length === 0) {
        return (
            <p className="border-y border-white/[0.07] py-6 text-center text-sm text-zinc-400">
                The squad for this trip has not been announced yet.
            </p>
        );
    }

    return (
        <div className="space-y-12">
            {/* Full width rather than a cell in the grid: the leader's card is
                landscape, and a 2-of-4 span left half a row empty. */}
            {leaders.map((m) => (
                <LeaderCard key={m.id} member={m} />
            ))}

            {coaches.length > 0 && (
                <section>
                    <BandHeading
                        label={coaches.length === 1 ? "Coach" : "Coaching staff"}
                        count={coaches.length > 1 ? coaches.length : undefined}
                    />
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {coaches.map((m, i) => (
                            <MemberCard key={m.id} member={m} index={i} />
                        ))}
                    </div>
                </section>
            )}

            {bands.map((band) => (
                <section key={`${band.label}-${band.members[0]?.id}`}>
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

function BandHeading({ label, count }: { label: string; count?: number }) {
    return (
        <div className="mb-5 flex items-center gap-3">
            <div className="h-5 w-[3px] rounded-full bg-red-600" />
            <h2 className="text-base font-black uppercase tracking-tight text-white">{label}</h2>
            {count !== undefined && (
                <span className="text-[12px] font-semibold tabular-nums text-zinc-400">{count}</span>
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
                            className="inline-block h-7 w-7 overflow-hidden rounded-full border border-black bg-zinc-800 ring-1 ring-white/10"
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
                <span className="ml-2 text-[11px] font-semibold tabular-nums text-zinc-400">+{extra}</span>
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
                className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:bg-white/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold text-white">
                        {delegation.tournamentName}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
                        <Flag code={delegation.hostCountryCode} w={16} />
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
                    className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>
            {open && (
                <div className="pb-8 pt-2">
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
    return (
        <div className="border-y border-white/[0.07] py-20 text-center">
            <Plane className="mx-auto mb-4 h-9 w-9 text-red-600/70" aria-hidden="true" />
            <p className="text-[17px] font-black uppercase tracking-tight text-white">
                No international trip announced yet
            </p>
            <p className="mx-auto mt-2 max-w-[46ch] text-[13px] leading-relaxed text-zinc-400">
                When a federation abroad invites KKFI to compete, the travelling squad — and every
                karateka in it — will be published here.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link
                    href="/events"
                    className="inline-flex h-11 items-center px-6 text-[12px] font-bold uppercase tracking-[1.5px] text-white transition-colors bg-red-600 hover:bg-[#8B0000] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                    Upcoming events
                </Link>
                <Link
                    href="/find-a-dojo"
                    className="inline-flex h-11 items-center border border-white/20 px-6 text-[12px] font-bold uppercase tracking-[1.5px] text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                    Find a dojo
                </Link>
            </div>
        </div>
    );
}

/* ─── Page ──────────────────────────────────────────────── */

export default function TeamIndiaPage() {
    const reduceMotion = useReducedMotion();
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

    // `animate` is unconditional on purpose. useReducedMotion() reports false
    // on the first render and can flip to true straight after; if the reduced
    // branch dropped `animate` entirely, framer had already applied
    // `opacity: 0` and nothing was left to bring the type back — the hero
    // heading stayed invisible for exactly the users who need it most.
    const rise = {
        initial: reduceMotion ? false : ({ opacity: 0, y: 18 } as const),
        animate: { opacity: 1, y: 0 },
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* ── Hero ──
                Full height once there is a trip to dramatise; with nothing
                published it collapses to the height of its own type rather
                than leaving a viewport of dead black. */}
            <section
                className={`relative isolate flex items-end overflow-hidden pb-12 pt-32 sm:pb-16 ${
                    current ? "min-h-[70vh] sm:min-h-[76vh]" : ""
                }`}
            >
                <HeroBackdrop cover={current?.coverImageUrl ?? null} hostCode={hostCode} />
                {current && !current.coverImageUrl && <HostWordmark hostCode={hostCode} />}

                <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                    <motion.span
                        {...rise}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="mb-3 block text-[11px] font-extrabold uppercase tracking-[4px] text-red-500"
                    >
                        Kyokushin Karate Foundation of India
                    </motion.span>

                    <motion.h1
                        {...rise}
                        transition={{ duration: 0.6, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
                        className="font-black uppercase leading-[0.9]"
                        style={{
                            fontSize: "clamp(2.5rem, 9vw, 5rem)",
                            letterSpacing: "-0.03em",
                            textWrap: "balance",
                        }}
                    >
                        <span className="text-white">Team </span>
                        <span className="text-[#FF0000]">India</span>
                    </motion.h1>

                    <motion.p
                        {...rise}
                        transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                        className="mt-4 max-w-[58ch] text-[14px] leading-relaxed text-zinc-300 sm:text-[15px]"
                    >
                        When a federation abroad invites us to their tournament, these are the karateka
                        who travel to represent India on the international floor.
                    </motion.p>

                    {current && (
                        <motion.div
                            {...rise}
                            transition={{ duration: 0.6, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
                            className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3"
                        >
                            <span className="flex items-center gap-2.5">
                                <Flag code="IN" />
                                <span className="text-[14px] font-black uppercase tracking-[0.13em] text-white">
                                    India
                                </span>
                            </span>
                            {hostCountry && (
                                <>
                                    <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-300">
                                        travels to
                                    </span>
                                    <span className="flex items-center gap-2.5">
                                        <Flag code={hostCountry.code} />
                                        <span className="text-[14px] font-black uppercase tracking-[0.13em] text-white">
                                            {hostCountry.name}
                                        </span>
                                    </span>
                                </>
                            )}
                        </motion.div>
                    )}

                    {current && (
                        <motion.div
                            {...rise}
                            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="mt-7"
                        >
                            <h2
                                className="font-black uppercase leading-[0.98] text-white"
                                style={{
                                    fontSize: "clamp(1.4rem, 3.2vw, 2.3rem)",
                                    letterSpacing: "-0.02em",
                                    textWrap: "balance",
                                }}
                            >
                                {current.tournamentName}
                            </h2>
                            <TripFacts delegation={current} className="mt-3" />
                        </motion.div>
                    )}

                    {delegations.length > 0 && (
                        <motion.div
                            {...rise}
                            transition={{ duration: 0.6, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
                            className="mt-8 border-t border-white/[0.12] pt-5"
                        >
                            <StatLine delegations={delegations} />
                        </motion.div>
                    )}
                </div>

                {current && <FlagRule hostCode={hostCode} />}
            </section>

            {/* ── Body ── */}
            <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
                {isLoading ? (
                    <div className="py-24">
                        <KarateLoader />
                    </div>
                ) : loadError ? (
                    <div className="border-y border-white/[0.07] py-20 text-center">
                        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-400" aria-hidden="true" />
                        <p className="text-[16px] font-bold text-zinc-100">Couldn&apos;t load Team India</p>
                        <p className="mx-auto mt-1 max-w-[42ch] text-[13px] text-zinc-400">
                            The server didn&apos;t respond. It may be waking up — this usually takes a few
                            seconds.
                        </p>
                        <button
                            type="button"
                            onClick={fetchDelegations}
                            className="mt-6 inline-flex h-11 items-center gap-2 bg-red-600 px-6 text-[12px] font-bold uppercase tracking-[1.5px] text-white transition-colors hover:bg-[#8B0000] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                        >
                            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                            Try again
                        </button>
                    </div>
                ) : !current ? (
                    <EmptyState />
                ) : (
                    <>
                        {/* Current trip. The tournament name and facts are the
                            hero's subject, so this section carries the prose
                            and the squad only. */}
                        <section className="pt-14">
                            {current.summary && (
                                <p
                                    className="mt-3 max-w-[68ch] text-[14px] leading-relaxed text-zinc-300"
                                    style={{ textWrap: "pretty" }}
                                >
                                    {current.summary}
                                </p>
                            )}

                            <div className="mt-10">
                                <Squad delegation={current} />
                            </div>
                        </section>

                        {/* Archive */}
                        {archive.length > 0 && (
                            <section className="mt-24">
                                <BandHeading label="Previous delegations" count={archive.length} />
                                <ul className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
                                    {archive.map((d) => (
                                        <ArchiveRow key={d.id} delegation={d} />
                                    ))}
                                </ul>
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
