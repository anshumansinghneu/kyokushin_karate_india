"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Trophy, Calendar, MapPin, Users, Eye, Medal,
    Search, ChevronDown, ChevronUp, ExternalLink, Loader2, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import Link from "next/link";

interface Tournament {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    location: string;
    type: string;
    status: string;
    _count?: {
        registrations: number;
        results: number;
    };
}

interface BracketData {
    id: string;
    eventId: string;
    categoryName: string;
    totalRounds: number;
    status: string;
    matches: MatchData[];
}

interface MatchData {
    id: string;
    roundNumber: number;
    roundName: string;
    matchNumber: number;
    fighterAName: string | null;
    fighterBName: string | null;
    fighterAScore: number | null;
    fighterBScore: number | null;
    winnerId: string | null;
    isBye: boolean;
    status: string;
}

export default function TournamentViewer() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [brackets, setBrackets] = useState<Record<string, BracketData[]>>({});
    const [loadingBrackets, setLoadingBrackets] = useState<string | null>(null);

    useEffect(() => {
        fetchTournaments();
    }, []);

    const fetchTournaments = async () => {
        try {
            setLoading(true);
            const res = await api.get("/events?type=TOURNAMENT");
            const events = res.data.data.events || [];
            setTournaments(events);
        } catch (error) {
            console.error("Failed to fetch tournaments", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBrackets = async (eventId: string) => {
        if (brackets[eventId]) return; // Already loaded
        try {
            setLoadingBrackets(eventId);
            const res = await api.get(`/tournaments/${eventId}`);
            setBrackets(prev => ({ ...prev, [eventId]: res.data.data.brackets || [] }));
        } catch (error) {
            console.error("Failed to fetch brackets", error);
            setBrackets(prev => ({ ...prev, [eventId]: [] }));
        } finally {
            setLoadingBrackets(null);
        }
    };

    const toggleExpand = (id: string) => {
        if (expandedId === id) {
            setExpandedId(null);
        } else {
            setExpandedId(id);
            fetchBrackets(id);
        }
    };

    const filtered = tournaments.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const statusBadge = (status: string) => {
        const styles: Record<string, string> = {
            UPCOMING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
            REGISTRATION_OPEN: "bg-green-500/10 text-green-400 border-green-500/20",
            ONGOING: "bg-orange-500/10 text-orange-400 border-orange-500/20",
            COMPLETED: "bg-gray-500/10 text-gray-400 border-gray-500/20",
        };
        return styles[status] || "bg-gray-500/10 text-gray-400 border-gray-500/20";
    };

    const bracketStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            LOCKED: "bg-yellow-500/10 text-yellow-400",
            IN_PROGRESS: "bg-orange-500/10 text-orange-400",
            COMPLETED: "bg-green-500/10 text-green-400",
        };
        return styles[status] || "bg-gray-500/10 text-gray-400";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white mb-1">Tournament Fixtures</h1>
                    <p className="text-gray-400 text-sm">View brackets and results for all tournaments (read-only).</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                    placeholder="Search tournaments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
            </div>

            {/* Info Banner */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-300/80">
                    Tournament creation, editing, bracket generation, and scoring are managed by the admin.
                    You can view published brackets and final fixtures here.
                </div>
            </div>

            {/* Tournament List */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="font-bold">No tournaments found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map((t, i) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/10 transition-colors"
                        >
                            {/* Tournament Card Header */}
                            <div
                                className="p-5 cursor-pointer"
                                onClick={() => toggleExpand(t.id)}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600/20 to-orange-600/20 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                                            <Trophy className="w-6 h-6 text-red-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{t.name}</h3>
                                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(t.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                                {t.location && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        {t.location}
                                                    </span>
                                                )}
                                                {t._count && (
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-3.5 h-3.5" />
                                                        {t._count.registrations} registered
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusBadge(t.status)}`}>
                                            {t.status.replace(/_/g, ' ')}
                                        </span>
                                        {expandedId === t.id ? (
                                            <ChevronUp className="w-5 h-5 text-gray-500" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-500" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Bracket View */}
                            <AnimatePresence>
                                {expandedId === t.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-5 pb-5 border-t border-white/5 pt-4">
                                            {loadingBrackets === t.id ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                                                </div>
                                            ) : !brackets[t.id] || brackets[t.id].length === 0 ? (
                                                <div className="text-center py-8 text-gray-500">
                                                    <Medal className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                                    <p className="text-sm font-medium">No brackets generated yet</p>
                                                    <p className="text-xs mt-1">The admin will generate brackets when ready.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {/* Category Brackets */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {brackets[t.id].map((bracket) => (
                                                            <div
                                                                key={bracket.id}
                                                                className="bg-white/[0.03] rounded-lg border border-white/[0.06] p-4"
                                                            >
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <h4 className="text-sm font-bold text-white">{bracket.categoryName}</h4>
                                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${bracketStatusBadge(bracket.status)}`}>
                                                                        {bracket.status}
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-gray-400 space-y-1">
                                                                    <p>{bracket.totalRounds} rounds &middot; {bracket.matches.length} matches</p>
                                                                    {bracket.matches.filter(m => m.status === 'COMPLETED').length > 0 && (
                                                                        <p className="text-green-400">
                                                                            {bracket.matches.filter(m => m.status === 'COMPLETED').length}/{bracket.matches.length} completed
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                {/* Final Match / Winner */}
                                                                {bracket.status === 'COMPLETED' && (() => {
                                                                    const finalMatch = bracket.matches.find(m => m.roundName?.toLowerCase().includes('final') && !m.roundName?.toLowerCase().includes('semi'));
                                                                    const winnerName = finalMatch?.winnerId
                                                                        ? (finalMatch.winnerId === finalMatch.fighterAName ? finalMatch.fighterAName : finalMatch.fighterBName)
                                                                        : null;
                                                                    // Try to find winner by checking scores
                                                                    const winner = finalMatch
                                                                        ? (finalMatch.fighterAScore != null && finalMatch.fighterBScore != null
                                                                            ? (finalMatch.fighterAScore > finalMatch.fighterBScore ? finalMatch.fighterAName : finalMatch.fighterBName)
                                                                            : winnerName)
                                                                        : null;
                                                                    return winner ? (
                                                                        <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
                                                                            <Medal className="w-4 h-4 text-yellow-400" />
                                                                            <span className="text-xs font-bold text-yellow-400">Winner: {winner}</span>
                                                                        </div>
                                                                    ) : null;
                                                                })()}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* View Full Bracket Link */}
                                                    <div className="flex justify-center pt-2">
                                                        <Link href={`/tournaments/${t.id}/bracket`}>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
                                                            >
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                View Full Bracket
                                                                <ExternalLink className="w-3.5 h-3.5 ml-2" />
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/tournaments/${t.id}/results`} className="ml-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
                                                            >
                                                                <Medal className="w-4 h-4 mr-2" />
                                                                View Results
                                                                <ExternalLink className="w-3.5 h-3.5 ml-2" />
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
