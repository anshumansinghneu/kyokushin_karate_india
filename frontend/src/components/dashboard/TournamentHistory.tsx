"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Calendar, MapPin, TrendingUp, Award, Activity } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

interface TournamentResult {
    id: string;
    finalRank: number;
    medal: string | null;
    totalMatches: number;
    matchesWon: number;
    matchesLost: number;
    categoryName: string;
    eliminatedInRound: string;
    event: {
        id: string;
        name: string;
        startDate: string;
        location: string;
        status: string;
    };
    bracket: {
        categoryName: string;
    };
}

interface Summary {
    totalTournaments: number;
    goldMedals: number;
    silverMedals: number;
    bronzeMedals: number;
    totalMedals: number;
    totalMatches: number;
    matchesWon: number;
    matchesLost: number;
    winRate: string;
}

interface Props {
    userId: string;
}

export default function TournamentHistory({ userId }: Props) {
    const { showToast } = useToast();
    const [summary, setSummary] = useState<Summary | null>(null);
    const [history, setHistory] = useState<TournamentResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTournamentHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const fetchTournamentHistory = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/winners/user/${userId}`);
            setSummary(response.data.data.summary);
            setHistory(response.data.data.history);
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            showToast((error as any).response?.data?.message || 'Failed to fetch tournament history', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getMedalIcon = (rank: number, medal: string | null) => {
        if (rank === 1 || medal === 'GOLD') return '🥇';
        if (rank === 2 || medal === 'SILVER') return '🥈';
        if (rank === 3 || medal === 'BRONZE') return '🥉';
        return `#${rank}`;
    };

    const getMedalColor = (medal: string | null) => {
        switch (medal) {
            case 'GOLD': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'SILVER': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
            case 'BRONZE': return 'text-orange-600 bg-orange-600/10 border-orange-600/20';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        }
    };

    if (loading) {
        return (
            <div className="bg-black/40 border border-white/10 rounded-3xl p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                </div>
            </div>
        );
    }

    if (!summary || history.length === 0) {
        return (
            <div className="bg-black/40 border border-white/10 rounded-3xl p-8">
                <div className="flex items-center gap-2 mb-6">
                    <Trophy className="w-6 h-6 text-red-600" />
                    <h2 className="text-xl font-bold text-white">Tournament History</h2>
                </div>
                <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No tournament results yet</p>
                    <p className="text-sm text-gray-500 mt-2">Your tournament achievements will appear here</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="bg-black/40 border border-white/10 rounded-3xl p-8">
                <div className="flex items-center gap-2 mb-6">
                    <Trophy className="w-6 h-6 text-red-600" />
                    <h2 className="text-xl font-bold text-white">Tournament Achievements</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {/* Total Tournaments */}
                    <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <Trophy className="w-5 h-5 text-blue-400" />
                            <span className="text-2xl font-bold text-white">{summary.totalTournaments}</span>
                        </div>
                        <p className="text-xs text-gray-400">Tournaments</p>
                    </div>

                    {/* Gold Medals */}
                    <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-yellow-500/30 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">🥇</span>
                            <span className="text-2xl font-bold text-white">{summary.goldMedals}</span>
                        </div>
                        <p className="text-xs text-gray-400">Gold Medals</p>
                    </div>

                    {/* Silver Medals */}
                    <div className="bg-gradient-to-br from-gray-600/20 to-gray-800/20 border border-gray-500/30 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">🥈</span>
                            <span className="text-2xl font-bold text-white">{summary.silverMedals}</span>
                        </div>
                        <p className="text-xs text-gray-400">Silver Medals</p>
                    </div>

                    {/* Bronze Medals */}
                    <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 border border-orange-500/30 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">🥉</span>
                            <span className="text-2xl font-bold text-white">{summary.bronzeMedals}</span>
                        </div>
                        <p className="text-xs text-gray-400">Bronze Medals</p>
                    </div>
                </div>

                {/* Win/Loss Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400">Win Rate</p>
                                <p className="text-2xl font-bold text-green-500">{summary.winRate}%</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-500" />
                        </div>
                    </div>

                    <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400">Total Matches</p>
                                <p className="text-2xl font-bold text-white">{summary.totalMatches}</p>
                            </div>
                            <Activity className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400">Record</p>
                                <p className="text-2xl font-bold text-white">{summary.matchesWon}W - {summary.matchesLost}L</p>
                            </div>
                            <Award className="w-8 h-8 text-purple-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tournament History */}
            <div className="bg-black/40 border border-white/10 rounded-3xl p-8">
                <div className="flex items-center gap-2 mb-6">
                    <Medal className="w-6 h-6 text-red-600" />
                    <h2 className="text-xl font-bold text-white">Competition History</h2>
                </div>

                <div className="space-y-4">
                    {history.map((result, index) => (
                        <motion.div
                            key={result.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-red-600 transition"
                        >
                            <div className="flex items-start justify-between gap-4">
                                {/* Medal/Position */}
                                <div className={`flex-shrink-0 w-16 h-16 rounded-lg border flex items-center justify-center ${getMedalColor(result.medal)}`}>
                                    <span className="text-3xl">{getMedalIcon(result.finalRank, result.medal)}</span>
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white mb-1">{result.event.name}</h3>
                                    <p className="text-sm text-gray-400 mb-2">{result.categoryName}</p>

                                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>{new Date(result.event.startDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            <span>{result.event.location}</span>
                                        </div>
                                        <div className="px-2 py-1 bg-gray-700 rounded">
                                            {result.eliminatedInRound}
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex-shrink-0 text-right">
                                    <div className="text-lg font-bold text-white mb-1">
                                        {result.matchesWon}W - {result.matchesLost}L
                                    </div>
                                    <p className="text-xs text-gray-400">{result.totalMatches} matches</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
