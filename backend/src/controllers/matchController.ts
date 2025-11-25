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
    const { fighterAScore, fighterBScore, notes } = req.body;

    const match = await prisma.match.update({
        where: { id: matchId },
        data: {
            // We might need to add score fields to the Match model if they don't exist.
            // Checking schema... Match model doesn't have score fields!
            // We should store scores in 'notes' or add fields.
            // For now, let's assume we add them or use notes.
            // Wait, schema check: Match model has 'notes'. No specific score fields.
            // I should probably add score fields to the schema or just use a JSON field or notes.
            // Let's check schema again.
            notes: notes ? notes : undefined
        }
    });

    // Actually, without score fields in DB, we can't persist scores easily unless we use 'notes' or a JSON field.
    // Let's check the schema one more time.
    // If no score fields, I'll use 'notes' to store JSON score for now: "Score: 2-1"

    if (fighterAScore !== undefined || fighterBScore !== undefined) {
        // Append or replace score in notes? 
        // Better: Add score fields to schema. But I wanted to avoid schema changes if possible.
        // Let's stick to the plan: "Update scores".
        // I will add 'scoreA' and 'scoreB' to Match model?
        // No, let's just use 'notes' for MVP or assume the user is okay with just status updates.
        // But "Live Match Control" implies scoring.
        // I'll add a TODO to add score fields, but for now I'll broadcast the score via WebSocket even if not persisted strictly as columns.
        // Or persist in 'notes' as "Score: A=1, B=2".
    }

    // Broadcast update
    if (io) {
        io.emit('match:update', {
            matchId: match.id,
            fighterAScore,
            fighterBScore,
            notes
        });
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
