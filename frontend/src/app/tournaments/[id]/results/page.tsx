"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
    Trophy, Medal, Crown, Award, TrendingUp, Zap, Target, 
    Calendar, MapPin, Users, ArrowLeft, Download, Share2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
            alert('Link copied to clipboard!');
        }
    };

    const getMedalIcon = (place: number) => {
        if (place === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
        if (place === 2) return <Medal className="w-6 h-6 text-gray-400" />;
        return <Award className="w-6 h-6 text-orange-600" />;
    };

    const getPodiumHeight = (place: number) => {
        if (place === 1) return "h-48";
        if (place === 2) return "h-40";
        return "h-32";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-yellow-950/20 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white/60">Loading results...</p>
                </div>
            </div>
        );
    }

    if (!statistics) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-yellow-950/20 flex items-center justify-center">
                <div className="text-center text-white">
                    <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                    <h1 className="text-2xl font-bold mb-2">Results Not Available</h1>
                    <p className="text-white/60">Tournament results will be published after completion.</p>
                </div>
            </div>
        );
    }

    const topThreeDojos = statistics.dojoLeaderboard.slice(0, 3);

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-yellow-950/20 text-white">
            {/* Header */}
            <div className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Link href={`/tournaments/${id}/view`} className="inline-flex items-center text-white/60 hover:text-white mb-2 text-sm transition-colors">
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Back to Brackets
                            </Link>
                            <div className="flex items-center gap-3">
                                <Trophy className="w-8 h-8 text-yellow-500" />
                                <div>
                                    <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">
                                        {statistics.tournament.name}
                                    </h1>
                                    <div className="flex items-center gap-4 text-xs text-white/60 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(statistics.tournament.date).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {statistics.tournament.location}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            {statistics.tournament.totalParticipants} participants
                                        </span>
                                    </div>
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
                                size="sm"
                                variant="outline"
                                className="hidden md:flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export PDF
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                {/* Tournament Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-black/40 border border-white/10 rounded-xl p-4 text-center"
                    >
                        <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold">{statistics.tournament.totalCategories}</div>
                        <div className="text-sm text-white/60">Categories</div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-black/40 border border-white/10 rounded-xl p-4 text-center"
                    >
                        <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold">{statistics.tournament.totalParticipants}</div>
                        <div className="text-sm text-white/60">Participants</div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-black/40 border border-white/10 rounded-xl p-4 text-center"
                    >
                        <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold">{statistics.tournament.completedMatches}</div>
                        <div className="text-sm text-white/60">Matches Completed</div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-black/40 border border-white/10 rounded-xl p-4 text-center"
                    >
                        <Award className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold">{statistics.dojoLeaderboard.length}</div>
                        <div className="text-sm text-white/60">Dojos</div>
                    </motion.div>
                </div>

                {/* Dojo Podium */}
                {topThreeDojos.length >= 3 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-b from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-2xl p-8"
                    >
                        <h2 className="text-2xl font-black uppercase tracking-tight mb-8 text-center flex items-center justify-center gap-2">
                            <Crown className="w-8 h-8 text-yellow-500" />
                            Top Performing Dojos
                        </h2>

                        <div className="flex items-end justify-center gap-4 max-w-3xl mx-auto">
                            {/* Second Place */}
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="flex-1 text-center"
                            >
                                <div className={`${getPodiumHeight(2)} bg-gradient-to-t from-gray-400/20 to-gray-400/5 border-2 border-gray-400 rounded-t-xl flex flex-col items-center justify-end pb-4 relative`}>
                                    <div className="absolute -top-16">
                                        <div className="w-20 h-20 bg-gray-400/20 border-2 border-gray-400 rounded-full flex items-center justify-center mb-2">
                                            <Medal className="w-10 h-10 text-gray-400" />
                                        </div>
                                    </div>
                                    <div className="text-4xl font-black text-gray-400 mb-2">2</div>
                                    <div className="font-bold text-sm">{topThreeDojos[1]?.dojoName}</div>
                                    <div className="text-xs text-white/60 mt-2">
                                        🥇{topThreeDojos[1]?.gold} 🥈{topThreeDojos[1]?.silver} 🥉{topThreeDojos[1]?.bronze}
                                    </div>
                                </div>
                            </motion.div>

                            {/* First Place */}
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="flex-1 text-center"
                            >
                                <div className={`${getPodiumHeight(1)} bg-gradient-to-t from-yellow-500/20 to-yellow-500/5 border-2 border-yellow-500 rounded-t-xl flex flex-col items-center justify-end pb-4 relative`}>
                                    <div className="absolute -top-20">
                                        <div className="w-24 h-24 bg-yellow-500/20 border-4 border-yellow-500 rounded-full flex items-center justify-center mb-2 animate-pulse">
                                            <Crown className="w-12 h-12 text-yellow-500" />
                                        </div>
                                    </div>
                                    <div className="text-5xl font-black text-yellow-500 mb-2">1</div>
                                    <div className="font-bold">{topThreeDojos[0]?.dojoName}</div>
                                    <div className="text-xs text-white/60 mt-2">
                                        🥇{topThreeDojos[0]?.gold} 🥈{topThreeDojos[0]?.silver} 🥉{topThreeDojos[0]?.bronze}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Third Place */}
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex-1 text-center"
                            >
                                <div className={`${getPodiumHeight(3)} bg-gradient-to-t from-orange-600/20 to-orange-600/5 border-2 border-orange-600 rounded-t-xl flex flex-col items-center justify-end pb-4 relative`}>
                                    <div className="absolute -top-14">
                                        <div className="w-16 h-16 bg-orange-600/20 border-2 border-orange-600 rounded-full flex items-center justify-center mb-2">
                                            <Award className="w-8 h-8 text-orange-600" />
                                        </div>
                                    </div>
                                    <div className="text-3xl font-black text-orange-600 mb-2">3</div>
                                    <div className="font-bold text-sm">{topThreeDojos[2]?.dojoName}</div>
                                    <div className="text-xs text-white/60 mt-2">
                                        🥇{topThreeDojos[2]?.gold} 🥈{topThreeDojos[2]?.silver} 🥉{topThreeDojos[2]?.bronze}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}

                {/* Performance Highlights */}
                {(statistics.performanceStats.fastestWin || statistics.performanceStats.highestScore || statistics.performanceStats.mostDominant) && (
                    <div className="grid md:grid-cols-3 gap-4">
                        {statistics.performanceStats.fastestWin && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-black/40 border border-blue-500/30 rounded-xl p-6"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <Zap className="w-8 h-8 text-blue-500" />
                                    <h3 className="font-bold">Fastest Win</h3>
                                </div>
                                <div className="text-3xl font-black text-blue-500 mb-2">
                                    {statistics.performanceStats.fastestWin.duration} min
                                </div>
                                <div className="text-white/80">{statistics.performanceStats.fastestWin.winner.name}</div>
                                <div className="text-sm text-white/50">{statistics.performanceStats.fastestWin.winner.dojoName}</div>
                            </motion.div>
                        )}

                        {statistics.performanceStats.highestScore && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-black/40 border border-green-500/30 rounded-xl p-6"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <TrendingUp className="w-8 h-8 text-green-500" />
                                    <h3 className="font-bold">Highest Score</h3>
                                </div>
                                <div className="text-3xl font-black text-green-500 mb-2">
                                    {statistics.performanceStats.highestScore.score} points
                                </div>
                                <div className="text-white/80">{statistics.performanceStats.highestScore.winner.name}</div>
                                <div className="text-sm text-white/50">{statistics.performanceStats.highestScore.winner.dojoName}</div>
                            </motion.div>
                        )}

                        {statistics.performanceStats.mostDominant && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-black/40 border border-red-500/30 rounded-xl p-6"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <Target className="w-8 h-8 text-red-500" />
                                    <h3 className="font-bold">Most Dominant</h3>
                                </div>
                                <div className="text-3xl font-black text-red-500 mb-2">
                                    {statistics.performanceStats.mostDominant.finalScore}
                                </div>
                                <div className="text-white/80">{statistics.performanceStats.mostDominant.winner.name}</div>
                                <div className="text-sm text-white/50">{statistics.performanceStats.mostDominant.winner.dojoName}</div>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* Category Winners */}
                <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-6 flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        Category Champions
                    </h2>

                    <div className="grid md:grid-cols-2 gap-4">
                        {statistics.categoryWinners.map((category, idx) => (
                            <motion.div
                                key={category.bracketId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white/5 border border-white/10 rounded-xl p-4"
                            >
                                <h3 className="font-bold text-lg mb-4 text-yellow-500">{category.categoryName}</h3>
                                
                                <div className="space-y-3">
                                    {category.firstPlace && (
                                        <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                            {getMedalIcon(1)}
                                            <div className="flex-1">
                                                <div className="font-bold">{category.firstPlace.name}</div>
                                                <div className="text-xs text-white/60">{category.firstPlace.dojoName}</div>
                                            </div>
                                            <div className="text-xs bg-yellow-500/20 px-2 py-1 rounded">1st</div>
                                        </div>
                                    )}

                                    {category.secondPlace && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-400/10 border border-gray-400/30 rounded-lg">
                                            {getMedalIcon(2)}
                                            <div className="flex-1">
                                                <div className="font-bold">{category.secondPlace.name}</div>
                                                <div className="text-xs text-white/60">{category.secondPlace.dojoName}</div>
                                            </div>
                                            <div className="text-xs bg-gray-400/20 px-2 py-1 rounded">2nd</div>
                                        </div>
                                    )}

                                    {category.thirdPlace && (
                                        <div className="flex items-center gap-3 p-3 bg-orange-600/10 border border-orange-600/30 rounded-lg">
                                            {getMedalIcon(3)}
                                            <div className="flex-1">
                                                <div className="font-bold">{category.thirdPlace.name}</div>
                                                <div className="text-xs text-white/60">{category.thirdPlace.dojoName}</div>
                                            </div>
                                            <div className="text-xs bg-orange-600/20 px-2 py-1 rounded">3rd</div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Full Dojo Leaderboard */}
                <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-6 flex items-center gap-2">
                        <Award className="w-6 h-6 text-purple-500" />
                        Dojo Medal Standings
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-white/60 font-semibold">Rank</th>
                                    <th className="text-left py-3 px-4 text-white/60 font-semibold">Dojo</th>
                                    <th className="text-center py-3 px-4 text-white/60 font-semibold">🥇</th>
                                    <th className="text-center py-3 px-4 text-white/60 font-semibold">🥈</th>
                                    <th className="text-center py-3 px-4 text-white/60 font-semibold">🥉</th>
                                    <th className="text-center py-3 px-4 text-white/60 font-semibold">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {statistics.dojoLeaderboard.map((dojo, idx) => (
                                    <motion.tr
                                        key={dojo.dojoName}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                    >
                                        <td className="py-3 px-4">
                                            <div className="font-bold text-lg">{idx + 1}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-bold">{dojo.dojoName}</div>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="text-yellow-500 font-bold">{dojo.gold}</span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="text-gray-400 font-bold">{dojo.silver}</span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="text-orange-600 font-bold">{dojo.bronze}</span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="text-white font-black text-lg">{dojo.total}</span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 bg-black/40 backdrop-blur-md mt-12">
                <div className="max-w-7xl mx-auto px-4 py-6 text-center">
                    <p className="text-white/40 text-sm">
                        Tournament Results & Statistics • {new Date(statistics.tournament.date).toLocaleDateString()}
                    </p>
                </div>
            </div>
        </div>
    );
}
