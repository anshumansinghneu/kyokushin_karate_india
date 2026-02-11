import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';

// Define simple interface for Match to avoid import issues
interface Match {
    id: string;
    bracketId: string;
    roundNumber: number;
    roundName: string;
    matchNumber: number;
    fighterAId: string | null;
    fighterBId: string | null;
    winnerId: string | null;
    status: string;
}

export const calculateResults = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { bracketId } = req.params;

    const bracket = await prisma.tournamentBracket.findUnique({
        where: { id: bracketId },
        include: {
            matches: {
                orderBy: { roundNumber: 'desc' }
            }
        }
    });

    if (!bracket) return next(new AppError('Bracket not found', 404));

    // Check if all matches are completed
    const incompleteMatches = bracket.matches.filter((m: any) => m.status !== 'COMPLETED');
    if (incompleteMatches.length > 0) {
        return next(new AppError('Cannot calculate results until all matches are completed', 400));
    }

    // Find the final match (highest round)
    const maxRound = Math.max(...bracket.matches.map((m: any) => m.roundNumber));
    const finalMatch = bracket.matches.find((m: any) => m.roundNumber === maxRound);

    if (!finalMatch || !finalMatch.winnerId) {
        return next(new AppError('Final match not found or no winner', 500));
    }

    const goldWinnerId = finalMatch.winnerId;
    const silverWinnerId = finalMatch.winnerId === finalMatch.fighterAId ? finalMatch.fighterBId : finalMatch.fighterAId;

    // Bronze: Losers of semi-finals (Round - 1)
    const semiFinals = bracket.matches.filter((m: any) => m.roundNumber === maxRound - 1);
    const bronzeWinnerIds: string[] = [];

    semiFinals.forEach((match: any) => {
        const loserId = match.winnerId === match.fighterAId ? match.fighterBId : match.fighterAId;
        if (loserId) bronzeWinnerIds.push(loserId);
    });

    // Save Results
    const results = [];

    // Gold
    results.push(await prisma.tournamentResult.create({
        data: {
            eventId: bracket.eventId,
            bracketId: bracket.id,
            userId: goldWinnerId,
            finalRank: 1,
            medal: 'GOLD',
            categoryName: bracket.categoryName
        }
    }));

    // Silver
    if (silverWinnerId) {
        results.push(await prisma.tournamentResult.create({
            data: {
                eventId: bracket.eventId,
                bracketId: bracket.id,
                userId: silverWinnerId,
                finalRank: 2,
                medal: 'SILVER',
                categoryName: bracket.categoryName
            }
        }));
    }

    // Bronze
    for (const userId of bronzeWinnerIds) {
        results.push(await prisma.tournamentResult.create({
            data: {
                eventId: bracket.eventId,
                bracketId: bracket.id,
                userId,
                finalRank: 3,
                medal: 'BRONZE',
                categoryName: bracket.categoryName
            }
        }));
    }

    await prisma.tournamentBracket.update({
        where: { id: bracketId },
        data: { status: 'COMPLETED' }
    });

    res.status(200).json({
        status: 'success',
        data: {
            results,
        },
    });
});

export const getResults = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;

    const results = await prisma.tournamentResult.findMany({
        where: { eventId },
        include: {
            user: { select: { name: true, dojo: { select: { name: true } } } }
        },
        orderBy: { finalRank: 'asc' }
    });

    res.status(200).json({
        status: 'success',
        data: {
            results,
        },
    });
});

// ─── Fight Record for a User ──────────────────────────────────────────
export const getFightRecord = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    const results = await prisma.tournamentResult.findMany({
        where: { userId },
        include: {
            event: { select: { name: true, startDate: true } },
        },
        orderBy: { event: { startDate: 'desc' } },
    });

    let totalMatches = 0;
    let wins = 0;
    let losses = 0;
    const medals = { gold: 0, silver: 0, bronze: 0 };

    const mapped = results.map(r => {
        const mw = r.matchesWon || 0;
        const ml = r.matchesLost || 0;
        totalMatches += mw + ml;
        wins += mw;
        losses += ml;
        if (r.medal === 'GOLD') medals.gold++;
        else if (r.medal === 'SILVER') medals.silver++;
        else if (r.medal === 'BRONZE') medals.bronze++;

        return {
            id: r.id,
            eventName: (r as any).event?.name || 'Unknown',
            eventDate: (r as any).event?.startDate || null,
            categoryName: r.categoryName,
            finalRank: r.finalRank,
            medal: r.medal,
            totalMatches: mw + ml,
            matchesWon: mw,
            matchesLost: ml,
        };
    });

    res.status(200).json({
        status: 'success',
        data: {
            totalMatches,
            wins,
            losses,
            draws: 0,
            winRate: totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0,
            medals,
            results: mapped,
        },
    });
});
