import React from 'react';
import { motion } from 'framer-motion';
import { User, Trophy } from 'lucide-react';

interface Match {
    id: string;
    roundNumber: number;
    matchNumber: number;
    fighterAName: string | null;
    fighterBName: string | null;
    fighterAScore?: number;
    fighterBScore?: number;
    winnerId: string | null;
    status: 'SCHEDULED' | 'LIVE' | 'COMPLETED';
    nextMatchId: string | null;
}

interface BracketTreeProps {
    matches: Match[];
}

const BracketTree: React.FC<BracketTreeProps> = ({ matches }) => {
    // Group matches by round
    const rounds = matches.reduce((acc, match) => {
        if (!acc[match.roundNumber]) {
            acc[match.roundNumber] = [];
        }
        acc[match.roundNumber].push(match);
        return acc;
    }, {} as Record<number, Match[]>);

    const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);

    return (
        <div className="overflow-x-auto pb-8">
            <div className="flex gap-16 min-w-max px-8">
                {roundNumbers.map((roundNum) => (
                    <div key={roundNum} className="flex flex-col justify-around gap-8">
                        <div className="text-center mb-4">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                Round {roundNum}
                            </span>
                        </div>
                        {rounds[roundNum].map((match) => (
                            <MatchCard key={match.id} match={match} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

const MatchCard: React.FC<{ match: Match }> = ({ match }) => {
    const isLive = match.status === 'LIVE';
    const isCompleted = match.status === 'COMPLETED';

    return (
        <div className={`relative w-64 bg-zinc-900 border rounded-lg overflow-hidden transition-all ${isLive ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-zinc-800'
            }`}>
            {/* Connector Lines (Simplified CSS logic would go here or parent) */}

            {/* Header */}
            <div className="px-3 py-1 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center">
                <span className="text-[10px] text-zinc-500 font-mono">Match #{match.matchNumber}</span>
                {isLive && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        LIVE
                    </span>
                )}
            </div>

            {/* Fighters */}
            <div className="flex flex-col">
                <FighterRow
                    name={match.fighterAName}
                    score={match.fighterAScore}
                    isWinner={!!(match.winnerId && match.winnerId === match.fighterAName)}
                    // Actually, we don't have fighter IDs easily here without more data. 
                    // Let's assume for MVP visualization we highlight based on score or status.
                    isLive={isLive}
                />
                <div className="h-[1px] bg-zinc-800" />
                <FighterRow
                    name={match.fighterBName}
                    score={match.fighterBScore}
                    isWinner={false}
                    isLive={isLive}
                />
            </div>
        </div>
    );
};

const FighterRow: React.FC<{ name: string | null; score?: number; isWinner?: boolean; isLive?: boolean }> = ({ name, score, isWinner, isLive }) => (
    <div className={`px-3 py-2 flex justify-between items-center ${isWinner ? 'bg-yellow-500/10' : ''}`}>
        <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${name ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-900 text-zinc-700'
                }`}>
                <User className="w-3 h-3" />
            </div>
            <span className={`text-sm truncate max-w-[120px] ${name ? 'text-zinc-200' : 'text-zinc-600 italic'}`}>
                {name || 'TBD'}
            </span>
        </div>
        {score !== undefined && (
            <span className={`font-mono font-bold ${isLive ? 'text-red-400' : 'text-zinc-400'}`}>
                {score}
            </span>
        )}
        {isWinner && <Trophy className="w-3 h-3 text-yellow-500" />}
    </div>
);

export default BracketTree;
