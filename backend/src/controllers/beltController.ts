import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';
import { sendBeltPromotionEmail } from '../services/emailService';

// ─── Public Belt / Membership Verification ────────────────────────────
export const publicVerify = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { membershipNumber } = req.params;

    if (!membershipNumber) {
        return next(new AppError('Membership number is required', 400));
    }

    const user = await prisma.user.findUnique({
        where: { membershipNumber },
        select: {
            name: true,
            membershipNumber: true,
            membershipStatus: true,
            membershipStartDate: true,
            membershipEndDate: true,
            currentBeltRank: true,
            role: true,
            profilePhotoUrl: true,
            createdAt: true,
            city: true,
            state: true,
            dojo: { select: { name: true, city: true } },
            beltHistory: {
                orderBy: { promotionDate: 'desc' },
                select: { newBelt: true, promotionDate: true },
            },
        },
    });

    if (!user) {
        return res.status(404).json({
            status: 'fail',
            message: 'No member found with this membership number',
        });
    }

    // Calculate experience in years
    const startDate = user.membershipStartDate || user.createdAt;
    const experienceMs = Date.now() - new Date(startDate).getTime();
    const experienceYears = Math.floor(experienceMs / (365.25 * 24 * 60 * 60 * 1000));
    const experienceMonths = Math.floor((experienceMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));

    res.status(200).json({
        status: 'success',
        data: {
            member: {
                name: user.name,
                membershipNumber: user.membershipNumber,
                membershipStatus: user.membershipStatus,
                membershipStartDate: user.membershipStartDate,
                membershipEndDate: user.membershipEndDate,
                currentBeltRank: user.currentBeltRank,
                role: user.role,
                profilePhotoUrl: user.profilePhotoUrl,
                city: user.city,
                state: user.state,
                dojo: user.dojo,
                lastPromotion: user.beltHistory[0] || null,
                beltHistory: user.beltHistory,
                totalPromotions: user.beltHistory.length,
                experience: {
                    years: experienceYears,
                    months: experienceMonths,
                    display: experienceYears > 0
                        ? `${experienceYears} yr${experienceYears > 1 ? 's' : ''}${experienceMonths > 0 ? ` ${experienceMonths} mo` : ''}`
                        : `${experienceMonths} mo`,
                },
            },
        },
    });
});

// Helper to get belt rank value (higher is better)
const getBeltValue = (belt: string) => {
    const belts = ['White', 'Orange', 'Blue', 'Yellow', 'Green', 'Brown', 'Black'];
    return belts.indexOf(belt);
};

export const promoteStudent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { studentId, newBelt, notes, promotionDate } = req.body;
    // @ts-ignore
    const currentUser = req.user;

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student) {
        return next(new AppError('Student not found', 404));
    }

    // Authorization Check
    if (currentUser.role === 'INSTRUCTOR') {
        if (student.primaryInstructorId !== currentUser.id) {
            return next(new AppError('You can only promote students assigned to you', 403));
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

    // Parse and validate promotion date
    const promDate = promotionDate ? new Date(promotionDate) : new Date();

    // Date cannot be in the future
    if (promDate > new Date()) {
        return next(new AppError('Promotion date cannot be in the future', 400));
    }

    // Check 6-month constraint: Student must wait 6 months since last promotion
    const lastPromotion = await prisma.beltHistory.findFirst({
        where: { studentId },
        orderBy: { promotionDate: 'desc' }
    });

    if (lastPromotion) {
        // Promotion date must be after last promotion date
        if (promDate <= new Date(lastPromotion.promotionDate)) {
            return next(new AppError('Promotion date must be after the last promotion date', 400));
        }

        const sixMonthsAfterLast = new Date(lastPromotion.promotionDate);
        sixMonthsAfterLast.setMonth(sixMonthsAfterLast.getMonth() + 6);

        if (promDate < sixMonthsAfterLast) {
            return next(new AppError(
                `Student must wait 6 months between belt promotions. Next eligible date: ${sixMonthsAfterLast.toLocaleDateString()}`,
                400
            ));
        }
    }

    const oldBelt = student.currentBeltRank;

    // Validate belt progression (no skipping)
    const currentBeltValue = getBeltValue(oldBelt || 'White');
    const newBeltValue = getBeltValue(newBelt);

    if (newBeltValue !== currentBeltValue + 1 && currentUser.role !== 'ADMIN') {
        return next(new AppError('Cannot skip belt ranks. Must promote to the next belt level.', 400));
    }

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
                promotionDate: promDate,
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

/**
 * Get pending belt verification requests for instructor
 */
export const getPendingVerifications = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const instructorId = req.user.id;
    // @ts-ignore
    const userRole = req.user.role;

    if (userRole !== 'INSTRUCTOR' && userRole !== 'ADMIN') {
        return next(new AppError('Only instructors and admins can view verification requests', 403));
    }

    // Get all pending requests (admins see all, instructors see their students)
    const whereClause = userRole === 'ADMIN'
        ? { status: 'PENDING' as const }
        : {
            status: 'PENDING' as const,
            student: {
                primaryInstructorId: instructorId
            }
        };

    const requests = await prisma.beltVerificationRequest.findMany({
        where: whereClause,
        include: {
            student: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    currentBeltRank: true,
                    profilePhotoUrl: true,
                    membershipNumber: true,
                    city: true,
                    state: true,
                    dojo: {
                        select: {
                            id: true,
                            name: true,
                            city: true,
                        }
                    },
                    primaryInstructor: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                }
            }
        },
        orderBy: {
            createdAt: 'asc'
        }
    });

    res.status(200).json({
        status: 'success',
        data: {
            requests,
            count: requests.length
        }
    });
});

