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
            <div className="glass-card p-6 animate-pulse space-y-4">
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

    return (
        <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-white/5">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Swords className="w-5 h-5 text-red-500" />
                    Fight Record
                </h3>
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
                        <p className={`text-xl sm:text-2xl font-black ${stat.color}`}>{stat.value}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Medals */}
            {(record.medals.gold + record.medals.silver + record.medals.bronze > 0) && (
                <div className="flex items-center gap-4 px-5 py-3 border-t border-white/5 bg-white/[0.02]">
                    <Medal className="w-4 h-4 text-gray-400" />
                    {record.medals.gold > 0 && (
                        <span className="text-xs font-bold text-yellow-500">🥇 {record.medals.gold}</span>
                    )}
                    {record.medals.silver > 0 && (
                        <span className="text-xs font-bold text-gray-300">🥈 {record.medals.silver}</span>
                    )}
                    {record.medals.bronze > 0 && (
                        <span className="text-xs font-bold text-orange-600">🥉 {record.medals.bronze}</span>
                    )}
                </div>
            )}

            {/* Recent results */}
            {record.results.length > 0 && (
                <div className="border-t border-white/5">
                    <div className="px-5 py-3 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recent Results</span>
                    </div>
                    <div className="px-5 pb-4 space-y-2">
                        {record.results.slice(0, 3).map((r, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{r.eventName}</p>
                                    <p className="text-[10px] text-gray-500">{r.categoryName}</p>
                                </div>
                                <div className="text-right ml-4">
                                    <p className="text-sm font-black text-white">#{r.finalRank}</p>
                                    <p className="text-[10px] text-gray-500">{r.matchesWon}W-{r.matchesLost}L</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
