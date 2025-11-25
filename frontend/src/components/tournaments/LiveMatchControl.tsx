import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, Save, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { io } from 'socket.io-client';

interface Match {
    id: string;
    fighterAName: string;
    fighterBName: string;
    status: 'SCHEDULED' | 'LIVE' | 'COMPLETED';
    roundName: string;
    matchNumber: number;
}

interface LiveMatchControlProps {
    matchId: string;
    onMatchUpdated: () => void;
}

const LiveMatchControl: React.FC<LiveMatchControlProps> = ({ matchId, onMatchUpdated }) => {
    const [match, setMatch] = useState<Match | null>(null);
    const [scoreA, setScoreA] = useState(0);
    const [scoreB, setScoreB] = useState(0);
    const [loading, setLoading] = useState(false);
    const [socket, setSocket] = useState<any>(null);

    useEffect(() => {
        fetchMatch();

        // Socket connection
        const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
        setSocket(newSocket);

        return () => { newSocket.close(); };
    }, [matchId]);

    const fetchMatch = async () => {
        try {
            const res = await api.get(`/matches/${matchId}`);
            setMatch(res.data.data.match);
            // Parse scores from notes if available (mock implementation)
            // setScoreA(...)
        } catch (err) {
            console.error(err);
        }
    };

    const handleStart = async () => {
        setLoading(true);
        try {
            await api.post(`/matches/${matchId}/start`);
            fetchMatch();
            onMatchUpdated();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateScore = async () => {
        try {
            await api.patch(`/matches/${matchId}/score`, {
                fighterAScore: scoreA,
                fighterBScore: scoreB,
                notes: `Score: ${scoreA}-${scoreB}`
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleEnd = async (winnerId: string | null) => { // winnerId logic needs real IDs
        if (!confirm('Are you sure you want to end this match?')) return;
        setLoading(true);
        try {
            // For MVP, we need actual User IDs. 
            // Assuming match object has them, but here we simplified.
            // We'll pass the name for now or need to fetch full object.
            // Let's assume we pass the ID if we had it.
            // For now, just sending a placeholder or name as ID (which will fail backend validation if not UUID).
            // TODO: Fix this with real data.

            await api.post(`/matches/${matchId}/end`, {
                winnerId: winnerId, // This needs to be the UUID
                notes: `Final Score: ${scoreA}-${scoreB}`
            });
            fetchMatch();
            onMatchUpdated();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!match) return <div>Loading match...</div>;

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white">Match Control</h3>
                    <p className="text-zinc-400 text-sm">{match.roundName} - Match #{match.matchNumber}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${match.status === 'LIVE' ? 'bg-red-500/20 text-red-500 animate-pulse' :
                    match.status === 'COMPLETED' ? 'bg-green-500/20 text-green-500' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                    {match.status}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-8 items-center mb-8">
                {/* Fighter A */}
                <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">{match.fighterAName || 'TBD'}</div>
                    <div className="flex items-center justify-center gap-4">
                        <button onClick={() => { setScoreA(s => Math.max(0, s - 1)); handleUpdateScore(); }} className="w-8 h-8 rounded bg-zinc-800 hover:bg-zinc-700 text-white">-</button>
                        <span className="text-4xl font-mono font-bold text-yellow-500">{scoreA}</span>
                        <button onClick={() => { setScoreA(s => s + 1); handleUpdateScore(); }} className="w-8 h-8 rounded bg-zinc-800 hover:bg-zinc-700 text-white">+</button>
                    </div>
                </div>

                {/* VS */}
                <div className="text-center text-zinc-600 font-black text-2xl">VS</div>

                {/* Fighter B */}
                <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">{match.fighterBName || 'TBD'}</div>
                    <div className="flex items-center justify-center gap-4">
                        <button onClick={() => { setScoreB(s => Math.max(0, s - 1)); handleUpdateScore(); }} className="w-8 h-8 rounded bg-zinc-800 hover:bg-zinc-700 text-white">-</button>
                        <span className="text-4xl font-mono font-bold text-yellow-500">{scoreB}</span>
                        <button onClick={() => { setScoreB(s => s + 1); handleUpdateScore(); }} className="w-8 h-8 rounded bg-zinc-800 hover:bg-zinc-700 text-white">+</button>
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                {match.status === 'SCHEDULED' && (
                    <button
                        onClick={handleStart}
                        disabled={loading}
                        className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold flex items-center justify-center gap-2"
                    >
                        <Play className="w-4 h-4" /> Start Match
                    </button>
                )}

                {match.status === 'LIVE' && (
                    <>
                        <button
                            onClick={() => handleEnd(null)} // Needs actual winner selection logic
                            disabled={loading}
                            className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-bold flex items-center justify-center gap-2"
                        >
                            <Square className="w-4 h-4" /> End Match
                        </button>
                        {/* Add specific winner buttons here for MVP */}
                    </>
                )}
            </div>
        </div>
    );
};

export default LiveMatchControl;
