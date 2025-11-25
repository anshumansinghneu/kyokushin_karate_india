import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';

export const logTrainingSession = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const userId = req.user.id;
    const { date, duration, intensity, focus, notes } = req.body;

    if (!date || !duration || !intensity) {
        return next(new AppError('Please provide date, duration, and intensity', 400));
    }

    const session = await prisma.trainingSession.create({
        data: {
            userId,
            date: new Date(date),
            duration: parseInt(duration),
            intensity,
            focus,
            notes
        }
    });

    res.status(201).json({
        status: 'success',
        data: {
            session
        }
    });
});

export const getTrainingSessions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const userId = req.user.id;

    const sessions = await prisma.trainingSession.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 30 // Get last 30 sessions
    });

    res.status(200).json({
        status: 'success',
        results: sessions.length,
        data: {
            sessions
        }
    });
});
