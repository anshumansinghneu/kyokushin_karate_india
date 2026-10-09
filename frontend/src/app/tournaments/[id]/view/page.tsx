"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Crown, RefreshCw, Share2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import BrandLink from "@/components/brand/BrandLink";
import InkSlot from "@/components/three/InkSlot";
import { formatDateOnly } from "@/lib/dateOnly";
import axios from "axios";
import { io, Socket } from "socket.io-client";

import { API_URL, BACKEND_URL } from '@/lib/config';
import KarateLoader from '@/components/KarateLoader';
const SOCKET_URL = BACKEND_URL;

interface Match {
    id: string;
    roundNumber: number;
    roundName: string;
    matchNumber: number;
    status: string;
    fighterAId: string | null;
    fighterBId: string | null;
    winnerId: string | null;
    fighterAScore: number | null;
    fighterBScore: number | null;
    fighterAName: string | null;
    fighterBName: string | null;
    fighterA: {
        id: string;
        name: string;
        currentBeltRank: string;
    } | null;
    fighterB: {
        id: string;
        name: string;
        currentBeltRank: string;
    } | null;
}

interface Bracket {
    id: string;
    eventId: string;
    categoryName: string;
    totalRounds: number;
    status: string;
    matches: Match[];
}

interface Tournament {
    id: string;
    name: string;
    /** The events endpoint sends startDate; older payloads used date. */
    date?: string;
    startDate?: string;
    location: string;
    description: string;
    registrationCount: number;
}

