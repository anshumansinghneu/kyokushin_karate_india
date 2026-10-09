import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import api from '@/lib/api';

interface Match {
    id: string;
    fighterAName: string;
    fighterBName: string;
    status: 'SCHEDULED' | 'LIVE' | 'COMPLETED';
    roundName: string;
    matchNumber: number;
    fighterAScore?: number;
    fighterBScore?: number;
    categoryName?: string;
}

interface ApiMatch {
    id: string;
    fighterAName?: string | null;
    fighterBName?: string | null;
    fighterA?: { name?: string } | null;
    fighterB?: { name?: string } | null;
    status: Match['status'];
    roundName: string;
    matchNumber: number;
    fighterAScore?: number | null;
    fighterBScore?: number | null;
    bracket?: { categoryName?: string; event?: { name?: string } };
}

const LiveMatchViewer: React.FC = () => {
    const [liveMatches, setLiveMatches] = useState<Match[]>([]);

    useEffect(() => {
        const fetchLiveMatches = async () => {
            try {
                const res = await api.get('/matches/live');
                const matches = (res.data.data.matches as ApiMatch[]).map((m) => ({
                    id: m.id,
                    fighterAName: m.fighterAName || m.fighterA?.name || 'TBD',
                    fighterBName: m.fighterBName || m.fighterB?.name || 'TBD',
                    status: m.status,
                    roundName: m.roundName,
                    matchNumber: m.matchNumber,
                    fighterAScore: m.fighterAScore || 0,
                    fighterBScore: m.fighterBScore || 0,
                    categoryName: m.bracket?.categoryName,
                }));
                setLiveMatches(matches);
            } catch (err) {
                console.error('Failed to fetch live matches', err);
            }
        };

        fetchLiveMatches();

        const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000');

        socket.on('match:started', (data: Match) => {
            setLiveMatches(prev => [...prev, { ...data, status: 'LIVE', fighterAScore: 0, fighterBScore: 0 }]);
        });

        socket.on('match:update', (data: { matchId: string; fighterAScore: number; fighterBScore: number }) => {
            setLiveMatches(prev => prev.map(m =>
                m.id === data.matchId
                    ? { ...m, fighterAScore: data.fighterAScore, fighterBScore: data.fighterBScore }
                    : m
            ));
        });

        socket.on('match:ended', (data: { matchId: string }) => {
            setLiveMatches(prev => prev.filter(m => m.id !== data.matchId));
        });

        return () => { socket.close(); };
    }, []);

    if (liveMatches.length === 0) {
        return (
            <div className="border-y border-white/10 py-14">
                <p className="text-xl font-extrabold">No matches on the mat right now.</p>
                <p className="mt-2 text-white/65">Live scoreboards appear here the moment a match starts.</p>
            </div>
        );
    }

    return (
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-4">
            <AnimatePresence>
                {liveMatches.map((match) => (
                    <motion.li
                        key={match.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="overflow-hidden rounded-lg border border-primary/60 bg-surface"
                    >
                        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs font-semibold">
                            <span className="flex items-center gap-1.5 font-bold text-primary-light">
                                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Live
                            </span>
                            <span className="truncate pl-3 text-white/60">{match.categoryName || match.roundName}</span>
                        </div>
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-5 text-center">
                            <div className="min-w-0">
                                <div className="text-4xl font-black tabular-nums">{match.fighterAScore || 0}</div>
                                <div className="mt-2 truncate text-sm text-white/75">{match.fighterAName}</div>
                            </div>
                            <span className="text-sm font-bold text-white/35">vs</span>
                            <div className="min-w-0">
                                <div className="text-4xl font-black tabular-nums">{match.fighterBScore || 0}</div>
                                <div className="mt-2 truncate text-sm text-white/75">{match.fighterBName}</div>
                            </div>
                        </div>
                    </motion.li>
                ))}
            </AnimatePresence>
        </ul>
    );
};

export default LiveMatchViewer;
