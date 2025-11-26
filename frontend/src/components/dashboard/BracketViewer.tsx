"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { useAuthStore } from "@/store/authStore";

interface Match {
    id: string;
    round: number;
    position: number;
    status: string;
    fighterAId: string | null;
    fighterBId: string | null;
    winnerId: string | null;
    fighterAScore: number | null;
    fighterBScore: number | null;
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
    winner: {
        id: string;
        name: string;
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

interface BracketViewerProps {
    tournamentId: string;
    onClose?: () => void;
}

export default function BracketViewer({ tournamentId, onClose }: BracketViewerProps) {
    const { showToast } = useToast();
    const { user } = useAuthStore();
    const [brackets, setBrackets] = useState<Bracket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBracket, setSelectedBracket] = useState<Bracket | null>(null);
    const [scoringMatch, setScoringMatch] = useState<Match | null>(null);
    const [scores, setScores] = useState({ fighterA: 0, fighterB: 0 });

    useEffect(() => {
        fetchBrackets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tournamentId]);

    const fetchBrackets = async () => {
        try {
            const res = await api.get(`/tournaments/${tournamentId}`);
            const bracketData = res.data.data.brackets || [];
            setBrackets(bracketData);
            if (bracketData.length > 0) {
                setSelectedBracket(bracketData[0]);
            }
        } catch (error) {
            console.error("Failed to fetch brackets:", error);
            showToast("Failed to load brackets", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleStartMatch = async (match: Match) => {
        try {
            await api.patch(`/matches/${match.id}`, {
                status: 'LIVE'
            });
            showToast("Match started!", "success");
            fetchBrackets();
        } catch (error) {
            console.error("Failed to start match:", error);
            showToast("Failed to start match", "error");
        }
    };

    const handleScoreMatch = (match: Match) => {
        setScoringMatch(match);
        setScores({
            fighterA: match.fighterAScore || 0,
            fighterB: match.fighterBScore || 0
        });
    };

    const handleUpdateLiveScore = async (isIncrement: boolean, fighter: 'A' | 'B') => {
        if (!scoringMatch) return;

        const newScores = { ...scores };
        if (fighter === 'A') {
            newScores.fighterA = Math.max(0, newScores.fighterA + (isIncrement ? 1 : -1));
        } else {
            newScores.fighterB = Math.max(0, newScores.fighterB + (isIncrement ? 1 : -1));
        }
        setScores(newScores);

        try {
            await api.patch(`/matches/${scoringMatch.id}`, {
                fighterAScore: newScores.fighterA,
                fighterBScore: newScores.fighterB,
                status: 'LIVE'
            });
        } catch (error) {
            console.error("Failed to update score:", error);
        }
    };

    const handleSubmitScore = async () => {
        if (!scoringMatch) return;

        if (scores.fighterA === scores.fighterB) {
            showToast("Cannot complete match with a tie score", "error");
            return;
        }

        const winnerId = scores.fighterA > scores.fighterB 
            ? scoringMatch.fighterAId 
            : scoringMatch.fighterBId;

        try {
            await api.patch(`/matches/${scoringMatch.id}`, {
                fighterAScore: scores.fighterA,
                fighterBScore: scores.fighterB,
                winnerId,
                status: 'COMPLETED'
            });

            showToast("Match completed successfully!", "success");
            setScoringMatch(null);
            fetchBrackets();
        } catch (error) {
            console.error("Failed to complete match:", error);
            showToast("Failed to complete match", "error");
        }
    };

    const getMatchesByRound = (bracket: Bracket) => {
        const rounds: { [key: number]: Match[] } = {};
        bracket.matches.forEach(match => {
            if (!rounds[match.round]) {
                rounds[match.round] = [];
            }
            rounds[match.round].push(match);
        });
        return rounds;
    };

    const getBeltColor = (rank: string) => {
        if (rank.includes("White")) return "bg-gray-200 text-gray-800";
        if (rank.includes("Yellow")) return "bg-yellow-400 text-yellow-900";
        if (rank.includes("Orange")) return "bg-orange-500 text-white";
        if (rank.includes("Blue")) return "bg-blue-500 text-white";
        if (rank.includes("Green")) return "bg-green-600 text-white";
        if (rank.includes("Brown")) return "bg-amber-700 text-white";
        if (rank.includes("Black")) return "bg-black text-yellow-400 border border-yellow-400";
        return "bg-gray-500 text-white";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
        );
    }

    if (brackets.length === 0) {
        return (
            <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
                <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Brackets Generated</h3>
                <p className="text-gray-400 mb-6">Generate brackets first to view the tournament structure.</p>
            </div>
        );
    }

    const matchesByRound = selectedBracket ? getMatchesByRound(selectedBracket) : {};
    const rounds = Object.keys(matchesByRound).sort((a, b) => parseInt(a) - parseInt(b));

    return (
        <div className="space-y-6">
            {/* Category Selector */}
            {brackets.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {brackets.map(bracket => (
                        <Button
                            key={bracket.id}
                            onClick={() => setSelectedBracket(bracket)}
                            className={`whitespace-nowrap ${
                                selectedBracket?.id === bracket.id
                                    ? 'bg-yellow-600 hover:bg-yellow-700'
                                    : 'bg-white/5 hover:bg-white/10'
                            }`}
                        >
                            {bracket.categoryName}
                        </Button>
                    ))}
                </div>
            )}

            {/* Bracket Display */}
            {selectedBracket && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-1">
                                {selectedBracket.categoryName}
                            </h3>
                            <p className="text-gray-400">
                                {rounds.length} Rounds • {selectedBracket.matches.length} Matches
                            </p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                            selectedBracket.status === 'COMPLETED' 
                                ? 'bg-green-500/20 text-green-400'
                                : selectedBracket.status === 'IN_PROGRESS'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-gray-500/20 text-gray-400'
                        }`}>
                            {selectedBracket.status}
                        </span>
                    </div>

                    {/* Bracket Tree */}
                    <div className="overflow-x-auto">
                        <div className="flex gap-8 min-w-max pb-4">
                            {rounds.map((roundNum, roundIndex) => (
                                <div key={roundNum} className="flex flex-col gap-4 min-w-[280px]">
                                    {/* Round Header */}
                                    <div className="text-center mb-2">
                                        <div className="inline-block bg-white/10 px-4 py-2 rounded-lg">
                                            <span className="text-white font-bold">
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
                                    {matchesByRound[parseInt(roundNum)].map((match) => (
                                        <motion.div
                                            key={match.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`bg-black/40 border rounded-xl overflow-hidden ${
                                                match.status === 'COMPLETED'
                                                    ? 'border-green-500/30'
                                                    : match.status === 'LIVE'
                                                    ? 'border-red-500 animate-pulse'
                                                    : 'border-white/10'
                                            }`}
                                        >
                                            {/* Fighter A */}
                                            <div className={`p-3 flex items-center gap-3 ${
                                                match.winnerId === match.fighterAId 
                                                    ? 'bg-yellow-500/20' 
                                                    : 'hover:bg-white/5'
                                            }`}>
                                                <div className="flex-1">
                                                    {match.fighterA ? (
                                                        <>
                                                            <div className="flex items-center gap-2">
                                                                {match.winnerId === match.fighterAId && (
                                                                    <Crown className="w-4 h-4 text-yellow-400" />
                                                                )}
                                                                <span className="text-white font-semibold">
                                                                    {match.fighterA.name}
                                                                </span>
                                                            </div>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${getBeltColor(match.fighterA.currentBeltRank)}`}>
                                                                {match.fighterA.currentBeltRank}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-500 italic">TBD / Bye</span>
                                                    )}
                                                </div>
                                                {match.fighterAScore !== null && (
                                                    <span className="text-2xl font-bold text-white">
                                                        {match.fighterAScore}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="h-px bg-white/10"></div>

                                            {/* Fighter B */}
                                            <div className={`p-3 flex items-center gap-3 ${
                                                match.winnerId === match.fighterBId 
                                                    ? 'bg-yellow-500/20' 
                                                    : 'hover:bg-white/5'
                                            }`}>
                                                <div className="flex-1">
                                                    {match.fighterB ? (
                                                        <>
                                                            <div className="flex items-center gap-2">
                                                                {match.winnerId === match.fighterBId && (
                                                                    <Crown className="w-4 h-4 text-yellow-400" />
                                                                )}
                                                                <span className="text-white font-semibold">
                                                                    {match.fighterB.name}
                                                                </span>
                                                            </div>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${getBeltColor(match.fighterB.currentBeltRank)}`}>
                                                                {match.fighterB.currentBeltRank}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-500 italic">TBD / Bye</span>
                                                    )}
                                                </div>
                                                {match.fighterBScore !== null && (
                                                    <span className="text-2xl font-bold text-white">
                                                        {match.fighterBScore}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Match Control Buttons */}
                                            {user?.role === 'ADMIN' && match.status !== 'COMPLETED' && match.fighterA && match.fighterB && (
                                                <div className="p-2 border-t border-white/10 flex gap-2">
                                                    {match.status === 'SCHEDULED' && (
                                                        <Button
                                                            onClick={() => handleStartMatch(match)}
                                                            size="sm"
                                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                                        >
                                                            Start Match
                                                        </Button>
                                                    )}
                                                    <Button
                                                        onClick={() => handleScoreMatch(match)}
                                                        size="sm"
                                                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                                                    >
                                                        {match.status === 'LIVE' ? 'Update Score' : 'Score Match'}
                                                    </Button>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Scoring Modal */}
            {scoringMatch && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">
                                {scoringMatch.status === 'LIVE' ? 'Live Match Scoring' : 'Score Match'}
                            </h3>
                            {scoringMatch.status === 'LIVE' && (
                                <span className="flex items-center gap-2 text-red-500 text-sm font-semibold">
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                    LIVE
                                </span>
                            )}
                        </div>

                        <div className="space-y-6 mb-6">
                            {/* Fighter A Score */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <label className="text-white font-semibold block mb-3">
                                    {scoringMatch.fighterA?.name}
                                </label>
                                <div className="flex items-center gap-3">
                                    <Button
                                        onClick={() => handleUpdateLiveScore(false, 'A')}
                                        variant="outline"
                                        size="sm"
                                        className="w-12 h-12 text-xl"
                                        disabled={scores.fighterA === 0}
                                    >
                                        -
                                    </Button>
                                    <div className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-4xl font-bold text-center">
                                        {scores.fighterA}
                                    </div>
                                    <Button
                                        onClick={() => handleUpdateLiveScore(true, 'A')}
                                        variant="outline"
                                        size="sm"
                                        className="w-12 h-12 text-xl"
                                    >
                                        +
                                    </Button>
                                </div>
                            </div>

                            {/* VS Divider */}
                            <div className="flex items-center justify-center">
                                <span className="text-white/50 font-bold text-lg">VS</span>
                            </div>

                            {/* Fighter B Score */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <label className="text-white font-semibold block mb-3">
                                    {scoringMatch.fighterB?.name}
                                </label>
                                <div className="flex items-center gap-3">
                                    <Button
                                        onClick={() => handleUpdateLiveScore(false, 'B')}
                                        variant="outline"
                                        size="sm"
                                        className="w-12 h-12 text-xl"
                                        disabled={scores.fighterB === 0}
                                    >
                                        -
                                    </Button>
                                    <div className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-4xl font-bold text-center">
                                        {scores.fighterB}
                                    </div>
                                    <Button
                                        onClick={() => handleUpdateLiveScore(true, 'B')}
                                        variant="outline"
                                        size="sm"
                                        className="w-12 h-12 text-xl"
                                    >
                                        +
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Winner Preview */}
                        {scores.fighterA !== scores.fighterB && (
                            <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                                <div className="flex items-center gap-2 text-yellow-400 text-sm font-semibold">
                                    <Crown className="w-4 h-4" />
                                    <span>
                                        Winner: {scores.fighterA > scores.fighterB 
                                            ? scoringMatch.fighterA?.name 
                                            : scoringMatch.fighterB?.name}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                onClick={() => setScoringMatch(null)}
                                variant="outline"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmitScore}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                disabled={scores.fighterA === scores.fighterB}
                            >
                                Complete Match
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
