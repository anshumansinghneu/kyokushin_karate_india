"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, Crown, Calendar, MapPin, Users, RefreshCw, Share2, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

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
    date: string;
    location: string;
    description: string;
    registrationCount: number;
}

export default function PublicTournamentViewer() {
    const { id } = useParams();
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
            const [tournamentRes, bracketsRes] = await Promise.all([
                axios.get(`${API_URL}/events/${id}`),
                axios.get(`${API_URL}/tournaments/${id}`)
            ]);

            setTournament(tournamentRes.data.data.event);
            setBrackets(bracketsRes.data.data.brackets || []);
            setLastUpdated(new Date());

            if (!selectedBracket && bracketsRes.data.data.brackets?.length > 0) {
                setSelectedBracket(bracketsRes.data.data.brackets[0]);
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
            alert('Link copied to clipboard!');
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

    const getBeltColor = (rank: string) => {
        const colors: { [key: string]: string } = {
            'WHITE': 'bg-white text-black',
            'YELLOW': 'bg-yellow-400 text-black',
            'ORANGE': 'bg-orange-500 text-white',
            'BLUE': 'bg-blue-500 text-white',
            'GREEN': 'bg-green-600 text-white',
            'BROWN': 'bg-yellow-800 text-white',
            'BLACK': 'bg-black text-white border border-white'
        };
        return colors[rank] || 'bg-gray-500 text-white';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-red-950/20 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white/60">Loading tournament...</p>
                </div>
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-red-950/20 flex items-center justify-center">
                <div className="text-center text-white">
                    <Trophy className="w-16 h-16 mx-auto mb-4 text-red-500" />
                    <h1 className="text-2xl font-bold mb-2">Tournament Not Found</h1>
                    <p className="text-white/60">The tournament you&apos;re looking for doesn&apos;t exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-red-950/20 text-white">
            {/* Header */}
            <div className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Trophy className="w-8 h-8 text-red-500" />
                            <div>
                                <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">
                                    {tournament.name}
                                </h1>
                                <div className="flex items-center gap-4 text-xs text-white/60 mt-1">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(tournament.date).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {tournament.location}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {tournament.registrationCount} participants
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleShare}
                                size="sm"
                                variant="outline"
                                className="hidden md:flex items-center gap-2"
                            >
                                <Share2 className="w-4 h-4" />
                                Share
                            </Button>
                            <Button
                                onClick={fetchData}
                                size="sm"
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Live updates indicator */}
                <div className="flex items-center justify-between mb-6 p-3 bg-black/40 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3">
                        {isConnected ? (
                            <Wifi className="w-4 h-4 text-green-500" />
                        ) : (
                            <WifiOff className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="text-sm text-white/60">
                            {isConnected ? 'Live updates active' : 'Live updates disconnected'}
                            {' • '}
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={liveUpdates}
                            onChange={(e) => setLiveUpdates(e.target.checked)}
                            className="w-4 h-4 rounded bg-white/10 border-white/20"
                        />
                        <span className="text-sm text-white/80">Live updates</span>
                    </label>
                </div>

                {brackets.length === 0 ? (
                    <div className="text-center py-20">
                        <Trophy className="w-16 h-16 mx-auto mb-4 text-white/20" />
                        <h2 className="text-xl font-bold mb-2">No Brackets Generated Yet</h2>
                        <p className="text-white/60">Brackets will appear here once the tournament begins.</p>
                    </div>
                ) : (
                    <>
                        {/* Category Selector */}
                        {brackets.length > 1 && (
                            <div className="mb-6">
                                <div className="flex flex-wrap gap-2">
                                    {brackets.map((bracket) => (
                                        <button
                                            key={bracket.id}
                                            onClick={() => setSelectedBracket(bracket)}
                                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                                selectedBracket?.id === bracket.id
                                                    ? 'bg-red-600 text-white'
                                                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                                            }`}
                                        >
                                            {bracket.categoryName}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bracket Display */}
                        {selectedBracket && (
                            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold">{selectedBracket.categoryName}</h2>
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                        selectedBracket.status === 'COMPLETED'
                                            ? 'bg-green-600/20 text-green-400'
                                            : selectedBracket.status === 'IN_PROGRESS'
                                            ? 'bg-yellow-600/20 text-yellow-400'
                                            : 'bg-gray-600/20 text-gray-400'
                                    }`}>
                                        {selectedBracket.status}
                                    </span>
                                </div>

                                {/* Bracket Tree */}
                                <div className="overflow-x-auto">
                                    <div className="min-w-max flex gap-8 pb-4">
                                        {Object.entries(getMatchesByRound(selectedBracket))
                                            .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                            .map(([roundNum, matches]) => {
                                                const roundIndex = parseInt(roundNum) - 1;
                                                const rounds = Object.keys(getMatchesByRound(selectedBracket));

                                                return (
                                                    <div key={roundNum} className="flex flex-col gap-4">
                                                        {/* Round Header */}
                                                        <div className="sticky top-20 z-10">
                                                            <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-3 mb-4">
                                                                <span className="text-white font-bold text-sm">
                                                                    {roundIndex === rounds.length - 1
                                                                        ? '🏆 Final'
                                                                        : roundIndex === rounds.length - 2
                                                                        ? 'Semi Finals'
                                                                        : `Round ${parseInt(roundNum)}`
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Matches */}
                                                        {matches.map((match) => (
                                                            <motion.div
                                                                key={match.id}
                                                                initial={{ opacity: 0, y: 20 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className={`bg-black/60 border rounded-xl overflow-hidden min-w-[280px] ${
                                                                    match.status === 'COMPLETED'
                                                                        ? 'border-green-500/30'
                                                                        : match.status === 'LIVE'
                                                                        ? 'border-red-500 shadow-lg shadow-red-500/20'
                                                                        : 'border-white/10'
                                                                }`}
                                                            >
                                                                {/* Live Indicator */}
                                                                {match.status === 'LIVE' && (
                                                                    <div className="bg-red-600 px-3 py-1 text-xs font-bold flex items-center justify-center gap-2">
                                                                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                                                        LIVE MATCH
                                                                    </div>
                                                                )}

                                                                {/* Fighter A */}
                                                                <div className={`p-4 flex items-center gap-3 ${
                                                                    match.winnerId === match.fighterAId
                                                                        ? 'bg-yellow-500/20 border-l-4 border-yellow-500'
                                                                        : ''
                                                                }`}>
                                                                    <div className="flex-1">
                                                                        {match.fighterA || match.fighterAName ? (
                                                                            <>
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    {match.winnerId === match.fighterAId && (
                                                                                        <Crown className="w-4 h-4 text-yellow-400" />
                                                                                    )}
                                                                                    <span className="text-white font-bold">
                                                                                        {match.fighterA?.name || match.fighterAName}
                                                                                    </span>
                                                                                </div>
                                                                                {match.fighterA && (
                                                                                    <span className={`text-xs px-2 py-0.5 rounded-full inline-block ${getBeltColor(match.fighterA.currentBeltRank)}`}>
                                                                                        {match.fighterA.currentBeltRank}
                                                                                    </span>
                                                                                )}
                                                                            </>
                                                                        ) : (
                                                                            <span className="text-gray-500 italic">TBD</span>
                                                                        )}
                                                                    </div>
                                                                    {match.fighterAScore !== null && (
                                                                        <span className="text-3xl font-black text-white">
                                                                            {match.fighterAScore}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="h-px bg-white/10" />

                                                                {/* Fighter B */}
                                                                <div className={`p-4 flex items-center gap-3 ${
                                                                    match.winnerId === match.fighterBId
                                                                        ? 'bg-yellow-500/20 border-l-4 border-yellow-500'
                                                                        : ''
                                                                }`}>
                                                                    <div className="flex-1">
                                                                        {match.fighterB || match.fighterBName ? (
                                                                            <>
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    {match.winnerId === match.fighterBId && (
                                                                                        <Crown className="w-4 h-4 text-yellow-400" />
                                                                                    )}
                                                                                    <span className="text-white font-bold">
                                                                                        {match.fighterB?.name || match.fighterBName}
                                                                                    </span>
                                                                                </div>
                                                                                {match.fighterB && (
                                                                                    <span className={`text-xs px-2 py-0.5 rounded-full inline-block ${getBeltColor(match.fighterB.currentBeltRank)}`}>
                                                                                        {match.fighterB.currentBeltRank}
                                                                                    </span>
                                                                                )}
                                                                            </>
                                                                        ) : (
                                                                            <span className="text-gray-500 italic">TBD</span>
                                                                        )}
                                                                    </div>
                                                                    {match.fighterBScore !== null && (
                                                                        <span className="text-3xl font-black text-white">
                                                                            {match.fighterBScore}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 bg-black/40 backdrop-blur-md mt-12">
                <div className="max-w-7xl mx-auto px-4 py-6 text-center">
                    <p className="text-white/40 text-sm">
                        Live Tournament Brackets • Auto-refreshing every 30 seconds
                    </p>
                </div>
            </div>
        </div>
    );
}
