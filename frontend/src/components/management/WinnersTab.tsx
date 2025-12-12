"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Medal, Calendar, Users, Eye, TrendingUp, MapPin } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import Image from 'next/image';

interface Winner {
    finalRank: number;
    medal: string;
    totalMatches: number;
    matchesWon: number;
    matchesLost: number;
    user: {
        id: string;
        name: string;
        profilePhotoUrl?: string;
        currentBeltRank: string;
        dojo: {
            name: string;
            city: string;
        };
    };
    event: {
        id: string;
        name: string;
        startDate: string;
        location: string;
    };
    bracket: {
        categoryName: string;
    };
}

interface CategoryWinner {
    position: number;
    medal: string;
    user: {
        id: string;
        name: string;
        profilePhotoUrl?: string;
        currentBeltRank: string;
        dojo: {
            name: string;
            city: string;
        };
    };
    stats: {
        totalMatches: number;
        matchesWon: number;
        matchesLost: number;
    };
}

interface Category {
    categoryName: string;
    winners: CategoryWinner[];
}

interface Tournament {
    id: string;
    name: string;
    startDate: string;
    location: string;
    status: string;
    categories?: Category[];
}

export default function WinnersTab() {
    const { showToast } = useToast();
    const [recentWinners, setRecentWinners] = useState<Winner[]>([]);
    const [allTournaments, setAllTournaments] = useState<Tournament[]>([]);
    const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
    const [tournamentDetails, setTournamentDetails] = useState<Category[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        fetchRecentWinners();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchRecentWinners = async () => {
        try {
            setLoading(true);
            const response = await api.get('/winners/recent');
            setRecentWinners(response.data.data.winners);
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            showToast((error as any).response?.data?.message || 'Failed to fetch recent winners', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllTournaments = async () => {
        try {
            setLoading(true);
            const response = await api.get('/winners/all');
            setAllTournaments(response.data.data.tournaments);
            setShowAll(true);
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            showToast((error as any).response?.data?.message || 'Failed to fetch all tournaments', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchTournamentDetails = async (eventId: string) => {
        try {
            const response = await api.get(`/winners/tournament/${eventId}`);
            setTournamentDetails(response.data.data.categories);
            setSelectedTournament(eventId);
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            showToast((error as any).response?.data?.message || 'Failed to fetch tournament details', 'error');
        }
    };

    const getMedalIcon = (position: number) => {
        if (position === 1) return '🥇';
        if (position === 2) return '🥈';
        if (position === 3) return '🥉';
        return `#${position}`;
    };

    if (loading && recentWinners.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                        Tournament Winners
                    </h2>
                    <p className="text-gray-400 mt-1">
                        View champions and their achievements
                    </p>
                </div>
                {!showAll && (
                    <button
                        onClick={fetchAllTournaments}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                    >
                        <Eye className="h-4 w-4" />
                        View All Tournaments
                    </button>
                )}
            </div>

            {/* Recent Winners Section */}
            {!showAll && recentWinners.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-red-500" />
                        Recent Champions
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentWinners.map((winner, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-red-600 transition"
                            >
                                <div className="flex items-start gap-3">
                                    {/* Profile Picture */}
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                            {winner.user.profilePhotoUrl ? (
                                                <Image
                                                    src={winner.user.profilePhotoUrl}
                                                    alt={winner.user.name}
                                                    width={48}
                                                    height={48}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-lg font-bold text-white">
                                                    {winner.user.name.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="absolute -top-1 -right-1 text-xl">
                                            {getMedalIcon(winner.finalRank)}
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-white truncate">
                                            {winner.user.name}
                                        </h4>
                                        <p className="text-sm text-gray-400 truncate">
                                            {winner.bracket.categoryName}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                            <span>{winner.user.dojo.name}</span>
                                            <span>•</span>
                                            <span>{winner.user.currentBeltRank}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tournament Info */}
                                <div className="mt-3 pt-3 border-t border-gray-700">
                                    <p className="text-sm font-medium text-white truncate">
                                        {winner.event.name}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(winner.event.startDate).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {winner.event.location}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* All Tournaments Section */}
            {showAll && allTournaments.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Award className="h-5 w-5 text-yellow-500" />
                            All Tournament Results
                        </h3>
                        <button
                            onClick={() => setShowAll(false)}
                            className="text-gray-400 hover:text-white text-sm"
                        >
                            Back to Recent
                        </button>
                    </div>

                    <div className="grid gap-4">
                        {allTournaments.map((tournament) => (
                            <div
                                key={tournament.id}
                                className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden"
                            >
                                {/* Tournament Header */}
                                <div
                                    onClick={() => {
                                        if (selectedTournament === tournament.id) {
                                            setSelectedTournament(null);
                                            setTournamentDetails(null);
                                        } else {
                                            fetchTournamentDetails(tournament.id);
                                        }
                                    }}
                                    className="p-4 cursor-pointer hover:bg-gray-800/70 transition"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-semibold text-white text-lg">
                                                {tournament.name}
                                            </h4>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {new Date(tournament.startDate).toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-4 w-4" />
                                                    {tournament.location}
                                                </span>
                                                {tournament.categories && (
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-4 w-4" />
                                                        {tournament.categories.length} Categories
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button className="text-gray-400 hover:text-white">
                                            {selectedTournament === tournament.id ? '▼' : '▶'}
                                        </button>
                                    </div>
                                </div>

                                {/* Tournament Details */}
                                {selectedTournament === tournament.id && tournamentDetails && (
                                    <div className="border-t border-gray-700 p-4 bg-gray-900/50 space-y-4">
                                        {tournamentDetails.map((category, catIndex) => (
                                            <div key={catIndex} className="space-y-2">
                                                <h5 className="font-medium text-white flex items-center gap-2">
                                                    <Medal className="h-4 w-4 text-red-500" />
                                                    {category.categoryName}
                                                </h5>

                                                <div className="grid gap-2">
                                                    {category.winners.map((winner, winIndex) => (
                                                        <div
                                                            key={winIndex}
                                                            className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg"
                                                        >
                                                            <div className="text-2xl">
                                                                {getMedalIcon(winner.position)}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="font-medium text-white">
                                                                    {winner.user.name}
                                                                </p>
                                                                <p className="text-sm text-gray-400">
                                                                    {winner.user.dojo.name} • {winner.user.currentBeltRank}
                                                                </p>
                                                            </div>
                                                            <div className="text-right text-sm text-gray-400">
                                                                <p>{winner.stats.matchesWon}W - {winner.stats.matchesLost}L</p>
                                                                <p className="text-xs">{winner.stats.totalMatches} matches</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && recentWinners.length === 0 && (
                <div className="text-center py-12">
                    <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">
                        No Tournament Results Yet
                    </h3>
                    <p className="text-gray-500">
                        Tournament winners will appear here once results are recorded
                    </p>
                </div>
            )}
        </div>
    );
}
