import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, User } from 'lucide-react';
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
}

const LiveMatchViewer: React.FC = () => {
    const [liveMatches, setLiveMatches] = useState<Match[]>([]);
    const [socket, setSocket] = useState<any>(null);

    useEffect(() => {
        // Initial fetch of live matches
        const fetchLiveMatches = async () => {
            try {
                // We need an endpoint for live matches, or filter from all matches.
                // For now, let's assume we can get them or just wait for socket events.
                // Ideally: GET /matches?status=LIVE
                // Mocking initial state or waiting for updates.
            } catch (err) {
                console.error(err);
            }
        };

        fetchLiveMatches();

        const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
        setSocket(newSocket);

        newSocket.on('match:started', (data: any) => {
            setLiveMatches(prev => [...prev, { ...data, status: 'LIVE', fighterAScore: 0, fighterBScore: 0 }]);
        });

        newSocket.on('match:update', (data: any) => {
            setLiveMatches(prev => prev.map(m =>
                m.id === data.matchId
                    ? { ...m, fighterAScore: data.fighterAScore, fighterBScore: data.fighterBScore }
                    : m
            ));
        });

        newSocket.on('match:ended', (data: any) => {
            setLiveMatches(prev => prev.filter(m => m.id !== data.matchId));
        });

        return () => { newSocket.close(); };
    }, []);

    if (liveMatches.length === 0) {
        return (
            <div className="text-center py-12 text-zinc-500">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No live matches at the moment.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
                {liveMatches.map((match) => (
                    <motion.div
                        key={match.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-zinc-900 border border-red-500/30 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.1)]"
                    >
                        <div className="bg-red-600 px-4 py-1 flex justify-between items-center">
                            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                LIVE
                            </span>
                            <span className="text-xs text-white/80">{match.roundName}</span>
                        </div>

                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <div className="text-center flex-1">
                                    <div className="text-3xl font-mono font-bold text-white mb-1">{match.fighterAScore || 0}</div>
                                    <div className="text-sm text-zinc-400 truncate px-2">{match.fighterAName}</div>
                                </div>
                                <div className="text-zinc-600 font-black text-xl">VS</div>
                                <div className="text-center flex-1">
                                    <div className="text-3xl font-mono font-bold text-white mb-1">{match.fighterBScore || 0}</div>
                                    <div className="text-sm text-zinc-400 truncate px-2">{match.fighterBName}</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default LiveMatchViewer;
