import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';

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

    // Check if all matches are completed (skip byes)
    const incompleteMatches = bracket.matches.filter(
        (m: any) => m.status !== 'COMPLETED' && !m.isBye
    );
    if (incompleteMatches.length > 0) {
        return next(new AppError('Cannot calculate results until all matches are completed', 400));
    }

    // Idempotency: delete existing results for this bracket before recalculating
    await prisma.tournamentResult.deleteMany({ where: { bracketId } });

    // Count per-user match stats from the Match table
    const completedMatches = bracket.matches.filter(
        (m: any) => m.status === 'COMPLETED' && !m.isBye
    );

    const userStats: Record<string, { totalMatches: number; matchesWon: number; matchesLost: number; eliminatedInRound: string | null; eliminatedByUserId: string | null }> = {};

    const ensureUser = (id: string) => {
        if (!userStats[id]) userStats[id] = { totalMatches: 0, matchesWon: 0, matchesLost: 0, eliminatedInRound: null, eliminatedByUserId: null };
    };

    completedMatches.forEach((m: any) => {
        if (m.fighterAId) {
            ensureUser(m.fighterAId);
            userStats[m.fighterAId].totalMatches++;
            if (m.winnerId === m.fighterAId) {
                userStats[m.fighterAId].matchesWon++;
            } else {
                userStats[m.fighterAId].matchesLost++;
                userStats[m.fighterAId].eliminatedInRound = m.roundName;
                userStats[m.fighterAId].eliminatedByUserId = m.winnerId;
            }
        }
        if (m.fighterBId) {
            ensureUser(m.fighterBId);
            userStats[m.fighterBId].totalMatches++;
            if (m.winnerId === m.fighterBId) {
                userStats[m.fighterBId].matchesWon++;
            } else {
                userStats[m.fighterBId].matchesLost++;
                userStats[m.fighterBId].eliminatedInRound = m.roundName;
                userStats[m.fighterBId].eliminatedByUserId = m.winnerId;
            }
        }
    });

    // Find the final match (highest round)
    const maxRound = Math.max(...bracket.matches.map((m: any) => m.roundNumber));
    const finalMatch = bracket.matches.find((m: any) => m.roundNumber === maxRound);

    if (!finalMatch || !finalMatch.winnerId) {
        return next(new AppError('Final match not found or no winner', 500));
    }

    const goldWinnerId = finalMatch.winnerId;
    const silverWinnerId = finalMatch.winnerId === finalMatch.fighterAId ? finalMatch.fighterBId : finalMatch.fighterAId;

    // Bronze: Losers of semi-finals (round maxRound - 1)
    const semiFinals = bracket.matches.filter((m: any) => m.roundNumber === maxRound - 1);
    const bronzeWinnerIds: string[] = [];

    semiFinals.forEach((match: any) => {
        const loserId = match.winnerId === match.fighterAId ? match.fighterBId : match.fighterAId;
        if (loserId) bronzeWinnerIds.push(loserId);
    });

    // Helper to build result data with match stats
    const buildResultData = (userId: string, finalRank: number, medal: string | null) => {
        const stats = userStats[userId] || { totalMatches: 0, matchesWon: 0, matchesLost: 0, eliminatedInRound: null, eliminatedByUserId: null };
        return {
            eventId: bracket.eventId,
            bracketId: bracket.id,
            userId,
            categoryName: bracket.categoryName,
            finalRank,
            medal,
            totalMatches: stats.totalMatches,
            matchesWon: stats.matchesWon,
            matchesLost: stats.matchesLost,
            eliminatedInRound: finalRank === 1 ? null : stats.eliminatedInRound, // Gold winner wasn't eliminated
            eliminatedByUserId: finalRank === 1 ? null : stats.eliminatedByUserId,
        };
    };

    const results = [];

    // Gold
    results.push(await prisma.tournamentResult.create({ data: buildResultData(goldWinnerId, 1, 'GOLD') }));

    // Silver
    if (silverWinnerId) {
        results.push(await prisma.tournamentResult.create({ data: buildResultData(silverWinnerId, 2, 'SILVER') }));
    }

    // Bronze
    for (const userId of bronzeWinnerIds) {
        results.push(await prisma.tournamentResult.create({ data: buildResultData(userId, 3, 'BRONZE') }));
    }

    await prisma.tournamentBracket.update({
        where: { id: bracketId },
        data: { status: 'COMPLETED', completedAt: new Date() }
    });

    res.status(200).json({
        status: 'success',
        data: { results },
    });
});

