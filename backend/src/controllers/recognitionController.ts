import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';

export const getCurrentMonthRecognitions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();

    const recognitions = await prisma.monthlyRecognition.findMany({
        where: {
            month,
            year
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    currentBeltRank: true,
                    profilePhotoUrl: true,
                    dojo: {
                        select: {
                            name: true,
                            city: true
                        }
                    }
                }
            }
        }
    });

    // Group by type
    const instructors = recognitions.filter(r => r.type === 'INSTRUCTOR');
    const students = recognitions.filter(r => r.type === 'STUDENT');

    res.status(200).json({
        status: 'success',
        data: {
            month,
            year,
            instructors,
            students
        }
    });
});

export const assignRecognition = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { userId, type, month, year } = req.body;

    // Validate type
    if (!['INSTRUCTOR', 'STUDENT'].includes(type)) {
        return next(new AppError('Invalid recognition type', 400));
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    // Check if limit reached (Top 2)
    const count = await prisma.monthlyRecognition.count({
        where: {
            month,
            year,
            type
        }
    });

    if (count >= 2) {
        return next(new AppError(`Cannot assign more than 2 ${type.toLowerCase()}s for this month`, 400));
    }

    // Create recognition
    const recognition = await prisma.monthlyRecognition.create({
        data: {
            userId,
            type,
            month,
            year
        }
    });

    res.status(201).json({
        status: 'success',
        data: {
            recognition
        }
    });
});

export const removeRecognition = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    await prisma.monthlyRecognition.delete({
        where: { id }
    });

    res.status(204).json({
        status: 'success',
        data: null
    });
});
