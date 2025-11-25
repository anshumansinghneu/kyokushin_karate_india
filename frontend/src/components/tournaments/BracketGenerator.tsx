import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Shuffle, AlertCircle, CheckCircle } from 'lucide-react';
import api from '@/lib/api';

interface BracketGeneratorProps {
    eventId: string;
    onBracketsGenerated: () => void;
}

const BracketGenerator: React.FC<BracketGeneratorProps> = ({ eventId, onBracketsGenerated }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await api.post(`/tournaments/${eventId}/generate`);
            setSuccess('Brackets generated successfully!');
            onBracketsGenerated();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to generate brackets.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        Bracket Generator
                    </h3>
                    <p className="text-zinc-400 text-sm mt-1">
                        Automatically seed participants and create tournament brackets based on categories.
                    </p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                    <Shuffle className="w-6 h-6 text-yellow-500" />
                </div>
            </div>

            <div className="space-y-4">
                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                    <h4 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Generation Rules
                    </h4>
                    <ul className="text-xs text-zinc-500 space-y-1 list-disc pl-4">
                        <li>Participants are grouped by Age, Weight, and Belt.</li>
                        <li>Categories with fewer than 2 participants will be skipped.</li>
                        <li>Seeding is randomized (or based on rank if available).</li>
                        <li>Existing draft brackets will be overwritten.</li>
                    </ul>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm"
                    >
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </motion.div>
                )}

                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-400 text-sm"
                    >
                        <CheckCircle className="w-4 h-4" />
                        {success}
                    </motion.div>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${loading
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/20'
                        }`}
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Shuffle className="w-4 h-4" />
                            Generate Brackets
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default BracketGenerator;
