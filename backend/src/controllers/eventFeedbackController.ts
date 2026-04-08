import { Request, Response } from 'express';
import prisma from '../prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/errorHandler';

// POST /api/feedback/:eventId — Submit feedback (registered participants only, completed events only)
export const submitFeedback = catchAsync(async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const userId = (req as any).user.id;
    const { feedback } = req.body;

    if (!feedback || feedback.trim().length < 10) {
        throw new AppError('Feedback must be at least 10 characters', 400);
    }
    if (feedback.trim().length > 2000) {
        throw new AppError('Feedback must be under 2000 characters', 400);
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new AppError('Event not found', 404);
    if (event.status !== 'COMPLETED') {
        throw new AppError('Feedback can only be submitted for completed events', 400);
    }

    const registration = await prisma.eventRegistration.findFirst({
        where: { eventId, userId },
    });
    if (!registration) {
        throw new AppError('You must be registered for this event to submit feedback', 403);
    }

    const entry = await prisma.eventFeedback.create({
        data: {
            eventId,
            userId,
            feedback: feedback.trim(),
        },
        include: {
            user: { select: { id: true, name: true, currentBeltRank: true } },
        },
    });

    res.status(201).json({ status: 'success', data: { feedback: entry } });
});

// GET /api/feedback/:eventId — Public: get approved feedback
export const getApprovedFeedback = catchAsync(async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const { page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
        prisma.eventFeedback.findMany({
            where: { eventId, status: 'APPROVED' },
            include: {
                user: { select: { id: true, name: true, currentBeltRank: true, profilePhotoUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum,
        }),
        prisma.eventFeedback.count({ where: { eventId, status: 'APPROVED' } }),
    ]);

    res.status(200).json({
        status: 'success',
        data: { feedbacks: items, total, page: pageNum, totalPages: Math.ceil(total / limitNum) },
    });
});

// GET /api/feedback/:eventId/mine — Get current user's feedback for an event
export const getMyFeedback = catchAsync(async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const userId = (req as any).user.id;

    const entry = await prisma.eventFeedback.findUnique({
        where: { eventId_userId: { eventId, userId } },
    });

    res.status(200).json({ status: 'success', data: { feedback: entry } });
});

// PUT /api/feedback/:eventId — Edit own feedback (resets to PENDING)
export const editFeedback = catchAsync(async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const userId = (req as any).user.id;
    const { feedback } = req.body;

    if (!feedback || feedback.trim().length < 10) {
        throw new AppError('Feedback must be at least 10 characters', 400);
    }
    if (feedback.trim().length > 2000) {
        throw new AppError('Feedback must be under 2000 characters', 400);
    }

    const existing = await prisma.eventFeedback.findUnique({
        where: { eventId_userId: { eventId, userId } },
    });
    if (!existing) throw new AppError('No feedback found to edit', 404);

    const updated = await prisma.eventFeedback.update({
        where: { eventId_userId: { eventId, userId } },
        data: { feedback: feedback.trim(), status: 'PENDING' },
    });

    res.status(200).json({ status: 'success', data: { feedback: updated } });
});

// GET /api/feedback/pending — Admin: get all pending feedback
export const getPendingFeedback = catchAsync(async (req: Request, res: Response) => {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
        prisma.eventFeedback.findMany({
            where: { status: 'PENDING' },
            include: {
                user: { select: { id: true, name: true, currentBeltRank: true } },
                event: { select: { id: true, name: true, type: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum,
        }),
        prisma.eventFeedback.count({ where: { status: 'PENDING' } }),
    ]);

    res.status(200).json({
        status: 'success',
        data: { feedbacks: items, total, page: pageNum, totalPages: Math.ceil(total / limitNum) },
    });
});

// GET /api/feedback/all — Admin: get all feedback with filters
export const getAllFeedback = catchAsync(async (req: Request, res: Response) => {
    const { page = '1', limit = '20', status } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status as string)) {
        where.status = status;
    }

    const [items, total] = await Promise.all([
        prisma.eventFeedback.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, currentBeltRank: true } },
                event: { select: { id: true, name: true, type: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum,
        }),
        prisma.eventFeedback.count({ where }),
    ]);

    res.status(200).json({
        status: 'success',
        data: { feedbacks: items, total, page: pageNum, totalPages: Math.ceil(total / limitNum) },
    });
});

// PATCH /api/feedback/:id/approve — Admin: approve feedback
export const approveFeedback = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const entry = await prisma.eventFeedback.update({
        where: { id },
        data: { status: 'APPROVED' },
    });

    res.status(200).json({ status: 'success', data: { feedback: entry } });
});

// PATCH /api/feedback/:id/reject — Admin: reject feedback
export const rejectFeedback = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const entry = await prisma.eventFeedback.update({
        where: { id },
        data: { status: 'REJECTED' },
    });

    res.status(200).json({ status: 'success', data: { feedback: entry } });
});
