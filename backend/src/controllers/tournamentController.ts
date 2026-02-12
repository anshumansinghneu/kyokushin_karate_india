import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { TournamentService, ProgressCallback } from '../services/tournamentService';
import { AppError } from '../utils/errorHandler';
import prisma from '../prisma';

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

// SSE endpoint that streams progress events while generating brackets
export const generateBracketsStream = async (req: Request, res: Response) => {
    const { eventId } = req.params;

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const sendEvent = (data: object) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
        const onProgress: ProgressCallback = (event) => {
            sendEvent({ type: 'progress', ...event });
        };

        const brackets = await TournamentService.generateBrackets(eventId, onProgress);

        sendEvent({
            type: 'complete',
            phase: 'done',
            message: `${brackets.length} brackets generated successfully!`,
            current: 100,
            total: 100,
            results: brackets.length
        });
    } catch (err: any) {
        sendEvent({
            type: 'error',
            message: err.message || 'Failed to generate brackets',
        });
    } finally {
        res.end();
    }
};

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

// ── Category Management ─────────────────────────────────

// GET /api/tournaments/:eventId/categories — get categories with participant counts
export const getCategories = catchAsync(async (req: Request, res: Response) => {
    const { eventId } = req.params;

    // Get event with categories
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, categories: true }
    });

    if (!event) {
        return res.status(404).json({ status: 'fail', message: 'Event not found' });
    }

    // Get registrations grouped by category
    const registrations = await prisma.eventRegistration.findMany({
        where: { eventId, approvalStatus: 'APPROVED' },
        select: {
            id: true,
            categoryAge: true,
            categoryWeight: true,
            categoryBelt: true,
            user: {
                select: {
                    id: true, name: true, currentBeltRank: true,
                    weight: true, dateOfBirth: true,
                    dojo: { select: { name: true } },
                    membershipNumber: true,
                }
            }
        }
    });

    // Group participants by category key
    const categoryMap: Record<string, {
        categoryAge: string;
        categoryWeight: string;
        categoryBelt: string;
        categoryName: string;
        participants: any[];
    }> = {};

    registrations.forEach(reg => {
        const key = `${reg.categoryAge || 'Open'}|${reg.categoryWeight || 'Open'}|${reg.categoryBelt || 'Open'}`;
        const name = [reg.categoryAge, reg.categoryWeight, reg.categoryBelt].filter(Boolean).join(', ') || 'Open';
        if (!categoryMap[key]) {
            categoryMap[key] = {
                categoryAge: reg.categoryAge || '',
                categoryWeight: reg.categoryWeight || '',
                categoryBelt: reg.categoryBelt || '',
                categoryName: name,
                participants: [],
            };
        }
        categoryMap[key].participants.push({
            registrationId: reg.id,
            userId: reg.user.id,
            name: reg.user.name,
            belt: reg.user.currentBeltRank,
            weight: reg.user.weight,
            dateOfBirth: reg.user.dateOfBirth,
            dojo: reg.user.dojo?.name || null,
            membershipNumber: reg.user.membershipNumber,
        });
    });

    const categories = Object.values(categoryMap);

    res.status(200).json({
        status: 'success',
        data: { categories, eventCategories: event.categories }
    });
});

// PATCH /api/tournaments/registrations/:registrationId/category — move participant to different category
export const moveParticipantCategory = catchAsync(async (req: Request, res: Response) => {
    const { registrationId } = req.params;
    const { categoryAge, categoryWeight, categoryBelt } = req.body;

    const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
        include: { user: { select: { name: true } } }
    });

    if (!registration) {
        return res.status(404).json({ status: 'fail', message: 'Registration not found' });
    }

    const updated = await prisma.eventRegistration.update({
        where: { id: registrationId },
        data: {
            categoryAge: categoryAge || null,
            categoryWeight: categoryWeight || null,
            categoryBelt: categoryBelt || null,
        },
        include: {
            user: { select: { id: true, name: true, currentBeltRank: true, weight: true } }
        }
    });

    res.status(200).json({
        status: 'success',
        message: `${registration.user.name} moved to new category`,
        data: { registration: updated }
    });
});

// POST /api/tournaments/:eventId/categories/bulk-move — move multiple participants between categories
export const bulkMoveParticipants = catchAsync(async (req: Request, res: Response) => {
    const { registrationIds, categoryAge, categoryWeight, categoryBelt } = req.body;

    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
        return res.status(400).json({ status: 'fail', message: 'registrationIds array required' });
    }

    await prisma.eventRegistration.updateMany({
        where: { id: { in: registrationIds } },
        data: {
            categoryAge: categoryAge || null,
            categoryWeight: categoryWeight || null,
            categoryBelt: categoryBelt || null,
        }
    });

    res.status(200).json({
        status: 'success',
        message: `${registrationIds.length} participant(s) moved to new category`,
    });
});
