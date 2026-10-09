import React from 'react';
import { Crown } from 'lucide-react';

export interface BracketTreeMatch {
    id: string;
    roundNumber: number;
    matchNumber: number;
    fighterAName: string | null;
    fighterBName: string | null;
    fighterAId?: string | null;
    fighterBId?: string | null;
    fighterAScore?: number | null;
    fighterBScore?: number | null;
    winnerId: string | null;
    status: 'SCHEDULED' | 'LIVE' | 'COMPLETED';
    nextMatchId: string | null;
}

interface BracketTreeProps {
    matches: BracketTreeMatch[];
}

/** Rounds as columns, earliest left; scrolls sideways inside its own box on small screens. */
const BracketTree: React.FC<BracketTreeProps> = ({ matches }) => {
    const rounds = matches.reduce((acc, match) => {
        (acc[match.roundNumber] ||= []).push(match);
        return acc;
    }, {} as Record<number, BracketTreeMatch[]>);

    const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);
    const label = (i: number) =>
        i === roundNumbers.length - 1 ? 'Final' : i === roundNumbers.length - 2 ? 'Semi-finals' : `Round ${roundNumbers[i]}`;

    return (
        <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
            <div className="flex min-w-max gap-6">
                {roundNumbers.map((roundNum, i) => (
                    <div key={roundNum} className="flex w-64 flex-col">
                        <h3 className="mb-4 border-b border-white/15 pb-3 text-sm font-bold uppercase tracking-[0.08em] text-white/70">{label(i)}</h3>
                        <ol className="flex flex-1 flex-col justify-around gap-4">
                            {rounds[roundNum].map((match) => (
                                <li key={match.id}>
                                    <MatchCard match={match} />
                                </li>
                            ))}
                        </ol>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MatchCard: React.FC<{ match: BracketTreeMatch }> = ({ match }) => {
    const live = match.status === 'LIVE';
    // A winner is known only when the API sends fighter ids; never guess from names.
    const aWon = !!match.winnerId && !!match.fighterAId && match.winnerId === match.fighterAId;
    const bWon = !!match.winnerId && !!match.fighterBId && match.winnerId === match.fighterBId;

    return (
        <article aria-label={`Match ${match.matchNumber}`} className={`overflow-hidden rounded-lg border bg-surface ${live ? 'border-primary' : 'border-white/10'}`}>
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 text-xs font-semibold text-white/50">
                <span className="tabular-nums">Match {match.matchNumber}</span>
                {live && (
                    <span className="flex items-center gap-1.5 font-bold text-primary-light">
                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Live
                    </span>
                )}
                {match.status === 'COMPLETED' && <span>Final</span>}
            </div>
            <FighterRow name={match.fighterAName} score={match.fighterAScore} won={aWon} />
            <div className="h-px bg-white/10" />
            <FighterRow name={match.fighterBName} score={match.fighterBScore} won={bWon} />
        </article>
    );
};

const FighterRow: React.FC<{ name: string | null; score?: number | null; won: boolean }> = ({ name, score, won }) => (
    <div className={`flex items-center justify-between gap-3 px-3 py-2.5 ${won ? 'bg-secondary/10' : ''}`}>
        <span className={`flex min-w-0 items-center gap-1.5 text-sm ${name ? 'font-bold text-white' : 'text-white/40'}`}>
            {won && <Crown className="h-3.5 w-3.5 shrink-0 text-secondary" aria-label="Winner" />}
            <span className="truncate">{name || 'To be decided'}</span>
        </span>
        {score !== undefined && score !== null && (
            <span className={`text-lg font-black tabular-nums ${won ? 'text-secondary' : 'text-white/75'}`}>{score}</span>
        )}
    </div>
);

export default BracketTree;
