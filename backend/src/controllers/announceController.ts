import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/errorHandler';
import { sendBulkAnnouncementEmail } from '../services/emailService';

// POST /api/announcements/send — Admin only
export const sendAnnouncement = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { subject, body, targetAudience, dojoId } = req.body;
    // targetAudience: 'all' | 'students' | 'instructors' | 'active' | 'dojo'

    if (!subject || !body) {
        return next(new AppError('Subject and body are required', 400));
    }

    // Build filter
    const where: any = {};

    switch (targetAudience) {
        case 'students':
            where.role = 'STUDENT';
            break;
        case 'instructors':
            where.role = 'INSTRUCTOR';
            break;
        case 'active':
            where.membershipStatus = 'ACTIVE';
            break;
        case 'dojo':
            if (!dojoId) return next(new AppError('dojoId is required for dojo-specific announcements', 400));
            where.dojoId = dojoId;
            break;
        case 'all':
        default:
            // No filter — everyone
            break;
    }

    const users = await prisma.user.findMany({
        where,
        select: { email: true, name: true },
    });

    if (users.length === 0) {
        return res.status(200).json({
            status: 'success',
            data: { sent: 0, failed: 0, total: 0, message: 'No recipients found for the selected audience.' },
        });
    }

    // Send emails (runs in background, but we await for result)
    const results = await sendBulkAnnouncementEmail(users, subject, body);

    res.status(200).json({
        status: 'success',
        data: {
            ...results,
            total: users.length,
        },
    });
});
