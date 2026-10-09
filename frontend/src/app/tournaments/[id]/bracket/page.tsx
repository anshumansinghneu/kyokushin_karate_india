"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Activity } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import BracketGenerator from "@/components/tournaments/BracketGenerator";
import BracketTree, { type BracketTreeMatch } from "@/components/tournaments/BracketTree";
import LiveMatchControl from "@/components/tournaments/LiveMatchControl";
import LiveMatchViewer from "@/components/tournaments/LiveMatchViewer";

import KarateLoader from '@/components/KarateLoader';
import InkSlot from "@/components/three/InkSlot";
interface BracketData {
    id: string;
    categoryName: string;
    matches: BracketTreeMatch[];
}

export default function TournamentBracketPage() {
    const { id } = useParams();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState<{ id: string; name: string } | null>(null);
    const [brackets, setBrackets] = useState<BracketData[]>([]);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-[70dvh] bg-black flex items-center justify-center">
                <KarateLoader label="Loading bracket" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="mx-auto flex min-h-[70dvh] max-w-xl flex-col items-start justify-center gap-6 px-4 text-white sm:px-6">
                <h1 className="text-3xl font-black uppercase tracking-[-0.02em]">Event not found<span className="text-primary">.</span></h1>
                <Link href="/events" className="inline-flex min-h-12 items-center border border-white/25 px-6 text-sm font-bold uppercase tracking-[0.1em] text-white hover:bg-white/10">All events</Link>
            </div>
        );
    }

    const isAdmin = user?.role === 'ADMIN';
    const anyLive = brackets.some((b) => b.matches?.some((m) => m.status === "LIVE"));
    const hasBrackets = brackets.length > 0;
    const tabs: { key: 'brackets' | 'live' | 'admin'; label: string }[] = [
        { key: 'brackets', label: 'Brackets' },
        { key: 'live', label: 'Live matches' },
        ...(isAdmin ? [{ key: 'admin' as const, label: 'Admin controls' }] : []),
    ];

    return (
        <div className="min-h-dvh text-white">
            {/* Ink hero: 試合; red only while a match is live. */}
            <header data-bleed className="relative overflow-hidden">
                <InkSlot kanji="試合" red={anyLive ? 0.7 : 0.08} />
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent md:bg-gradient-to-r md:from-black/85 md:via-black/35 md:to-transparent" />
                <div className="relative z-10 mx-auto flex min-h-[58svh] max-w-[1400px] flex-col justify-end px-4 pb-10 pt-[30svh] sm:px-6 md:pt-40 lg:px-8">
                <Link href={`/events/${id}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Event details
                </Link>

                <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-white/60">Tournament bracket</p>
                        <h1 className="mt-3 max-w-[20ch] text-balance text-[clamp(2rem,5vw,3.75rem)] font-black uppercase leading-[0.95] tracking-[-0.03em]">{event.name}</h1>
                    </div>

                    <div role="tablist" aria-label="View" className="flex border border-white/15">
                        {tabs.map((t) => {
                            const on = activeTab === t.key;
                            return (
                                <button
                                    key={t.key}
                                    role="tab"
                                    aria-selected={on}
                                    onClick={() => setActiveTab(t.key)}
                                    className={`flex min-h-11 items-center gap-2 px-4 text-sm font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${on ? "bg-white text-black" : "text-white/65 hover:text-white"}`}
                                >
                                    {t.key === 'live' && <Activity className={`h-3.5 w-3.5 ${on ? "text-primary" : ""}`} aria-hidden="true" />}
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                </div>
            </header>
            <div className="mx-auto max-w-[1400px] px-4 pb-24 sm:px-6 lg:px-8">
                <div className="mt-4 space-y-8">
                    {activeTab === 'admin' && isAdmin && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
                                <div>
                                    <h2 className="mb-4 text-xl font-extrabold">Bracket generation</h2>
                                    <BracketGenerator eventId={id as string} onBracketsGenerated={fetchData} />
                                </div>
                                <div>
                                    <h2 className="mb-4 text-xl font-extrabold">Live match management</h2>
                                    {selectedMatchId ? (
                                        <LiveMatchControl matchId={selectedMatchId} onMatchUpdated={fetchData} />
                                    ) : (
                                        <p className="border-y border-white/10 py-12 text-white/65">Pick a match number under a bracket to manage it.</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'brackets' && (
                        !hasBrackets ? (
                            <div className="border-y border-white/10 py-16">
                                <p className="text-2xl font-extrabold">Brackets not drawn yet.</p>
                                <p className="mt-3 max-w-[46ch] leading-relaxed text-white/70">The draw has not been finalised. Brackets appear here as soon as it is.</p>
                            </div>
                        ) : (
                            <div className="space-y-16">
                                {brackets.map((bracket) => (
                                    <section key={bracket.id} aria-label={bracket.categoryName}>
                                        <h2 className="mb-6 border-b border-white/15 pb-3 text-xl font-extrabold md:text-2xl">{bracket.categoryName}</h2>
                                        <BracketTree matches={bracket.matches} />

                                        {isAdmin && (
                                            <div className="mt-6 border-t border-white/10 pt-6">
                                                <p className="mb-3 text-sm font-semibold text-white/60">Manage a match</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {bracket.matches.map((m) => (
                                                        <button
                                                            key={m.id}
                                                            onClick={() => { setSelectedMatchId(m.id); setActiveTab('admin'); }}
                                                            className={`min-h-10 border px-3 text-sm font-semibold tabular-nums ${m.status === 'LIVE' ? 'border-primary text-primary-light' : m.status === 'COMPLETED' ? 'border-white/10 text-white/45' : 'border-white/20 text-white/75 hover:bg-white/10'}`}
                                                        >
                                                            #{m.matchNumber}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </section>
                                ))}
                            </div>
                        )
                    )}

                    {activeTab === 'live' && <LiveMatchViewer />}
                </div>
            </div>
        </div>
    );
}
