import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';
import { io } from '../index'; // We need to export io from index.ts

export const getMatch = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const match = await prisma.match.findUnique({
        where: { id: req.params.id },
        include: {
            fighterA: { select: { name: true, currentBeltRank: true, dojo: { select: { name: true } } } },
            fighterB: { select: { name: true, currentBeltRank: true, dojo: { select: { name: true } } } }
        }
    });

    if (!match) {
        return next(new AppError('Match not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            match,
        },
    });
});

export const startMatch = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { matchId } = req.params;

    const match = await prisma.match.update({
        where: { id: matchId },
        data: {
            status: 'LIVE',
            startedAt: new Date()
        },
        include: {
            fighterA: { select: { name: true, dojo: { select: { name: true } } } },
            fighterB: { select: { name: true, dojo: { select: { name: true } } } }
        }
    });

    // Broadcast via WebSocket
    if (io) {
        io.emit('match:started', {
            matchId: match.id,
            bracketId: match.bracketId,
            fighterA: match.fighterA,
            fighterB: match.fighterB,
            round: match.roundName
        });
    }

    res.status(200).json({
        status: 'success',
        data: {
            match,
        },
    });
});

export const updateScore = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { matchId } = req.params;
    const { fighterAScore, fighterBScore, winnerId, status, notes } = req.body;

    const updateData: any = {};

    if (fighterAScore !== undefined) updateData.fighterAScore = fighterAScore;
    if (fighterBScore !== undefined) updateData.fighterBScore = fighterBScore;
    if (winnerId !== undefined) updateData.winnerId = winnerId;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    // If completing the match, set completedAt timestamp
    if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
    }

    // If starting live match, set startedAt timestamp
    if (status === 'LIVE' && !updateData.startedAt) {
        updateData.startedAt = new Date();
    }

    const match = await prisma.match.update({
        where: { id: matchId },
        data: updateData,
        include: {
            fighterA: { select: { name: true, currentBeltRank: true, dojo: { select: { name: true } } } },
            fighterB: { select: { name: true, currentBeltRank: true, dojo: { select: { name: true } } } },
            bracket: { select: { eventId: true } }
        }
    });

    // If match is completed, advance winner to next match
    if (status === 'COMPLETED' && winnerId && match.nextMatchId) {
        const nextMatch = await prisma.match.findUnique({ where: { id: match.nextMatchId } });

        if (nextMatch) {
            const dataToUpdate: any = {};
            const winnerName = winnerId === match.fighterAId ? match.fighterAName : match.fighterBName;

            if (!nextMatch.fighterAId) {
                dataToUpdate.fighterAId = winnerId;
                dataToUpdate.fighterAName = winnerName;
            } else if (!nextMatch.fighterBId) {
                dataToUpdate.fighterBId = winnerId;
                dataToUpdate.fighterBName = winnerName;
            }

            if (Object.keys(dataToUpdate).length > 0) {
                await prisma.match.update({
                    where: { id: match.nextMatchId },
                    data: dataToUpdate
                });
            }
        }
    }

    // Broadcast update via WebSocket to tournament room
    if (io) {
        const tournamentId = match.bracket.eventId;
        io.to(`tournament-${tournamentId}`).emit('match:update', {
            matchId: match.id,
            bracketId: match.bracketId,
            fighterAScore: match.fighterAScore,
            fighterBScore: match.fighterBScore,
            winnerId: match.winnerId,
            status: match.status,
            fighterA: match.fighterA,
            fighterB: match.fighterB
        });

        // If match completed, also emit bracket refresh event
        if (status === 'COMPLETED') {
            io.to(`tournament-${tournamentId}`).emit('bracket:refresh', {
                tournamentId,
                bracketId: match.bracketId
            });
        }
    }

    res.status(200).json({
        status: 'success',
        data: {
            match,
        },
    });
});

export const endMatch = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { matchId } = req.params;
    const { winnerId, notes } = req.body;

    const currentMatch = await prisma.match.findUnique({ where: { id: matchId } });
    if (!currentMatch) return next(new AppError('Match not found', 404));

    // Update match
    const match = await prisma.match.update({
        where: { id: matchId },
        data: {
            status: 'COMPLETED',
            winnerId,
            completedAt: new Date(),
            notes
        }
    });

    // Advance winner to next match
    if (match.nextMatchId) {
        const nextMatch = await prisma.match.findUnique({ where: { id: match.nextMatchId } });

        if (nextMatch) {
            // Determine if winner goes to A or B slot
            // Simple logic: If nextMatch.fighterAId is null, put there. Else put in B.
            // But we need to be consistent.
            // Usually, the bracket tree defines this.
            // For our simple generation, we linked matches.
            // We need to check if we are the "top" or "bottom" feeder for the next match.
            // But we didn't store that explicitly.
            // However, we can just check which slot is empty.

            const dataToUpdate: any = {};
            if (!nextMatch.fighterAId) {
                dataToUpdate.fighterAId = winnerId;
                dataToUpdate.fighterAName = winnerId === currentMatch.fighterAId ? currentMatch.fighterAName : currentMatch.fighterBName;
            } else if (!nextMatch.fighterBId) {
                dataToUpdate.fighterBId = winnerId;
                dataToUpdate.fighterBName = winnerId === currentMatch.fighterAId ? currentMatch.fighterAName : currentMatch.fighterBName;
            }

            if (Object.keys(dataToUpdate).length > 0) {
                await prisma.match.update({
                    where: { id: match.nextMatchId },
                    data: dataToUpdate
                });
            }
        }
    }

    // Broadcast
    if (io) {
        io.emit('match:ended', {
            matchId: match.id,
            winnerId,
            bracketId: match.bracketId
        });
    }

    res.status(200).json({
        status: 'success',
        data: {
            match,
        },
    });
});
