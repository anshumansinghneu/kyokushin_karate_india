"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Award, ArrowUp, Clock, User, ChevronDown, ChevronUp } from "lucide-react";
import api from "@/lib/api";

interface BeltRecord {
    id: string;
    oldBelt: string | null;
    newBelt: string;
    promotedBy: string;
    promoter: { name: string };
    promotionDate: string;
    notes: string | null;
}

const BELT_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    "White": { bg: "bg-white/10", border: "border-white/30", text: "text-white", dot: "bg-white" },
    "Orange": { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", dot: "bg-orange-500" },
    "Blue": { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", dot: "bg-blue-500" },
    "Yellow": { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", dot: "bg-yellow-500" },
    "Green": { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", dot: "bg-green-500" },
    "Brown": { bg: "bg-amber-700/10", border: "border-amber-700/30", text: "text-amber-500", dot: "bg-amber-700" },
    "Black": { bg: "bg-gray-800/50", border: "border-gray-500/30", text: "text-white", dot: "bg-gray-900 ring-2 ring-white/30" },
    "1st Dan": { bg: "bg-gray-800/50", border: "border-yellow-600/30", text: "text-yellow-400", dot: "bg-gray-900 ring-2 ring-yellow-600" },
    "2nd Dan": { bg: "bg-gray-800/50", border: "border-yellow-500/30", text: "text-yellow-300", dot: "bg-gray-900 ring-2 ring-yellow-500" },
    "3rd Dan": { bg: "bg-gray-800/50", border: "border-red-500/30", text: "text-red-400", dot: "bg-gray-900 ring-2 ring-red-500" },
};

function getBeltStyle(belt: string) {
    for (const [key, style] of Object.entries(BELT_COLORS)) {
        if (belt.includes(key)) return style;
    }
    return BELT_COLORS["White"];
}

function daysBetween(d1: string, d2: string) {
    return Math.floor((new Date(d2).getTime() - new Date(d1).getTime()) / (1000 * 60 * 60 * 24));
}

export default function BeltTimeline({ userId }: { userId: string }) {
    const [history, setHistory] = useState<BeltRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get(`/belts/history/${userId}`);
                setHistory(res.data.data.history || res.data.data.beltHistory || []);
            } catch {
                // silent
            } finally {
                setLoading(false);
            }
        };
        if (userId) fetchHistory();
    }, [userId]);

    if (loading) {
        return (
            <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-lg font-bold text-white">Belt Journey</h3>
                </div>
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-yellow-500" />
                </div>
            </div>
        );
    }

    if (history.length === 0) {
        return null;
    }

    // Sort by date (oldest first for timeline)
    const sorted = [...history].sort(
        (a, b) => new Date(a.promotionDate).getTime() - new Date(b.promotionDate).getTime()
    );

    const totalDays = sorted.length >= 2
        ? daysBetween(sorted[0].promotionDate, sorted[sorted.length - 1].promotionDate)
        : 0;

    return (
        <div className="glass-card p-6">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center justify-between w-full mb-4"
            >
                <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-lg font-bold text-white">Belt Journey</h3>
                    <span className="text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">
                        {sorted.length} promotion{sorted.length !== 1 ? 's' : ''}
                    </span>
                </div>
                {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {expanded && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Summary Stats */}
                    {totalDays > 0 && (
                        <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
                            <div className="bg-white/5 rounded-lg px-3 py-2 text-center flex-shrink-0">
                                <p className="text-lg font-bold text-white">{sorted.length}</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Promotions</p>
                            </div>
                            <div className="bg-white/5 rounded-lg px-3 py-2 text-center flex-shrink-0">
                                <p className="text-lg font-bold text-white">{Math.floor(totalDays / 365)}y {Math.floor((totalDays % 365) / 30)}m</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Journey</p>
                            </div>
                            <div className="bg-white/5 rounded-lg px-3 py-2 text-center flex-shrink-0">
                                <p className="text-lg font-bold text-white">{Math.round(totalDays / sorted.length)}</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Avg Days</p>
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-white/20 via-yellow-500/30 to-red-500/30" />

                        <div className="space-y-0">
                            {sorted.map((record, index) => {
                                const style = getBeltStyle(record.newBelt);
                                const daysFromPrev = index > 0
                                    ? daysBetween(sorted[index - 1].promotionDate, record.promotionDate)
                                    : 0;
                                const isLatest = index === sorted.length - 1;

                                return (
                                    <motion.div
                                        key={record.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="relative pl-10 pb-6 last:pb-0"
                                    >
                                        {/* Timeline dot */}
                                        <div className={`absolute left-[9px] top-1 w-3.5 h-3.5 rounded-full ${style.dot} ${isLatest ? 'animate-pulse' : ''}`} />

                                        {/* Days between label */}
                                        {daysFromPrev > 0 && (
                                            <div className="absolute left-[-4px] top-[-12px] flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5 text-gray-600" />
                                                <span className="text-[9px] text-gray-600 font-medium">{daysFromPrev}d</span>
                                            </div>
                                        )}

                                        {/* Card */}
                                        <div className={`${style.bg} border ${style.border} rounded-lg p-3 ${isLatest ? 'ring-1 ring-yellow-500/20' : ''}`}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    {record.oldBelt && (
                                                        <>
                                                            <span className={`text-xs font-bold ${getBeltStyle(record.oldBelt).text} opacity-70`}>
                                                                {record.oldBelt}
                                                            </span>
                                                            <ArrowUp className="w-3 h-3 text-green-400 rotate-45" />
                                                        </>
                                                    )}
                                                    <span className={`text-sm font-bold ${style.text}`}>
                                                        {record.newBelt}
                                                    </span>
                                                    {isLatest && (
                                                        <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full font-bold">
                                                            CURRENT
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-gray-500">
                                                    {new Date(record.promotionDate).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                                <User className="w-3 h-3" />
                                                <span>Promoted by {record.promoter.name}</span>
                                            </div>
                                            {record.notes && (
                                                <p className="text-[11px] text-gray-500 mt-1 italic">&ldquo;{record.notes}&rdquo;</p>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