export default function PublicTournamentViewer() {
    const { id } = useParams();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [brackets, setBrackets] = useState<Bracket[]>([]);
    const [selectedBracket, setSelectedBracket] = useState<Bracket | null>(null);
    const [liveUpdates, setLiveUpdates] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const socketRef = useRef<Socket | null>(null);

    const fetchData = async () => {
        try {
            // Settled separately: an event with no brackets drawn yet is still a real event.
            const [tournamentRes, bracketsRes] = await Promise.allSettled([
                axios.get(`${API_URL}/events/${id}`),
                axios.get(`${API_URL}/tournaments/${id}`)
            ]);

            if (tournamentRes.status === "fulfilled") setTournament(tournamentRes.value.data.data.event);
            const fetched: Bracket[] = bracketsRes.status === "fulfilled" ? bracketsRes.value.data.data.brackets || [] : [];
            setBrackets(fetched);
            setLastUpdated(new Date());

            if (!selectedBracket && fetched.length > 0) {
                setSelectedBracket(fetched[0]);
            }
        } catch (error) {
            console.error("Failed to fetch tournament data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // WebSocket connection for live updates
    useEffect(() => {
        if (!liveUpdates || !id) return;

        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling']
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to live updates');
            setIsConnected(true);
            socket.emit('join-tournament', id);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from live updates');
            setIsConnected(false);
        });

        socket.on('match:update', (data: { matchId: string; bracketId: string; fighterAScore?: number; fighterBScore?: number; winnerId?: string; status?: string }) => {
            console.log('Match update received:', data);
            setLastUpdated(new Date());

            // Update the specific match in brackets
            setBrackets(prevBrackets =>
                prevBrackets.map(bracket => {
                    if (bracket.id === data.bracketId) {
                        return {
                            ...bracket,
                            matches: bracket.matches.map(match =>
                                match.id === data.matchId
                                    ? { ...match, ...data }
                                    : match
                            )
                        };
                    }
                    return bracket;
                })
            );
        });

        socket.on('bracket:refresh', () => {
            console.log('Bracket refresh requested');
            fetchData();
        });

        return () => {
            socket.emit('leave-tournament', id);
            socket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [liveUpdates, id]);

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: tournament?.name || 'Tournament Brackets',
                    text: 'Check out the live tournament brackets!',
                    url: url
                });
            } catch {
                // User cancelled share
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(url);
            showToast('Link copied to clipboard!', 'success');
        }
    };

    const getMatchesByRound = (bracket: Bracket) => {
        const rounds: { [key: number]: Match[] } = {};
        bracket.matches.forEach(match => {
            if (!rounds[match.roundNumber]) {
                rounds[match.roundNumber] = [];
            }
            rounds[match.roundNumber].push(match);
        });
        return rounds;
    };

    if (loading) {
        return (
            <div className="min-h-[70dvh] bg-black flex items-center justify-center">
                <KarateLoader label="Loading tournament" />
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="mx-auto flex min-h-[70dvh] max-w-xl flex-col items-start justify-center gap-6 px-4 text-white sm:px-6">
                <h1 className="text-3xl font-black uppercase tracking-[-0.02em]">Tournament not found<span className="text-primary">.</span></h1>
                <p className="leading-relaxed text-white/70">The tournament you&apos;re looking for doesn&apos;t exist, or its brackets are not public yet.</p>
                <BrandLink href="/events" variant="outline">All events</BrandLink>
            </div>
        );
    }

    const rounds = selectedBracket ? getMatchesByRound(selectedBracket) : {};
    const roundKeys = Object.keys(rounds).map(Number).sort((a, b) => a - b);

    const anyLive = brackets.some((b) => b.matches?.some((m) => m.status === "LIVE"));

    return (
        <div className="min-h-dvh text-white">
            {/* Ink hero: 試合; the red heart only burns while a match is live. */}
            <header data-bleed className="relative overflow-hidden">
            <InkSlot kanji="試合" red={anyLive ? 0.7 : 0.08} />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent md:bg-gradient-to-r md:from-black/85 md:via-black/35 md:to-transparent" />
            <div className="relative z-10 mx-auto flex min-h-[66svh] max-w-[1400px] flex-col justify-end px-4 pb-10 pt-[36svh] sm:px-6 md:pt-44 lg:px-8">
                <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
                    <span className={`inline-flex items-center gap-2 ${isConnected && liveUpdates ? "text-primary-light" : "text-white/60"}`}>
                        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${isConnected && liveUpdates ? "bg-primary animate-pulse" : "bg-white/30"}`} />
                        {isConnected && liveUpdates ? "Live" : liveUpdates ? "Connecting…" : "Live updates paused"}
                    </span>
                    <span className="text-white/30" aria-hidden="true">/</span>
                    <span className="text-white/60 tabular-nums">Updated {lastUpdated.toLocaleTimeString()}</span>
                </div>
                <h1 className="mt-4 max-w-[20ch] text-balance text-[clamp(2.25rem,6vw,4.5rem)] font-black uppercase leading-[0.95] tracking-[-0.03em]">
                    {tournament.name}
                </h1>
                <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/15 pt-5 text-sm">
                    <div>
                        <dt className="text-white/60">Date</dt>
                        <dd className="mt-1 font-bold tabular-nums">{(tournament.startDate || tournament.date) ? formatDateOnly((tournament.startDate || tournament.date)!, { day: "numeric", month: "long", year: "numeric" }, "en-IN") : "To be announced"}</dd>
                    </div>
                    {tournament.location && (
                        <div>
                            <dt className="text-white/60">Venue</dt>
                            <dd className="mt-1 font-bold">{tournament.location}</dd>
                        </div>
                    )}
                    <div>
                        <dt className="text-white/60">Fighters</dt>
                        <dd className="mt-1 font-bold tabular-nums">{tournament.registrationCount ?? 0}</dd>
                    </div>
                </dl>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                    <BrandLink href={`/tournaments/${id}/results`}>
                        Results <ArrowUpRight className="h-4 w-4" />
                    </BrandLink>
                    <button onClick={handleShare} className="inline-flex min-h-12 items-center gap-2 border border-white/25 px-5 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white/60 hover:bg-white/10">
                        <Share2 className="h-4 w-4" aria-hidden="true" /> Share
                    </button>
                    <button onClick={fetchData} className="inline-flex min-h-12 items-center gap-2 border border-white/25 px-5 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:border-white/60 hover:bg-white/10">
                        <RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh
                    </button>
                    <label className="ml-1 inline-flex min-h-12 cursor-pointer items-center gap-2 text-sm font-semibold text-white/75">
                        <input
                            type="checkbox"
                            checked={liveUpdates}
                            onChange={(e) => setLiveUpdates(e.target.checked)}
                            className="h-4 w-4 accent-[#FF0000]"
                        />
                        Live updates
                    </label>
                </div>
            </div>
            </header>

            <div className="mx-auto max-w-[1400px] px-4 pb-24 sm:px-6 lg:px-8">
                {brackets.length === 0 ? (
                    <div className="border-y border-white/10 py-16">
                        <p className="text-2xl font-extrabold">No brackets drawn yet.</p>
                        <p className="mt-3 max-w-[46ch] leading-relaxed text-white/70">Brackets appear here once the draw is made, and scores update live during the tournament.</p>
                        <div className="mt-8">
                            <BrandLink href={`/events/${id}`} variant="outline">Event details</BrandLink>
                        </div>
                    </div>
                ) : (
                    <>
                        {brackets.length > 1 && (
                            <div role="tablist" aria-label="Categories" className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
                                {brackets.map((bracket) => {
                                    const on = selectedBracket?.id === bracket.id;
                                    return (
                                        <button
                                            key={bracket.id}
                                            role="tab"
                                            aria-selected={on}
                                            onClick={() => setSelectedBracket(bracket)}
                                            className={`min-h-11 shrink-0 px-4 text-sm font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${on ? "bg-white text-black" : "border border-white/20 text-white/75 hover:bg-white/10 hover:text-white"}`}
                                        >
                                            {bracket.categoryName}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {selectedBracket && (
                            <section aria-labelledby="bracket-heading">
                                <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
                                    <h2 id="bracket-heading" className="text-2xl font-extrabold md:text-3xl">{selectedBracket.categoryName}</h2>
                                    <span className="text-sm font-semibold text-white/60">{statusLabel(selectedBracket.status)}</span>
                                </div>

                                {/* Rounds scroll sideways inside their own container on small screens. */}
                                <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
                                    <div className="flex min-w-max gap-6">
                                        {roundKeys.map((roundNum, roundIndex) => (
                                            <div key={roundNum} className="flex w-[17.5rem] flex-col">
                                                <h3 className="mb-4 border-b border-white/15 pb-3 text-sm font-bold uppercase tracking-[0.08em] text-white/70">
                                                    {roundIndex === roundKeys.length - 1 ? "Final" : roundIndex === roundKeys.length - 2 ? "Semi-finals" : `Round ${roundNum}`}
                                                </h3>
                                                <ol className="flex flex-1 flex-col justify-around gap-4">
                                                    {rounds[roundNum].map((match) => (
                                                        <li key={match.id}>
                                                            <MatchCard match={match} />
                                                        </li>
                                                    ))}
                                                </ol>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}
                    </>
                )}

                <p className="mt-16 border-t border-white/10 pt-6 text-sm text-white/50">
                    Scores update live while the connection is on. <Link href={`/events/${id}`} className="font-semibold text-white/75 underline-offset-4 hover:text-white hover:underline">Event details</Link>
                </p>
            </div>
        </div>
    );
}

const statusLabel = (status: string) =>
    status === "COMPLETED" ? "Completed" : status === "IN_PROGRESS" ? "In progress" : status === "PENDING" ? "Not started" : status.replace("_", " ").toLowerCase();

const BELT_SWATCH: Record<string, string> = {
    WHITE: "#ffffff",
    YELLOW: "#eab308",
    ORANGE: "#f97316",
    BLUE: "#3b82f6",
    GREEN: "#22c55e",
    BROWN: "#92400e",
    BLACK: "#161616",
};

function Fighter({ name, belt, score, won, decided }: { name: string | null; belt?: string; score: number | null; won: boolean; decided: boolean }) {
    return (
        <div className={`flex items-center gap-3 px-4 py-3 ${won ? "bg-secondary/10" : ""}`}>
            <div className="min-w-0 flex-1">
                {name ? (
                    <>
                        <p className={`flex items-center gap-1.5 truncate font-bold ${decided && !won ? "text-white/50" : "text-white"}`}>
                            {won && <Crown className="h-3.5 w-3.5 shrink-0 text-secondary" aria-label="Winner" />}
                            <span className="truncate">{name}</span>
                        </p>
                        {belt && (
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-white/55">
                                <span aria-hidden="true" className="h-2 w-4 rounded-sm ring-1 ring-white/25" style={{ backgroundColor: BELT_SWATCH[belt] ?? "#666" }} />
                                {belt.charAt(0) + belt.slice(1).toLowerCase().replace("_", " ")}
                            </p>
                        )}
                    </>
                ) : (
                    <p className="text-white/40">To be decided</p>
                )}
            </div>
            {score !== null && (
                <span className={`text-2xl font-black tabular-nums ${won ? "text-secondary" : "text-white/80"}`}>{score}</span>
            )}
        </div>
    );
}

function MatchCard({ match }: { match: Match }) {
    const live = match.status === "LIVE";
    const decided = !!match.winnerId;
    return (
        <article
            aria-label={`Match ${match.matchNumber}`}
            className={`overflow-hidden rounded-lg border bg-surface ${live ? "border-primary" : "border-white/10"}`}
        >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-1.5 text-xs font-semibold text-white/50">
                <span className="tabular-nums">Match {match.matchNumber}</span>
                {live && (
                    <span className="flex items-center gap-1.5 font-bold text-primary-light">
                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Live
                    </span>
                )}
                {match.status === "COMPLETED" && <span>Final</span>}
            </div>
            <Fighter
                name={match.fighterA?.name || match.fighterAName}
                belt={match.fighterA?.currentBeltRank}
                score={match.fighterAScore}
                won={decided && match.winnerId === match.fighterAId}
                decided={decided}
            />
            <div className="h-px bg-white/10" />
            <Fighter
                name={match.fighterB?.name || match.fighterBName}
                belt={match.fighterB?.currentBeltRank}
                score={match.fighterBScore}
                won={decided && match.winnerId === match.fighterBId}
                decided={decided}
            />
        </article>
    );
}