/**
 * Approve or reject belt verification request
 */
export const reviewVerification = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { action, rejectionReason } = req.body; // action: 'APPROVE' | 'REJECT'
    // @ts-ignore
    const reviewerId = req.user.id;
    // @ts-ignore
    const userRole = req.user.role;

    if (userRole !== 'INSTRUCTOR' && userRole !== 'ADMIN') {
        return next(new AppError('Only instructors and admins can review verification requests', 403));
    }

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
        return next(new AppError('Action must be either APPROVE or REJECT', 400));
    }

    if (action === 'REJECT' && !rejectionReason) {
        return next(new AppError('Rejection reason is required', 400));
    }

    const request = await prisma.beltVerificationRequest.findUnique({
        where: { id },
        include: {
            student: {
                select: {
                    id: true,
                    name: true,
                    currentBeltRank: true,
                    primaryInstructorId: true,
                }
            }
        }
    });

    if (!request) {
        return next(new AppError('Verification request not found', 404));
    }

    if (request.status !== 'PENDING') {
        return next(new AppError('This request has already been reviewed', 400));
    }

    // Instructors can only review their own students
    if (userRole === 'INSTRUCTOR' && request.student.primaryInstructorId !== reviewerId) {
        return next(new AppError('You can only review verification requests for your own students', 403));
    }

    // Use transaction to update request and student belt if approved
    const result = await prisma.$transaction(async (tx) => {
        // Update verification request
        const updatedRequest = await tx.beltVerificationRequest.update({
            where: { id },
            data: {
                status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
                reviewedBy: reviewerId,
                reviewedAt: new Date(),
                rejectionReason: action === 'REJECT' ? rejectionReason : null,
            },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        currentBeltRank: true,
                    }
                }
            }
        });

        if (action === 'APPROVE') {
            // Update student's current belt
            await tx.user.update({
                where: { id: request.student.id },
                data: {
                    currentBeltRank: request.requestedBelt,
                    verificationStatus: 'VERIFIED',
                }
            });

            // Create belt history entry using the exam date from request
            await tx.beltHistory.create({
                data: {
                    studentId: request.student.id,
                    oldBelt: request.student.currentBeltRank,
                    newBelt: request.requestedBelt,
                    promotedBy: reviewerId,
                    promotionDate: request.examDate, // Use the exam date provided by student
                    notes: `Belt verified by instructor. Original exam date: ${request.examDate.toLocaleDateString()}. ${request.reason || ''}`,
                }
            });
        } else {
            // Mark student as rejected
            await tx.user.update({
                where: { id: request.student.id },
                data: {
                    verificationStatus: 'REJECTED',
                }
            });
        }

        return updatedRequest;
    });

    res.status(200).json({
        status: 'success',
        data: {
            request: result
        }
    });
});

/**
 * Get verification request history for a student
 */
export const getStudentVerifications = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { studentId } = req.params;
    // @ts-ignore
    const userId = req.user.id;
    // @ts-ignore
    const userRole = req.user.role;

    // Students can only view their own requests
    if (userRole === 'STUDENT' && userId !== studentId) {
        return next(new AppError('You can only view your own verification requests', 403));
    }

    const requests = await prisma.beltVerificationRequest.findMany({
        where: { studentId },
        include: {
            reviewer: {
                select: {
                    id: true,
                    name: true,
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    res.status(200).json({
        status: 'success',
        data: {
            requests
        }
    });
});

/**
 * Get students eligible for belt promotion
 */
export const getEligibleStudents = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const instructorId = req.user.id;
    // @ts-ignore
    const userRole = req.user.role;

    if (userRole !== 'INSTRUCTOR' && userRole !== 'ADMIN') {
        return next(new AppError('Only instructors and admins can view eligible students', 403));
    }

    // Get all students (admins see all, instructors see their students)
    const whereClause = userRole === 'ADMIN'
        ? { role: 'STUDENT' as const }
        : {
            role: 'STUDENT' as const,
            primaryInstructorId: instructorId
        };

    const students = await prisma.user.findMany({
        where: whereClause,
        select: {
            id: true,
            name: true,
            email: true,
            membershipNumber: true,
            profilePhotoUrl: true,
            currentBeltRank: true,
            createdAt: true,
            dojo: {
                select: {
                    name: true
                }
            }
        }
    });

    // Get latest promotion date for each student
    const studentsWithEligibility = await Promise.all(students.map(async (student) => {
        const lastPromotion = await prisma.beltHistory.findFirst({
            where: { studentId: student.id },
            orderBy: { promotionDate: 'desc' },
            select: {
                promotionDate: true,
                newBelt: true
            }
        });

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const lastPromotionDate = lastPromotion?.promotionDate || student.createdAt;
        const isEligible = new Date(lastPromotionDate) <= sixMonthsAgo;

        const daysSincePromotion = Math.floor(
            (Date.now() - new Date(lastPromotionDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        const nextEligibleDate = new Date(lastPromotionDate);
        nextEligibleDate.setMonth(nextEligibleDate.getMonth() + 6);

        return {
            ...student,
            lastPromotionDate,
            daysSincePromotion,
            isEligible,
            nextEligibleDate: isEligible ? null : nextEligibleDate
        };
    }));

    res.status(200).json({
        status: 'success',
        results: studentsWithEligibility.length,
        data: {
            students: studentsWithEligibility
        }
    });
});
