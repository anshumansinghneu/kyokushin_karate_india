"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Shield, Activity } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import BracketGenerator from "@/components/tournaments/BracketGenerator";
import BracketTree from "@/components/tournaments/BracketTree";
import LiveMatchControl from "@/components/tournaments/LiveMatchControl";
import LiveMatchViewer from "@/components/tournaments/LiveMatchViewer";

export default function TournamentBracketPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState<any>(null);
    const [brackets, setBrackets] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'brackets' | 'live' | 'admin'>('brackets');
    const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [eventRes, bracketsRes] = await Promise.all([
                api.get(`/events/${id}`),
                api.get(`/tournaments/${id}`)
            ]);
            setEvent(eventRes.data.data.event);
            setBrackets(bracketsRes.data.data.brackets);
        } catch (error) {
            console.error("Failed to fetch tournament data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!event) return <div>Event not found</div>;

    const isAdmin = user?.role === 'ADMIN';
    const hasBrackets = brackets.length > 0;

    return (
        <div className="min-h-screen bg-black text-white p-6 pb-24">
            <div className="max-w-7xl mx-auto">
                <Link href={`/events/${id}`} className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Event
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">{event.name}</h1>
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Shield className="w-4 h-4" />
                            <span>Tournament Bracket</span>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                        <button
                            onClick={() => setActiveTab('brackets')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'brackets' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            Brackets
                        </button>
                        <button
                            onClick={() => setActiveTab('live')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'live' ? 'bg-red-900/20 text-red-500 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            <Activity className="w-3 h-3" />
                            Live Matches
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('admin')}
                                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'admin' ? 'bg-yellow-500/20 text-yellow-500 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                Admin Controls
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-8">
                    {activeTab === 'admin' && isAdmin && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <h2 className="text-xl font-bold mb-4 text-zinc-300">Bracket Generation</h2>
                                    <BracketGenerator eventId={id as string} onBracketsGenerated={fetchData} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold mb-4 text-zinc-300">Live Match Management</h2>
                                    {selectedMatchId ? (
                                        <LiveMatchControl matchId={selectedMatchId} onMatchUpdated={fetchData} />
                                    ) : (
                                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center text-zinc-500">
                                            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                            <p>Select a match from the bracket to manage it.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'brackets' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            {!hasBrackets ? (
                                <div className="text-center py-24 text-zinc-500">
                                    <Trophy className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <h3 className="text-xl font-bold text-zinc-400 mb-2">Brackets Not Generated</h3>
                                    <p>The tournament brackets have not been finalized yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-12">
                                    {brackets.map((bracket) => (
                                        <div key={bracket.id} className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 overflow-hidden">
                                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                                <span className="w-1 h-6 bg-yellow-500 rounded-full" />
                                                {bracket.categoryName}
                                            </h3>
                                            <div className="overflow-x-auto">
                                                {/* We need to pass matches to BracketTree. 
                                                    Assuming bracket.matches is populated. */}
                                                <div onClick={(e) => {
                                                    // Hacky way to detect match click for Admin
                                                    // Ideally BracketTree should accept onMatchClick
                                                    // For now, we'll rely on a better implementation in BracketTree if we want interactivity
                                                }}>
                                                    <BracketTree matches={bracket.matches} />
                                                </div>
                                            </div>

                                            {/* Admin Match Selector (Temporary for MVP) */}
                                            {isAdmin && (
                                                <div className="mt-6 pt-6 border-t border-zinc-900">
                                                    <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Admin Quick Select</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {bracket.matches.map((m: any) => (
                                                            <button
                                                                key={m.id}
                                                                onClick={() => { setSelectedMatchId(m.id); setActiveTab('admin'); }}
                                                                className={`px-3 py-1 text-xs rounded border ${m.status === 'LIVE' ? 'bg-red-900/20 border-red-500/50 text-red-400' :
                                                                        m.status === 'COMPLETED' ? 'bg-green-900/20 border-green-500/50 text-green-400' :
                                                                            'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                                                                    }`}
                                                            >
                                                                #{m.matchNumber}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'live' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <LiveMatchViewer />
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
