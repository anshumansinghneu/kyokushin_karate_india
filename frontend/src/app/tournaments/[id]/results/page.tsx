"use client";

import { useState, useEffect, useMemo } from "react";
import SceneSlot from "@/components/three/SceneSlot";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Share2, FileCheck } from "lucide-react";
import Link from "next/link";
import Reveal from "@/components/brand/Reveal";
import BrandLink from "@/components/brand/BrandLink";
import { formatDateOnly } from "@/lib/dateOnly";
import { useToast } from "@/contexts/ToastContext";
import axios from "axios";
import { downloadCertificate, downloadAllCertificates } from "@/lib/certificateGenerator";

import { API_URL } from '@/lib/config';

import KarateLoader from '@/components/KarateLoader';
interface Winner {
    id: string;
    name: string;
    dojoName: string;
    beltRank: string;
}

interface CategoryWinner {
    categoryName: string;
    bracketId: string;
    status: string;
    firstPlace: Winner | null;
    secondPlace: Winner | null;
    thirdPlace: Winner | null;
}

interface DojoStats {
    dojoName: string;
    gold: number;
    silver: number;
    bronze: number;
    total: number;
}

interface Statistics {
    tournament: {
        id: string;
        name: string;
        date: string;
        location: string;
        totalParticipants: number;
        totalCategories: number;
        completedMatches: number;
        totalMatches: number;
    };
    categoryWinners: CategoryWinner[];
    dojoLeaderboard: DojoStats[];
    performanceStats: {
        fastestWin: {
            duration: number;
            winner: { id: string; name: string; dojoName: string };
        } | null;
        highestScore: {
            score: number;
            winner: { id: string; name: string; dojoName: string };
        } | null;
        mostDominant: {
            scoreDifference: number;
            finalScore: string;
            winner: { id: string; name: string; dojoName: string };
        } | null;
    };
}

