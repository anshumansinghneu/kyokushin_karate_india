'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Shield, Swords, Medal, TrendingUp, Calendar, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

interface FightRecord {
    totalMatches: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    medals: { gold: number; silver: number; bronze: number };
    results: {
        id: string;
        eventName: string;
        eventDate: string;
        categoryName: string;
        finalRank: number;
        medal: string | null;
        totalMatches: number;
        matchesWon: number;
        matchesLost: number;
    }[];
}

export default function FightRecordCard({ userId }: { userId?: string }) {
    const [record, setRecord] = useState<FightRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore();

    useEffect(() => {
        const fetchRecord = async () => {
            try {
                const targetId = userId || user?.id;
                if (!targetId) return;
                const res = await api.get(`/results/fight-record/${targetId}`);
                if (res.data?.data) {
                    setRecord(res.data.data);
                }
            } catch {
                // No results yet
            } finally {
                setLoading(false);
            }
        };
        fetchRecord();
    }, [userId, user?.id]);

    if (loading) {
        return (
            <div className="rounded-2xl border border-white/[0.08] p-6 animate-pulse space-y-4">
                <div className="h-5 w-40 bg-white/10 rounded" />
                <div className="flex gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-16 flex-1 bg-white/10 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (!record || record.totalMatches === 0) {
        return null;
    }

    const totalMedals = record.medals.gold + record.medals.silver + record.medals.bronze;

    return (
        <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <Swords className="w-4 h-4 text-red-500" />
                    </div>
                    Fight Record
                </h3>
                {totalMedals > 0 && (
                    <div className="flex items-center gap-2.5 text-xs font-bold">
                        {record.medals.gold > 0 && <span className="text-yellow-500">🥇 {record.medals.gold}</span>}
                        {record.medals.silver > 0 && <span className="text-gray-300">🥈 {record.medals.silver}</span>}
                        {record.medals.bronze > 0 && <span className="text-orange-600">🥉 {record.medals.bronze}</span>}
                    </div>
                )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 divide-x divide-white/5">
                {[
                    { label: 'Fights', value: record.totalMatches, color: 'text-white' },
                    { label: 'Wins', value: record.wins, color: 'text-green-500' },
                    { label: 'Losses', value: record.losses, color: 'text-red-500' },
                    { label: 'Win %', value: `${record.winRate}%`, color: 'text-yellow-500' },
                ].map((stat, i) => (
                    <div key={i} className="p-4 text-center">
                        <p className={`text-xl sm:text-2xl font-black tabular-nums ${stat.color}`}>{stat.value}</p>
                        <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mt-0.5">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Win rate visual bar */}
            {record.totalMatches > 0 && (
                <div className="px-5 py-3 border-t border-white/5">
                    <div className="flex h-2 rounded-full overflow-hidden bg-white/5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(record.wins / record.totalMatches) * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                            className="bg-gradient-to-r from-green-500 to-green-600 rounded-l-full"
                        />
                        {record.draws > 0 && (
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(record.draws / record.totalMatches) * 100}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                                className="bg-gray-500"
                            />
                        )}
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(record.losses / record.totalMatches) * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
                            className="bg-gradient-to-r from-red-600 to-red-500 rounded-r-full"
                        />
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-[9px] font-bold text-gray-600">
                        <span>{record.wins}W</span>
                        {record.draws > 0 && <span>{record.draws}D</span>}
                        <span>{record.losses}L</span>
                    </div>
                </div>
            )}

            {/* Recent results */}
            {record.results.length > 0 && (
                <div className="border-t border-white/5">
                    <div className="px-5 py-3">
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Recent Results</span>
                    </div>
                    <div className="px-5 pb-4 space-y-2">
                        {record.results.slice(0, 3).map((r, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{r.eventName}</p>
                                    <p className="text-[10px] text-gray-500">{r.categoryName}</p>
                                </div>
                                <div className="text-right ml-4 flex items-center gap-3">
                                    <div>
                                        <p className="text-sm font-black text-white tabular-nums">#{r.finalRank}</p>
                                        <p className="text-[10px] text-gray-500 tabular-nums">{r.matchesWon}W-{r.matchesLost}L</p>
                                    </div>
                                    {r.medal && (
                                        <span className="text-lg">{r.medal === 'GOLD' ? '🥇' : r.medal === 'SILVER' ? '🥈' : '🥉'}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
