import { Request, Response } from 'express';
import prisma from '../prisma';
import { catchAsync } from '../utils/catchAsync';

// GET /api/notifications — get all notifications for the logged-in user
export const getNotifications = catchAsync(async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
                relatedEvent: {
                    select: { id: true, name: true, type: true }
                }
            }
        }),
        prisma.notification.count({ where: { userId } }),
        prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            notifications,
            unreadCount,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        }
    });
});

// GET /api/notifications/unread-count — quick count for badge
export const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    const count = await prisma.notification.count({
        where: { userId, isRead: false }
    });

    res.status(200).json({
        status: 'success',
        data: { unreadCount: count }
    });
});

// PATCH /api/notifications/:id/read — mark single notification as read
export const markAsRead = catchAsync(async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    const { id } = req.params;

    await prisma.notification.updateMany({
        where: { id, userId },
        data: { isRead: true }
    });

    res.status(200).json({
        status: 'success',
        message: 'Notification marked as read'
    });
});

// PATCH /api/notifications/mark-all-read — mark all notifications as read
export const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;

    await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
    });

    res.status(200).json({
        status: 'success',
        message: 'All notifications marked as read'
    });
});

// DELETE /api/notifications/:id — delete a notification
export const deleteNotification = catchAsync(async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.id;
    const { id } = req.params;

    await prisma.notification.deleteMany({
        where: { id, userId }
    });

    res.status(200).json({
        status: 'success',
        message: 'Notification deleted'
    });
});
