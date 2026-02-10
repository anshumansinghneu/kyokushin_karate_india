import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { TournamentService } from '../services/tournamentService';
import { AppError } from '../utils/errorHandler';

export const generateBrackets = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;

    const brackets = await TournamentService.generateBrackets(eventId);

    res.status(200).json({
        status: 'success',
        results: brackets.length,
        data: {
            brackets,
        },
    });
});

export const getBrackets = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;

    const brackets = await TournamentService.getBrackets(eventId);
    // @ts-ignore
    const currentUser = req.user;

    // Visibility Check: If bracket is DRAFT, only Admin can see it
    if (brackets.length > 0) {
        const isDraft = brackets.some(b => b.status === 'DRAFT');
        if (isDraft && currentUser.role !== 'ADMIN') {
            return next(new AppError('Tournament brackets are not yet published', 403));
        }
    }

    res.status(200).json({
        status: 'success',
        data: {
            brackets,
        },
    });
});

export const updateBracketStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { bracketId } = req.params;
    const { status } = req.body;

    const validStatuses = ['DRAFT', 'LOCKED', 'IN_PROGRESS', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
        return next(new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400));
    }

    const bracket = await TournamentService.updateBracketStatus(bracketId, status);

    res.status(200).json({
        status: 'success',
        data: { bracket },
    });
});

export const getTournamentStatistics = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;

    const statistics = await TournamentService.getTournamentStatistics(eventId);

    res.status(200).json({
        status: 'success',
        data: statistics,
    });
});
