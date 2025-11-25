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
