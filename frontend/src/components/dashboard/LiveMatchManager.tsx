"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Radio, Trophy, Play, Square, RefreshCw, ChevronDown, ChevronRight,
    Minus, Plus, Users, Zap, Clock, CheckCircle, AlertCircle, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { io, Socket } from "socket.io-client";

interface Match {
    id: string;
    matchNumber: number;
    roundNumber: number;
    roundName: string;
    fighterAId: string | null;
    fighterBId: string | null;
    fighterAName: string;
    fighterBName: string;
    fighterAScore: number;
    fighterBScore: number;
    winnerId: string | null;
    status: string;
    isBye: boolean;
    startedAt: string | null;
    completedAt: string | null;
    nextMatchId: string | null;
    bracket?: {
        id: string;
        categoryName: string;
        event?: { id: string; name: string };
    };
}

interface Bracket {
    id: string;
    categoryName: string;
    categoryAge: string;
    categoryWeight: string;
    categoryBelt: string;
    status: string;
    totalParticipants: number;
    matches: Match[];
    event?: { id: string; name: string };
}

interface Tournament {
    id: string;
    name: string;
    startDate: string;
    status: string;
}

export default function LiveMatchManager() {
    const { showToast } = useToast();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
    const [brackets, setBrackets] = useState<Bracket[]>([]);
    const [selectedBracket, setSelectedBracket] = useState<string | null>(null);
    const [liveMatches, setLiveMatches] = useState<Match[]>([]);
    const [allMatches, setAllMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [view, setView] = useState<'live' | 'fixtures' | 'results'>('live');
    const [updatingMatch, setUpdatingMatch] = useState<string | null>(null);

    // Fetch tournaments list
    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const res = await api.get("/events?type=TOURNAMENT");
                setTournaments(res.data.data.events || []);
            } catch (err) {
                console.error("Failed to fetch tournaments", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTournaments();
    }, []);

    // Fetch live matches globally
    const fetchLiveMatches = useCallback(async () => {
        try {
            const res = await api.get("/matches/live");
            setLiveMatches(res.data.data.matches || []);
        } catch (err) {
            console.error("Failed to fetch live matches", err);
        }
    }, []);

    useEffect(() => {
        fetchLiveMatches();
    }, [fetchLiveMatches]);

    // Socket.IO for real-time updates
    useEffect(() => {
        const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000");
        setSocket(newSocket);

        newSocket.on("match:started", () => fetchLiveMatches());
        newSocket.on("match:update", () => fetchLiveMatches());
        newSocket.on("match:ended", () => {
            fetchLiveMatches();
            // Refresh brackets if viewing fixtures
            if (selectedTournament) fetchBrackets(selectedTournament);
        });

        return () => { newSocket.close(); };
    }, [fetchLiveMatches, selectedTournament]);

    // Fetch brackets for selected tournament
    const fetchBrackets = async (eventId: string) => {
        try {
            const res = await api.get(`/tournaments/${eventId}`);
            const fetchedBrackets = res.data.data.brackets || [];
            setBrackets(fetchedBrackets);
            // Flatten all matches
            const matches = fetchedBrackets.flatMap((b: Bracket) =>
                b.matches.map((m: Match) => ({ ...m, bracket: { id: b.id, categoryName: b.categoryName, event: b.event } }))
            );
            setAllMatches(matches);
        } catch (err) {
            console.error("Failed to fetch brackets", err);
            showToast("Failed to load brackets", "error");
        }
    };

    const handleSelectTournament = (eventId: string) => {
        setSelectedTournament(eventId);
        setSelectedBracket(null);
        fetchBrackets(eventId);
    };

    // Match control actions
    const startMatch = async (matchId: string) => {
        try {
            setUpdatingMatch(matchId);
            await api.post(`/matches/${matchId}/start`);
            showToast("Match started! Now LIVE.", "success");
            await fetchLiveMatches();
            if (selectedTournament) await fetchBrackets(selectedTournament);
        } catch (err: any) {
            showToast(err.response?.data?.message || "Failed to start match", "error");
        } finally {
            setUpdatingMatch(null);
        }
    };

    const updateScore = async (matchId: string, field: 'fighterAScore' | 'fighterBScore', delta: number) => {
        const match = [...liveMatches, ...allMatches].find(m => m.id === matchId);
        if (!match) return;
        const newScore = Math.max(0, (match[field] || 0) + delta);
        // Optimistic: update UI instantly before API call
        setLiveMatches(prev => prev.map(m => m.id === matchId ? { ...m, [field]: newScore } : m));
        setAllMatches(prev => prev.map(m => m.id === matchId ? { ...m, [field]: newScore } : m));
        try {
            await api.patch(`/matches/${matchId}`, { [field]: newScore });
        } catch (err: any) {
            // Revert on failure
            const oldScore = Math.max(0, newScore - delta);
            setLiveMatches(prev => prev.map(m => m.id === matchId ? { ...m, [field]: oldScore } : m));
            setAllMatches(prev => prev.map(m => m.id === matchId ? { ...m, [field]: oldScore } : m));
            showToast("Failed to update score", "error");
        }
    };

    const endMatch = async (matchId: string, winnerId: string) => {
        try {
            setUpdatingMatch(matchId);
            await api.post(`/matches/${matchId}/end`, { winnerId });
            showToast("Match ended! Result recorded.", "success");
            await fetchLiveMatches();
            if (selectedTournament) await fetchBrackets(selectedTournament);
        } catch (err: any) {
            showToast(err.response?.data?.message || "Failed to end match", "error");
        } finally {
            setUpdatingMatch(null);
        }
    };

    // Filter matches by bracket and status
    const getFilteredMatches = () => {
        let matches = allMatches;
        if (selectedBracket) {
            matches = matches.filter(m => m.bracket?.id === selectedBracket);
        }
        if (view === 'fixtures') {
            return matches.filter(m => m.status === 'SCHEDULED' && !m.isBye);
        }
        if (view === 'results') {
            return matches.filter(m => m.status === 'COMPLETED');
        }
        return matches.filter(m => m.status === 'LIVE');
    };

    const completedMatches = allMatches.filter(m => m.status === 'COMPLETED');
    const scheduledMatches = allMatches.filter(m => m.status === 'SCHEDULED' && !m.isBye);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Radio className="w-6 h-6 text-red-500" />
                        <h1 className="text-3xl font-black text-white">Live Control Center</h1>
                    </div>
                    <p className="text-gray-400">Manage matches, update scores, and publish results in real-time</p>
                </div>
                <Button onClick={fetchLiveMatches} className="bg-white/5 hover:bg-white/10 text-white border border-white/10">
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                </Button>
            </div>

            {/* Live Matches Overview (always visible) */}
            <div className="bg-zinc-900/50 border border-red-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <h2 className="text-xl font-bold text-white">Currently Live ({liveMatches.length})</h2>
                </div>
                {liveMatches.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No live matches right now. Start a match from the Fixtures tab below.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {liveMatches.map(match => (
                            <LiveMatchCard
                                key={match.id}
                                match={match}
                                onUpdateScore={updateScore}
                                onEndMatch={endMatch}
                                isUpdating={updatingMatch === match.id}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Tournament Selector */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Select Tournament</h2>
                {loading ? (
                    <div className="flex items-center gap-2 text-gray-400"><RefreshCw className="w-4 h-4 animate-spin" /> Loading...</div>
                ) : tournaments.length === 0 ? (
                    <p className="text-gray-500">No tournaments found. Create one in Event Management first.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tournaments.map(t => (
                            <button
                                key={t.id}
                                onClick={() => handleSelectTournament(t.id)}
                                className={`p-4 rounded-xl border text-left transition-all ${selectedTournament === t.id
                                    ? 'bg-red-600/20 border-red-500/50 text-white'
                                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                    }`}
                            >
                                <p className="font-bold truncate">{t.name}</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(t.startDate).toLocaleDateString()}</p>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Match Management Area */}
            {selectedTournament && (
                <div className="space-y-6">
                    {/* Stats Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 text-center">
                            <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                            <p className="text-2xl font-black text-white">{brackets.length}</p>
                            <p className="text-xs text-gray-400">Categories</p>
                        </div>
                        <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 text-center">
                            <Clock className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                            <p className="text-2xl font-black text-white">{scheduledMatches.length}</p>
                            <p className="text-xs text-gray-400">Upcoming</p>
                        </div>
                        <div className="bg-zinc-900/50 border border-red-500/20 rounded-xl p-4 text-center">
                            <Radio className="w-5 h-5 text-red-400 mx-auto mb-1" />
                            <p className="text-2xl font-black text-white">{liveMatches.length}</p>
                            <p className="text-xs text-gray-400">Live Now</p>
                        </div>
                        <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 text-center">
                            <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
                            <p className="text-2xl font-black text-white">{completedMatches.length}</p>
                            <p className="text-xs text-gray-400">Completed</p>
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedBracket(null)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${!selectedBracket ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                            All Categories
                        </button>
                        {brackets.map(b => (
                            <button
                                key={b.id}
                                onClick={() => setSelectedBracket(b.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedBracket === b.id ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                            >
                                {b.categoryName}
                            </button>
                        ))}
                    </div>

                    {/* View Tabs */}
                    <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-xl border border-white/10 w-fit">
                        {[
                            { id: 'live' as const, label: 'Live', icon: Radio, count: liveMatches.length },
                            { id: 'fixtures' as const, label: 'Fixtures', icon: Clock, count: scheduledMatches.length },
                            { id: 'results' as const, label: 'Results', icon: Trophy, count: completedMatches.length },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setView(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === tab.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{tab.count}</span>
                            </button>
                        ))}
                    </div>

                    {/* Match Cards */}
                    <div className="space-y-4">
                        {view === 'live' && liveMatches.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <Radio className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="font-bold">No live matches</p>
                                <p className="text-sm mt-1">Go to Fixtures to start a match</p>
                            </div>
                        )}

                        {view === 'fixtures' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {getFilteredMatches().map(match => (
                                    <FixtureCard
                                        key={match.id}
                                        match={match}
                                        onStart={startMatch}
                                        isUpdating={updatingMatch === match.id}
                                    />
                                ))}
                                {getFilteredMatches().length === 0 && (
                                    <div className="col-span-2 text-center py-12 text-gray-500">
                                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p className="font-bold">No upcoming fixtures</p>
                                        <p className="text-sm mt-1">All matches may be completed or live</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {view === 'results' && (
                            <div className="space-y-3">
                                {getFilteredMatches().map(match => (
                                    <ResultCard key={match.id} match={match} />
                                ))}
                                {getFilteredMatches().length === 0 && (
                                    <div className="text-center py-12 text-gray-500">
                                        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p className="font-bold">No results yet</p>
                                        <p className="text-sm mt-1">Complete matches to see results here</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {view === 'live' && liveMatches.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {liveMatches.map(match => (
                                    <LiveMatchCard
                                        key={match.id}
                                        match={match}
                                        onUpdateScore={updateScore}
                                        onEndMatch={endMatch}
                                        isUpdating={updatingMatch === match.id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Sub-Components ──────────────────────────────────────────────────────

function LiveMatchCard({
    match, onUpdateScore, onEndMatch, isUpdating
}: {
    match: Match;
    onUpdateScore: (id: string, field: 'fighterAScore' | 'fighterBScore', delta: number) => void;
    onEndMatch: (id: string, winnerId: string) => void;
    isUpdating: boolean;
}) {
    const [showEndConfirm, setShowEndConfirm] = useState(false);

    return (
        <motion.div
            layout
            className="bg-zinc-900 border border-red-500/30 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(239,68,68,0.1)]"
        >
            {/* LIVE Header */}
            <div className="bg-red-600 px-4 py-2 flex justify-between items-center">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    LIVE
                </span>
                <span className="text-xs text-white/80">
                    {match.bracket?.categoryName || match.roundName}
                </span>
            </div>

            {/* Event Info */}
            {match.bracket?.event?.name && (
                <div className="px-4 py-2 border-b border-white/5 bg-zinc-900/50">
                    <p className="text-xs text-gray-400 truncate">{match.bracket.event.name} • {match.roundName}</p>
                </div>
            )}

            {/* Scoreboard with Controls */}
            <div className="p-4">
                <div className="flex justify-between items-center gap-2">
                    {/* Fighter A */}
                    <div className="flex-1 text-center">
                        <div className="text-sm text-gray-400 truncate mb-2 px-1">{match.fighterAName || "TBD"}</div>
                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={() => onUpdateScore(match.id, 'fighterAScore', -1)}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-3xl font-mono font-black text-white min-w-[40px]">
                                {match.fighterAScore || 0}
                            </span>
                            <button
                                onClick={() => onUpdateScore(match.id, 'fighterAScore', 1)}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-600/30 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="text-zinc-600 font-black text-lg">VS</div>

                    {/* Fighter B */}
                    <div className="flex-1 text-center">
                        <div className="text-sm text-gray-400 truncate mb-2 px-1">{match.fighterBName || "TBD"}</div>
                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={() => onUpdateScore(match.id, 'fighterBScore', -1)}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-3xl font-mono font-black text-white min-w-[40px]">
                                {match.fighterBScore || 0}
                            </span>
                            <button
                                onClick={() => onUpdateScore(match.id, 'fighterBScore', 1)}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-600/30 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* End Match Area */}
                <div className="mt-4 pt-4 border-t border-white/5">
                    {!showEndConfirm ? (
                        <Button
                            onClick={() => setShowEndConfirm(true)}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-sm"
                            disabled={isUpdating}
                        >
                            <Square className="w-4 h-4 mr-2" /> End Match
                        </Button>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-xs text-gray-400 text-center">Select Winner:</p>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    onClick={() => {
                                        if (match.fighterAId) onEndMatch(match.id, match.fighterAId);
                                        setShowEndConfirm(false);
                                    }}
                                    className="bg-green-600/20 hover:bg-green-600/40 text-green-400 text-xs border border-green-600/30"
                                    disabled={isUpdating || !match.fighterAId}
                                >
                                    <Trophy className="w-3 h-3 mr-1" /> {match.fighterAName?.split(' ')[0] || "A"}
                                </Button>
                                <Button
                                    onClick={() => {
                                        if (match.fighterBId) onEndMatch(match.id, match.fighterBId);
                                        setShowEndConfirm(false);
                                    }}
                                    className="bg-green-600/20 hover:bg-green-600/40 text-green-400 text-xs border border-green-600/30"
                                    disabled={isUpdating || !match.fighterBId}
                                >
                                    <Trophy className="w-3 h-3 mr-1" /> {match.fighterBName?.split(' ')[0] || "B"}
                                </Button>
                            </div>
                            <button
                                onClick={() => setShowEndConfirm(false)}
                                className="w-full text-xs text-gray-500 hover:text-gray-300 py-1"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function FixtureCard({
    match, onStart, isUpdating
}: {
    match: Match;
    onStart: (id: string) => void;
    isUpdating: boolean;
}) {
    const canStart = match.fighterAId && match.fighterBId;

    return (
        <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {match.bracket?.categoryName} • {match.roundName}
                    </span>
                    <p className="text-[10px] text-gray-600 mt-0.5">Match #{match.matchNumber}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                    SCHEDULED
                </span>
            </div>

            <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                    <p className="text-white font-bold truncate">{match.fighterAName || "TBD"}</p>
                </div>
                <span className="text-zinc-600 font-black text-sm mx-3">VS</span>
                <div className="flex-1 text-right">
                    <p className="text-white font-bold truncate">{match.fighterBName || "TBD"}</p>
                </div>
            </div>

            <Button
                onClick={() => onStart(match.id)}
                disabled={!canStart || isUpdating}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-sm disabled:opacity-30"
            >
                {isUpdating ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Starting...</>
                ) : (
                    <><Play className="w-4 h-4 mr-2" /> Start Match</>
                )}
            </Button>
            {!canStart && (
                <p className="text-[10px] text-gray-600 text-center mt-2">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    Waiting for both fighters to be assigned
                </p>
            )}
        </div>
    );
}

function ResultCard({ match }: { match: Match }) {
    const winnerName = match.winnerId === match.fighterAId ? match.fighterAName : match.fighterBName;
    const loserName = match.winnerId === match.fighterAId ? match.fighterBName : match.fighterAName;
    const winnerScore = match.winnerId === match.fighterAId ? match.fighterAScore : match.fighterBScore;
    const loserScore = match.winnerId === match.fighterAId ? match.fighterBScore : match.fighterAScore;

    return (
        <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                        {match.bracket?.categoryName} • {match.roundName}
                    </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-white font-bold">{winnerName}</span>
                    <span className="text-green-500 font-mono font-bold text-sm">{winnerScore}</span>
                    <span className="text-gray-600 mx-1">-</span>
                    <span className="text-red-400 font-mono font-bold text-sm">{loserScore}</span>
                    <span className="text-gray-400">{loserName}</span>
                </div>
            </div>
            <div className="text-right flex-shrink-0">
                {match.completedAt && (
                    <p className="text-[10px] text-gray-500">{new Date(match.completedAt).toLocaleTimeString()}</p>
                )}
            </div>
        </div>
    );
}