// ─── Calculate results for ALL brackets of an event ─────────────────
export const calculateAllResults = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;

    const brackets = await prisma.tournamentBracket.findMany({
        where: { eventId },
        include: {
            matches: { orderBy: { roundNumber: 'desc' } }
        }
    });

    if (!brackets.length) return next(new AppError('No brackets found for this event', 404));

    const allResults: any[] = [];
    const errors: string[] = [];

    for (const bracket of brackets) {
        const incompleteMatches = bracket.matches.filter(
            (m: any) => m.status !== 'COMPLETED' && !m.isBye
        );
        if (incompleteMatches.length > 0) {
            errors.push(`Bracket "${bracket.categoryName}" has ${incompleteMatches.length} incomplete matches`);
            continue;
        }

        // Delete existing results for idempotency
        await prisma.tournamentResult.deleteMany({ where: { bracketId: bracket.id } });

        const completedMatches = bracket.matches.filter(
            (m: any) => m.status === 'COMPLETED' && !m.isBye
        );

        const userStats: Record<string, { totalMatches: number; matchesWon: number; matchesLost: number; eliminatedInRound: string | null; eliminatedByUserId: string | null }> = {};
        const ensureUser = (id: string) => {
            if (!userStats[id]) userStats[id] = { totalMatches: 0, matchesWon: 0, matchesLost: 0, eliminatedInRound: null, eliminatedByUserId: null };
        };

        completedMatches.forEach((m: any) => {
            if (m.fighterAId) {
                ensureUser(m.fighterAId);
                userStats[m.fighterAId].totalMatches++;
                if (m.winnerId === m.fighterAId) userStats[m.fighterAId].matchesWon++;
                else {
                    userStats[m.fighterAId].matchesLost++;
                    userStats[m.fighterAId].eliminatedInRound = m.roundName;
                    userStats[m.fighterAId].eliminatedByUserId = m.winnerId;
                }
            }
            if (m.fighterBId) {
                ensureUser(m.fighterBId);
                userStats[m.fighterBId].totalMatches++;
                if (m.winnerId === m.fighterBId) userStats[m.fighterBId].matchesWon++;
                else {
                    userStats[m.fighterBId].matchesLost++;
                    userStats[m.fighterBId].eliminatedInRound = m.roundName;
                    userStats[m.fighterBId].eliminatedByUserId = m.winnerId;
                }
            }
        });

        const maxRound = Math.max(...bracket.matches.map((m: any) => m.roundNumber));
        const finalMatch = bracket.matches.find((m: any) => m.roundNumber === maxRound);

        if (!finalMatch?.winnerId) {
            errors.push(`Bracket "${bracket.categoryName}" has no final winner`);
            continue;
        }

        const buildData = (userId: string, rank: number, medal: string | null) => {
            const s = userStats[userId] || { totalMatches: 0, matchesWon: 0, matchesLost: 0, eliminatedInRound: null, eliminatedByUserId: null };
            return {
                eventId: bracket.eventId, bracketId: bracket.id, userId,
                categoryName: bracket.categoryName, finalRank: rank, medal,
                totalMatches: s.totalMatches, matchesWon: s.matchesWon, matchesLost: s.matchesLost,
                eliminatedInRound: rank === 1 ? null : s.eliminatedInRound,
                eliminatedByUserId: rank === 1 ? null : s.eliminatedByUserId,
            };
        };

        allResults.push(await prisma.tournamentResult.create({ data: buildData(finalMatch.winnerId, 1, 'GOLD') }));

        const silverId = finalMatch.winnerId === finalMatch.fighterAId ? finalMatch.fighterBId : finalMatch.fighterAId;
        if (silverId) allResults.push(await prisma.tournamentResult.create({ data: buildData(silverId, 2, 'SILVER') }));

        const semis = bracket.matches.filter((m: any) => m.roundNumber === maxRound - 1);
        for (const sm of semis) {
            const lid = sm.winnerId === sm.fighterAId ? sm.fighterBId : sm.fighterAId;
            if (lid) allResults.push(await prisma.tournamentResult.create({ data: buildData(lid, 3, 'BRONZE') }));
        }

        await prisma.tournamentBracket.update({
            where: { id: bracket.id },
            data: { status: 'COMPLETED', completedAt: new Date() }
        });
    }

    res.status(200).json({
        status: 'success',
        message: `Calculated results for ${brackets.length - errors.length} of ${brackets.length} brackets`,
        data: { results: allResults, errors },
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
