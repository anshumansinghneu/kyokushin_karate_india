import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { catchAsync } from '../utils/catchAsync';

/**
 * Get all tournament winners across all tournaments
 * Groups by tournament and shows medal winners per category
 */
export const getAllWinners = catchAsync(async (req: Request, res: Response) => {
    // @ts-ignore
    const currentUser = req.user;

    // Instructors can only see their students' results
    const whereClause: any = currentUser.role === 'INSTRUCTOR'
        ? { user: { primaryInstructorId: currentUser.id } }
        : {};

    // Get all tournament results with winners (top 3)
    const results = await prisma.tournamentResult.findMany({
        where: {
            ...whereClause,
            finalRank: { lte: 3 }, // Only top 3 positions
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    currentBeltRank: true,
                    profilePhotoUrl: true,
                    dojo: {
                        select: {
                            id: true,
                            name: true,
                            city: true,
                        },
                    },
                },
            },
            event: {
                select: {
                    id: true,
                    name: true,
                    startDate: true,
                    endDate: true,
                    location: true,
                    status: true,
                },
            },
            bracket: {
                select: {
                    id: true,
                    categoryName: true,
                    categoryAge: true,
                    categoryWeight: true,
                    categoryBelt: true,
                },
            },
        },
        orderBy: [
            { event: { startDate: 'desc' } }, // Recent tournaments first
            { finalRank: 'asc' }, // 1st, 2nd, 3rd
        ],
    });

    // Group by tournament
    const tournamentMap = new Map();

    results.forEach((result) => {
        const tournamentId = result.event.id;

        if (!tournamentMap.has(tournamentId)) {
            tournamentMap.set(tournamentId, {
                tournament: result.event,
                categories: new Map(),
            });
        }

        const tournament = tournamentMap.get(tournamentId);
        const categoryKey = result.categoryName;

        if (!tournament.categories.has(categoryKey)) {
            tournament.categories.set(categoryKey, {
                categoryName: result.categoryName,
                bracket: result.bracket,
                winners: [],
            });
        }

        tournament.categories.get(categoryKey).winners.push({
            position: result.finalRank,
            medal: result.medal,
            user: result.user,
            stats: {
                totalMatches: result.totalMatches,
                matchesWon: result.matchesWon,
                matchesLost: result.matchesLost,
                eliminatedInRound: result.eliminatedInRound,
            },
        });
    });

    // Convert maps to arrays
    const tournaments = Array.from(tournamentMap.values()).map((t) => ({
        ...t.tournament,
        categories: Array.from(t.categories.values()),
    }));

    res.status(200).json({
        status: 'success',
        results: tournaments.length,
        data: {
            tournaments,
        },
    });
});

/**
 * Get recent tournament winners (last 3 tournaments)
 */
export const getRecentWinners = catchAsync(async (req: Request, res: Response) => {
    // @ts-ignore
    const currentUser = req.user;

    const whereClause: any = currentUser.role === 'INSTRUCTOR'
        ? { user: { primaryInstructorId: currentUser.id } }
        : {};

    // Get recent completed tournaments
    const recentTournaments = await prisma.event.findMany({
        where: {
            type: 'TOURNAMENT',
            status: 'COMPLETED',
        },
        orderBy: { startDate: 'desc' },
        take: 3,
        select: { id: true },
    });

    if (recentTournaments.length === 0) {
        return res.status(200).json({
            status: 'success',
            data: { winners: [] },
        });
    }

    const tournamentIds = recentTournaments.map((t) => t.id);

    // Get winners from these tournaments
    const results = await prisma.tournamentResult.findMany({
        where: {
            ...whereClause,
            eventId: { in: tournamentIds },
            finalRank: { lte: 3 },
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    profilePhotoUrl: true,
                    currentBeltRank: true,
                    dojo: {
                        select: {
                            name: true,
                            city: true,
                        },
                    },
                },
            },
            event: {
                select: {
                    id: true,
                    name: true,
                    startDate: true,
                    location: true,
                },
            },
            bracket: {
                select: {
                    categoryName: true,
                },
            },
        },
        orderBy: [
            { event: { startDate: 'desc' } },
            { finalRank: 'asc' },
        ],
    });

    res.status(200).json({
        status: 'success',
        results: results.length,
        data: {
            winners: results,
        },
    });
});

/**
 * Get winners for a specific tournament
 */
export const getTournamentWinners = catchAsync(async (req: Request, res: Response) => {
    const { eventId } = req.params;
    // @ts-ignore
    const currentUser = req.user;

    const whereClause: any = {
        eventId,
        finalRank: { lte: 3 },
    };

    if (currentUser.role === 'INSTRUCTOR') {
        whereClause.user = { primaryInstructorId: currentUser.id };
    }

    const results = await prisma.tournamentResult.findMany({
        where: whereClause,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePhotoUrl: true,
                    currentBeltRank: true,
                    dojo: {
                        select: {
                            id: true,
                            name: true,
                            city: true,
                        },
                    },
                },
            },
            bracket: {
                select: {
                    id: true,
                    categoryName: true,
                    categoryAge: true,
                    categoryWeight: true,
                    categoryBelt: true,
                },
            },
        },
        orderBy: [
            { bracket: { categoryName: 'asc' } },
            { finalRank: 'asc' },
        ],
    });

    // Group by category
    const categories = new Map();

    results.forEach((result) => {
        const categoryKey = result.categoryName;

        if (!categories.has(categoryKey)) {
            categories.set(categoryKey, {
                categoryName: result.categoryName,
                bracket: result.bracket,
                winners: [],
            });
        }

        categories.get(categoryKey).winners.push({
            position: result.finalRank,
            medal: result.medal,
            user: result.user,
            stats: {
                totalMatches: result.totalMatches,
                matchesWon: result.matchesWon,
                matchesLost: result.matchesLost,
            },
        });
    });

    res.status(200).json({
        status: 'success',
        data: {
            categories: Array.from(categories.values()),
        },
    });
});

/**
 * Get user's tournament history (for profile page)
 */
export const getUserTournamentHistory = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const results = await prisma.tournamentResult.findMany({
        where: { userId },
        include: {
            event: {
                select: {
                    id: true,
                    name: true,
                    startDate: true,
                    location: true,
                    status: true,
                },
            },
            bracket: {
                select: {
                    categoryName: true,
                },
            },
        },
        orderBy: { event: { startDate: 'desc' } },
    });

    // Calculate summary stats
    const totalTournaments = results.length;
    const goldMedals = results.filter((r) => r.medal === 'GOLD').length;
    const silverMedals = results.filter((r) => r.medal === 'SILVER').length;
    const bronzeMedals = results.filter((r) => r.medal === 'BRONZE').length;
    const totalMatches = results.reduce((sum, r) => sum + r.totalMatches, 0);
    const matchesWon = results.reduce((sum, r) => sum + r.matchesWon, 0);
    const winRate = totalMatches > 0 ? ((matchesWon / totalMatches) * 100).toFixed(1) : '0';

    res.status(200).json({
        status: 'success',
        data: {
            summary: {
                totalTournaments,
                goldMedals,
                silverMedals,
                bronzeMedals,
                totalMedals: goldMedals + silverMedals + bronzeMedals,
                totalMatches,
                matchesWon,
                matchesLost: totalMatches - matchesWon,
                winRate,
            },
            history: results,
        },
    });
});
