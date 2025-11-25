import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';
import { sendBeltPromotionEmail } from '../services/emailService';

// Helper to get belt rank value (higher is better)
const getBeltValue = (belt: string) => {
    const belts = ['White', 'Orange', 'Blue', 'Yellow', 'Green', 'Brown', 'Black'];
    return belts.indexOf(belt);
};

export const promoteStudent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { studentId, newBelt, notes } = req.body;
    // @ts-ignore
    const currentUser = req.user;

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student) {
        return next(new AppError('Student not found', 404));
    }

    // Authorization Check
    if (currentUser.role === 'INSTRUCTOR') {
        if (student.dojoId !== currentUser.dojoId) {
            return next(new AppError('You can only promote students from your dojo', 403));
        }

        // Check if new belt is higher or equal to instructor's belt
        const instructorBeltValue = getBeltValue(currentUser.currentBeltRank || 'White');
        const newBeltValue = getBeltValue(newBelt);

        if (newBeltValue >= instructorBeltValue) {
            return next(new AppError('You cannot promote a student to a rank equal to or higher than your own', 400));
        }
    } else if (currentUser.role !== 'ADMIN') {
        return next(new AppError('Not authorized to promote students', 403));
    }

    // Check 6-month constraint: Student must wait 6 months since last promotion
    const lastPromotion = await prisma.beltHistory.findFirst({
        where: { studentId },
        orderBy: { promotionDate: 'desc' }
    });

    if (lastPromotion) {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        if (new Date(lastPromotion.promotionDate) > sixMonthsAgo) {
            const nextEligibleDate = new Date(lastPromotion.promotionDate);
            nextEligibleDate.setMonth(nextEligibleDate.getMonth() + 6);
            return next(new AppError(
                `Student must wait 6 months between belt promotions. Next eligible date: ${nextEligibleDate.toLocaleDateString()}`,
                400
            ));
        }
    }

    const oldBelt = student.currentBeltRank;

    // Transaction to update user and create history record
    const result = await prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
            where: { id: studentId },
            data: {
                currentBeltRank: newBelt,
            },
        });

        const beltHistory = await tx.beltHistory.create({
            data: {
                studentId,
                oldBelt,
                newBelt,
                promotedBy: currentUser.id,
                notes,
                promotionDate: new Date(),
            },
        });

        return { updatedUser, beltHistory };
    });

    // Send Email Notification
    await sendBeltPromotionEmail(student.email, student.name, newBelt, currentUser.name);

    res.status(200).json({
        status: 'success',
        data: result,
    });
});

export const getBeltHistory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    // @ts-ignore
    const currentUser = req.user;

    // Authorization: Admin, Instructor (same dojo), or the student themselves
    const student = await prisma.user.findUnique({ where: { id: userId } });
    if (!student) return next(new AppError('Student not found', 404));

    if (currentUser.role === 'STUDENT' && currentUser.id !== userId) {
        return next(new AppError('Not authorized to view this history', 403));
    }
    if (currentUser.role === 'INSTRUCTOR' && student.dojoId !== currentUser.dojoId) {
        return next(new AppError('Not authorized to view this history', 403));
    }

    const history = await prisma.beltHistory.findMany({
        where: { studentId: userId },
        orderBy: { promotionDate: 'desc' },
        include: {
            promoter: {
                select: { name: true }
            }
        }
    });

    res.status(200).json({
        status: 'success',
        results: history.length,
        data: {
            history,
        },
    });
});
