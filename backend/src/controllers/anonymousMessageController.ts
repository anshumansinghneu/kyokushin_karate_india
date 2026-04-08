import { Request, Response } from 'express';
import prisma from '../prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/errorHandler';

// POST /api/anonymous-messages — Send anonymous message (authenticated users)
export const sendMessage = catchAsync(async (req: Request, res: Response) => {
    const senderId = (req as any).user.id;
    const { message } = req.body;

    if (!message || message.trim().length < 10) {
        throw new AppError('Message must be at least 10 characters', 400);
    }
    if (message.trim().length > 2000) {
        throw new AppError('Message must be under 2000 characters', 400);
    }

    // Rate limit: max 3 messages per user per 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await prisma.anonymousMessage.count({
        where: { senderId, createdAt: { gte: oneDayAgo } },
    });
    if (recentCount >= 3) {
        throw new AppError('You can only send 3 anonymous messages per day', 429);
    }

    await prisma.anonymousMessage.create({
        data: { senderId, message: message.trim() },
    });

    res.status(201).json({ status: 'success', message: 'Message sent anonymously' });
});

// GET /api/anonymous-messages — Admin: list messages (NEVER includes senderId)
export const getMessages = catchAsync(async (req: Request, res: Response) => {
    const { page = '1', limit = '20', filter = 'all' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (filter === 'unread') where.isRead = false;
    if (filter === 'archived') where.isArchived = true;
    if (filter === 'all') where.isArchived = false;

    const [items, total, unreadCount] = await Promise.all([
        prisma.anonymousMessage.findMany({
            where,
            select: {
                id: true,
                message: true,
                isRead: true,
                isArchived: true,
                createdAt: true,
                // CRITICAL: senderId is NEVER selected
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum,
        }),
        prisma.anonymousMessage.count({ where }),
        prisma.anonymousMessage.count({ where: { isRead: false, isArchived: false } }),
    ]);

    res.status(200).json({
        status: 'success',
        data: { messages: items, total, unreadCount, page: pageNum, totalPages: Math.ceil(total / limitNum) },
    });
});

// GET /api/anonymous-messages/stats — Admin: unread count for badge
export const getStats = catchAsync(async (req: Request, res: Response) => {
    const unreadCount = await prisma.anonymousMessage.count({
        where: { isRead: false, isArchived: false },
    });

    res.status(200).json({ status: 'success', data: { unreadCount } });
});

// PATCH /api/anonymous-messages/:id/read — Admin: mark as read
export const markAsRead = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    await prisma.anonymousMessage.update({
        where: { id },
        data: { isRead: true },
    });

    res.status(200).json({ status: 'success' });
});

// PATCH /api/anonymous-messages/:id/archive — Admin: archive message
export const archiveMessage = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    await prisma.anonymousMessage.update({
        where: { id },
        data: { isArchived: true, isRead: true },
    });

    res.status(200).json({ status: 'success' });
});
