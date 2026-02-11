import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Shuffle, AlertCircle, CheckCircle, XCircle, Target } from 'lucide-react';

interface BracketGeneratorProps {
    eventId: string;
    onBracketsGenerated: () => void;
}

interface ProgressLog {
    message: string;
    categoryName?: string;
    detail?: string;
    time: number;
}

const BracketGenerator: React.FC<BracketGeneratorProps> = ({ eventId, onBracketsGenerated }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Progress state
    const [progress, setProgress] = useState({
        show: false, phase: '', message: '', current: 0, total: 100,
        categoryName: '', detail: '', done: false, error: null as string | null,
        resultCount: 0, startTime: 0
    });
    const [logs, setLogs] = useState<ProgressLog[]>([]);
    const [elapsed, setElapsed] = useState(0);
    const logEndRef = useRef<HTMLDivElement>(null);

    // Update elapsed time every second while running
    useEffect(() => {
        if (!progress.show || progress.done) return;
        const timer = setInterval(() => {
            setElapsed(Math.floor((Date.now() - progress.startTime) / 1000));
        }, 1000);
        return () => clearInterval(timer);
    }, [progress.show, progress.done, progress.startTime]);

    // Auto-scroll log
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        setLogs([]);
        setElapsed(0);
        setProgress({
            show: true, phase: 'init', message: 'Connecting...', current: 0, total: 100,
            categoryName: '', detail: '', done: false, error: null, resultCount: 0, startTime: Date.now()
        });

        try {
            const token = localStorage.getItem('token');
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const url = `${baseUrl}/tournaments/${eventId}/generate/stream`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok || !response.body) {
                throw new Error('Failed to connect to bracket generation stream');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            const start = Date.now();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const dataLine = line.replace(/^data: /, '').trim();
                    if (!dataLine) continue;
                    try {
                        const event = JSON.parse(dataLine);
                        if (event.type === 'progress') {
                            setProgress(prev => ({
                                ...prev,
                                phase: event.phase,
                                message: event.message,
                                current: event.current,
                                total: event.total,
                                categoryName: event.categoryName || prev.categoryName,
                                detail: event.detail || prev.detail,
                            }));
                            setLogs(prev => [...prev, {
                                message: event.message,
                                categoryName: event.categoryName,
                                detail: event.detail,
                                time: Date.now() - start,
                            }].slice(-50));
                        } else if (event.type === 'complete') {
                            setProgress(prev => ({
                                ...prev, phase: 'done', message: event.message,
                                current: 100, total: 100, done: true, resultCount: event.results
                            }));
                            setSuccess(`${event.results} brackets generated!`);
                            onBracketsGenerated();
                        } else if (event.type === 'error') {
                            setProgress(prev => ({ ...prev, error: event.message, done: true }));
                            setError(event.message);
                        }
                    } catch { /* ignore malformed */ }
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to generate brackets.');
            setProgress(prev => ({ ...prev, error: err.message, done: true }));
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

                {error && !progress.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm"
                    >
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </motion.div>
                )}

                {success && !progress.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-400 text-sm"
                    >
                        <CheckCircle className="w-4 h-4" />
                        {success}
                    </motion.div>
                )}

                {/* ── Progress Panel ── */}
                <AnimatePresence>
                    {progress.show && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-zinc-950 border border-zinc-700/50 rounded-xl overflow-hidden"
                        >
                            {/* Status header */}
                            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {progress.done && !progress.error ? (
                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                    ) : progress.error ? (
                                        <XCircle className="w-4 h-4 text-red-400" />
                                    ) : (
                                        <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                                    )}
                                    <span className="text-sm font-medium text-white">
                                        {progress.done && !progress.error
                                            ? `Done — ${progress.resultCount} brackets`
                                            : progress.error
                                                ? 'Failed'
                                                : progress.message}
                                    </span>
                                </div>
                                <span className="text-xs text-zinc-500 font-mono">{elapsed}s</span>
                            </div>

                            {/* Progress bar */}
                            <div className="px-4 pt-3">
                                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full rounded-full ${progress.error
                                            ? 'bg-red-500'
                                            : progress.done
                                                ? 'bg-green-500'
                                                : 'bg-gradient-to-r from-yellow-500 to-amber-400'}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress.current}%` }}
                                        transition={{ duration: 0.4, ease: 'easeOut' }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-zinc-600 mt-1">
                                    <span>{progress.phase === 'building' ? progress.categoryName : progress.phase}</span>
                                    <span>{progress.current}%</span>
                                </div>
                            </div>

                            {/* Current category */}
                            {progress.categoryName && !progress.done && (
                                <div className="px-4 pt-3">
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 flex items-center gap-2.5">
                                        <Target className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-white text-xs font-medium truncate">{progress.categoryName}</p>
                                            {progress.detail && <p className="text-zinc-500 text-[10px] truncate">{progress.detail}</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Scrollable log */}
                            <div className="px-4 pt-3 pb-3 max-h-36 overflow-y-auto">
                                <div className="space-y-0.5">
                                    {logs.map((log, i) => (
                                        <div key={i} className="flex items-start gap-2 text-[11px]">
                                            <span className="text-zinc-600 font-mono w-9 text-right flex-shrink-0">
                                                {(log.time / 1000).toFixed(1)}s
                                            </span>
                                            <span className={i === logs.length - 1 ? 'text-zinc-300' : 'text-zinc-500'}>
                                                {log.categoryName
                                                    ? <><span className="text-yellow-400/70">{log.categoryName}</span> — {log.detail || log.message}</>
                                                    : log.message}
                                            </span>
                                        </div>
                                    ))}
                                    <div ref={logEndRef} />
                                </div>
                            </div>

                            {/* Close button when done */}
                            {progress.done && (
                                <div className="px-4 pb-3">
                                    <button
                                        onClick={() => setProgress(prev => ({ ...prev, show: false }))}
                                        className="w-full py-2 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

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