export default function TournamentResultsPage() {
    const { id } = useParams();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [statistics, setStatistics] = useState<Statistics | null>(null);

    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                const response = await axios.get(`${API_URL}/tournaments/${id}/statistics`);
                setStatistics(response.data.data);
            } catch (error) {
                console.error("Failed to fetch statistics:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchStatistics();
    }, [id]);

    // Names for the 3D podium: the top three dojos when the board has them,
    // otherwise the first category's medallists; unlabelled when nothing is scored.
    const podiumProps = useMemo(() => {
        if (!statistics) return {};
        const dojos = statistics.dojoLeaderboard.slice(0, 3);
        if (dojos.length >= 3) return { names: dojos.map((d) => d.dojoName) };
        const cat = statistics.categoryWinners.find((c) => c.firstPlace);
        if (cat) return { names: [cat.firstPlace?.name, cat.secondPlace?.name, cat.thirdPlace?.name] };
        return {};
    }, [statistics]);

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${statistics?.tournament.name} - Results`,
                    text: 'Check out the tournament results!',
                    url: url
                });
            } catch {
                // User cancelled
            }
        } else {
            navigator.clipboard.writeText(url);
            showToast('Link copied to clipboard!', 'success');
        }
    };

    const handleDownloadCertificate = (winner: Winner, position: number, categoryName: string) => {
        if (!statistics) return;

        downloadCertificate({
            participantName: winner.name,
            categoryName: categoryName,
            position: position,
            tournamentName: statistics.tournament.name,
            date: statistics.tournament.date,
            location: statistics.tournament.location,
            dojoName: winner.dojoName
        });
    };

    const handleDownloadAllCertificates = async () => {
        if (!statistics) return;

        const certificates = statistics.categoryWinners.flatMap(category => {
            const certs = [];

            if (category.firstPlace) {
                certs.push({
                    participantName: category.firstPlace.name,
                    categoryName: category.categoryName,
                    position: 1,
                    tournamentName: statistics.tournament.name,
                    date: statistics.tournament.date,
                    location: statistics.tournament.location,
                    dojoName: category.firstPlace.dojoName
                });
            }

            if (category.secondPlace) {
                certs.push({
                    participantName: category.secondPlace.name,
                    categoryName: category.categoryName,
                    position: 2,
                    tournamentName: statistics.tournament.name,
                    date: statistics.tournament.date,
                    location: statistics.tournament.location,
                    dojoName: category.secondPlace.dojoName
                });
            }

            if (category.thirdPlace) {
                certs.push({
                    participantName: category.thirdPlace.name,
                    categoryName: category.categoryName,
                    position: 3,
                    tournamentName: statistics.tournament.name,
                    date: statistics.tournament.date,
                    location: statistics.tournament.location,
                    dojoName: category.thirdPlace.dojoName
                });
            }

            return certs;
        });

        await downloadAllCertificates(certificates);
    };

    if (loading) {
        return (
            <div className="min-h-[70dvh] bg-black flex items-center justify-center">
                <KarateLoader label="Loading results" />
            </div>
        );
    }

    if (!statistics) {
        return (
            <div className="mx-auto flex min-h-[70dvh] max-w-xl flex-col items-start justify-center gap-6 px-4 text-white sm:px-6">
                <h1 className="text-3xl font-black uppercase tracking-[-0.02em]">Results not available yet<span className="text-primary">.</span></h1>
                <p className="leading-relaxed text-white/70">Tournament results are published after the final match.</p>
                <div className="flex flex-wrap gap-3">
                    <BrandLink href={`/tournaments/${id}/view`} variant="outline">See the brackets</BrandLink>
                    <BrandLink href="/events" variant="outline">All events</BrandLink>
                </div>
            </div>
        );
    }

    const { tournament, categoryWinners, dojoLeaderboard, performanceStats } = statistics;
    const podium = dojoLeaderboard.slice(0, 3);
    const highlights = [
        performanceStats.fastestWin && { label: "Fastest win", value: `${performanceStats.fastestWin.duration} min`, who: performanceStats.fastestWin.winner },
        performanceStats.highestScore && { label: "Highest score", value: `${performanceStats.highestScore.score} pts`, who: performanceStats.highestScore.winner },
        performanceStats.mostDominant && { label: "Most dominant", value: performanceStats.mostDominant.finalScore, who: performanceStats.mostDominant.winner },
    ].filter(Boolean) as { label: string; value: string; who: { name: string; dojoName: string } }[];

    const hasResults = categoryWinners.some((c) => c.firstPlace || c.secondPlace || c.thirdPlace) || dojoLeaderboard.length > 0;

    const places: { key: "firstPlace" | "secondPlace" | "thirdPlace"; n: 1 | 2 | 3; label: string }[] = [
        { key: "firstPlace", n: 1, label: "1st" },
        { key: "secondPlace", n: 2, label: "2nd" },
        { key: "thirdPlace", n: 3, label: "3rd" },
    ];

    return (
        // Transparent at the top: the podium scene shows through from the canvas behind <main>.
        <div className="min-h-dvh text-white">
            <header data-bleed className="relative flex min-h-[88svh] overflow-hidden md:min-h-[80svh]">
                <SceneSlot
                    scene="podium"
                    sceneProps={podiumProps}
                    className="absolute inset-x-0 top-0 h-[42svh] md:inset-0 md:h-auto"
                    fallback={<div className="absolute inset-0 bg-black bg-[radial-gradient(ellipse_at_72%_55%,rgba(212,160,23,0.16),transparent_55%)]" />}
                />
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,black_50%,transparent_68%)] md:bg-gradient-to-r md:from-black/90 md:via-black/40 md:via-45% md:to-transparent" />
                <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col justify-end px-4 pb-12 pt-[38svh] sm:px-6 md:justify-center md:pb-14 md:pt-40 lg:px-8">
                <Link href={`/tournaments/${id}/view`} className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Brackets
                </Link>
                <p className="mt-8 text-sm font-semibold text-secondary">Results</p>
                <h1 className="mt-3 max-w-[15ch] text-balance text-[clamp(2.25rem,4.6vw,3.5rem)] font-black uppercase leading-[0.95] tracking-[-0.03em]">
                    {tournament.name}
                </h1>
                <p className="mt-6 max-w-[48ch] text-pretty text-lg leading-relaxed text-white/80">
                    {tournament.date && <>{formatDateOnly(tournament.date, { day: "numeric", month: "long", year: "numeric" }, "en-IN")}{tournament.location ? `, ${tournament.location}` : ""}. </>}
                    {hasResults ? (
                        <>
                    <span className="tabular-nums">{tournament.totalParticipants}</span> fighters across{" "}
                    <span className="tabular-nums">{tournament.totalCategories}</span> categories,{" "}
                    <span className="tabular-nums">{tournament.completedMatches}</span> of <span className="tabular-nums">{tournament.totalMatches}</span> matches fought,{" "}
                    <span className="tabular-nums">{dojoLeaderboard.length}</span> dojos on the board.
                        </>
                    ) : (
                        <>No scored matches have been recorded for this event.</>
                    )}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                    {hasResults && (
                    <button
                        onClick={handleDownloadAllCertificates}
                        className="inline-flex min-h-12 items-center gap-2 bg-primary px-6 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    >
                        <Download className="h-4 w-4" aria-hidden="true" /> All certificates
                    </button>
                    )}
                    <button onClick={handleShare} className="inline-flex min-h-12 items-center gap-2 border border-white/25 px-5 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white/60 hover:bg-white/10">
                        <Share2 className="h-4 w-4" aria-hidden="true" /> Share
                    </button>
                </div>
                </div>
            </header>

            <div className="bg-black pt-4">

            {!hasResults ? (
                <div className="mx-auto max-w-[1400px] px-4 pb-24 sm:px-6 lg:px-8">
                    <div className="border-y border-white/10 py-16">
                        <p className="text-2xl font-extrabold">No results to show.</p>
                        <p className="mt-3 max-w-[46ch] leading-relaxed text-white/70">Champions, medal standings and certificates appear here once matches are scored.</p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <BrandLink href={`/events/${id}`} variant="outline">Event details</BrandLink>
                            <BrandLink href="/events" variant="outline">All events</BrandLink>
                        </div>
                    </div>
                </div>
            ) : (
            <div className="mx-auto max-w-[1400px] space-y-20 px-4 pb-24 sm:px-6 lg:px-8">
                {/* Dojo podium: gold for first, the rest in plain white weights. */}
                {podium.length >= 3 && (
                    <section aria-labelledby="podium-heading">
                        <h2 id="podium-heading" className="mb-10 text-2xl font-extrabold md:text-3xl">Top dojos</h2>
                        <ol className="mx-auto grid max-w-3xl grid-cols-3 items-end gap-3 sm:gap-5">
                            {[1, 0, 2].map((i) => {
                                const d = podium[i];
                                const first = i === 0;
                                const height = first ? "h-44 sm:h-56" : i === 1 ? "h-36 sm:h-44" : "h-28 sm:h-36";
                                return (
                                    <li key={d.dojoName} className="flex flex-col items-center text-center">
                                        <p className={`mb-3 line-clamp-2 text-sm font-bold sm:text-base ${first ? "text-white" : "text-white/80"}`}>{d.dojoName}</p>
                                        <Reveal kind="rise" delay={first ? 0.1 : i === 1 ? 0.2 : 0.3} className="w-full">
                                            <div className={`flex w-full flex-col items-center justify-start rounded-t-md pt-4 ${height} ${first ? "bg-secondary text-black" : "bg-white/10 text-white"}`}>
                                                <span className="text-4xl font-black tabular-nums sm:text-5xl">{i + 1}</span>
                                                <span className={`mt-2 text-xs font-semibold tabular-nums ${first ? "text-black/70" : "text-white/60"}`}>
                                                    {d.gold}G · {d.silver}S · {d.bronze}B
                                                </span>
                                            </div>
                                        </Reveal>
                                    </li>
                                );
                            })}
                        </ol>
                    </section>
                )}

                {highlights.length > 0 && (
                    <section aria-labelledby="highlights-heading">
                        <h2 id="highlights-heading" className="mb-6 text-2xl font-extrabold md:text-3xl">Highlights</h2>
                        <dl className="grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-3">
                            {highlights.map((h) => (
                                <div key={h.label} className="bg-black p-6">
                                    <dt className="text-sm font-semibold text-white/60">{h.label}</dt>
                                    <dd className="mt-3 text-3xl font-black tabular-nums">{h.value}</dd>
                                    <dd className="mt-3 font-bold">{h.who.name}</dd>
                                    <dd className="text-sm text-white/60">{h.who.dojoName}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                )}

                <section aria-labelledby="champions-heading">
                    <h2 id="champions-heading" className="mb-6 text-2xl font-extrabold md:text-3xl">Category champions</h2>
                    {categoryWinners.length === 0 ? (
                        <p className="text-white/70">No categories have finished yet.</p>
                    ) : (
                        <div className="grid gap-x-12 gap-y-10 lg:grid-cols-2">
                            {categoryWinners.map((category) => (
                                <div key={category.bracketId}>
                                    <h3 className="border-b border-white/15 pb-3 text-lg font-extrabold">{category.categoryName}</h3>
                                    <ol className="divide-y divide-white/10">
                                        {places.map(({ key, n, label }) => {
                                            const w = category[key];
                                            if (!w) return null;
                                            return (
                                                <li key={key} className="flex items-center gap-4 py-3">
                                                    <span className={`w-10 shrink-0 text-sm font-black tabular-nums ${n === 1 ? "text-secondary" : "text-white/60"}`}>{label}</span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className={`truncate font-bold ${n === 1 ? "text-white" : "text-white/85"}`}>{w.name}</p>
                                                        <p className="truncate text-sm text-white/55">{w.dojoName}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDownloadCertificate(w, n, category.categoryName)}
                                                        aria-label={`Download ${label} place certificate for ${w.name}`}
                                                        className="inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-semibold text-white/60 transition-colors hover:text-white"
                                                    >
                                                        <FileCheck className="h-4 w-4" aria-hidden="true" />
                                                        <span className="hidden sm:inline">Certificate</span>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section aria-labelledby="standings-heading">
                    <h2 id="standings-heading" className="mb-6 text-2xl font-extrabold md:text-3xl">Dojo medal standings</h2>
                    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                        <table className="w-full min-w-[34rem] text-left">
                            <thead>
                                <tr className="border-b border-white/20 text-sm text-white/60">
                                    <th scope="col" className="py-3 pr-4 font-semibold">Rank</th>
                                    <th scope="col" className="py-3 pr-4 font-semibold">Dojo</th>
                                    <th scope="col" className="py-3 pr-4 text-right font-semibold">Gold</th>
                                    <th scope="col" className="py-3 pr-4 text-right font-semibold">Silver</th>
                                    <th scope="col" className="py-3 pr-4 text-right font-semibold">Bronze</th>
                                    <th scope="col" className="py-3 text-right font-semibold">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10 tabular-nums">
                                {dojoLeaderboard.map((dojo, idx) => (
                                    <tr key={dojo.dojoName}>
                                        <td className={`py-4 pr-4 text-lg font-black ${idx === 0 ? "text-secondary" : "text-white/70"}`}>{idx + 1}</td>
                                        <th scope="row" className="py-4 pr-4 font-bold">{dojo.dojoName}</th>
                                        <td className="py-4 pr-4 text-right font-bold text-secondary">{dojo.gold}</td>
                                        <td className="py-4 pr-4 text-right font-bold text-white/80">{dojo.silver}</td>
                                        <td className="py-4 pr-4 text-right font-bold text-white/60">{dojo.bronze}</td>
                                        <td className="py-4 text-right text-lg font-black">{dojo.total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
            )}
            </div>
        </div>
    );
}
