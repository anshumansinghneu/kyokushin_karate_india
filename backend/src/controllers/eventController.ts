import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';
import { sendEventRegistrationEmail } from '../services/emailService';

export const getAllEvents = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
        prisma.event.findMany({
            orderBy: { startDate: 'asc' },
            skip,
            take: limit,
            select: {
                id: true,
                type: true,
                name: true,
                description: true,
                imageUrl: true,
                startDate: true,
                endDate: true,
                location: true,
                registrationDeadline: true,
                maxParticipants: true,
                memberFee: true,
                nonMemberFee: true,
                status: true,
                categories: true,
                isPreEvent: true,
                assignedInstructorId: true,
                createdAt: true,
                updatedAt: true,
                dojoId: true,
                dojo: {
                    select: { name: true, city: true }
                },
                assignedInstructor: {
                    select: { id: true, name: true }
                }
            }
        }),
        prisma.event.count(),
    ]);

    res.status(200).json({
        status: 'success',
        results: events.length,
        total,
        page,
        pages: Math.ceil(total / limit),
        data: {
            events,
        },
    });
});

export const getEvent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const event = await prisma.event.findUnique({
        where: { id: req.params.id },
        include: {
            dojo: true,
            assignedInstructor: { select: { id: true, name: true } },
            registrations: {
                select: { id: true } // Only return count-able IDs publicly
            }
        }
    });

    if (!event) {
        return next(new AppError('No event found with that ID', 404));
    }

    // Return registration count instead of full registration data for public endpoint
    const { registrations, ...eventData } = event as any;

    res.status(200).json({
        status: 'success',
        data: {
            event: {
                ...eventData,
                registrationCount: registrations.length,
            },
        },
    });
});

export const createEvent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const currentUser = req.user;

    const {
        type, name, description, imageUrl, startDate, endDate, location, dojoId,
        registrationDeadline, maxParticipants, memberFee, nonMemberFee, categories, status,
        isPreEvent, assignedInstructorId
    } = req.body;

    const newEvent = await prisma.event.create({
        data: {
            type,
            name,
            description,
            imageUrl: imageUrl || null,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : new Date(startDate),
            location,
            dojoId: dojoId || null,
            registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : new Date(startDate),
            maxParticipants,
            memberFee,
            nonMemberFee,
            categories,
            createdBy: currentUser.id,
            status: status || 'UPCOMING',
            isPreEvent: isPreEvent || false,
            assignedInstructorId: assignedInstructorId || null
        },
    });

    res.status(201).json({
        status: 'success',
        data: {
            event: newEvent,
        },
    });
});

export const registerForEvent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;
    const { categoryAge, categoryWeight, categoryBelt, eventType } = req.body;
    const currentUser = req.user;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return next(new AppError('Event not found', 404));

    // Check deadline
    if (new Date() > event.registrationDeadline) {
        return next(new AppError('Registration deadline has passed', 400));
    }

    // Check existing registration
    const existingRegistration = await prisma.eventRegistration.findUnique({
        where: {
            eventId_userId: {
                eventId,
                userId: currentUser.id
            }
        }
    });

    if (existingRegistration) {
        return next(new AppError('You are already registered for this event', 400));
    }

    // Determine fee
    // For MVP, assume user is member if they have a role of STUDENT/INSTRUCTOR/ADMIN
    // Non-member logic would be different (likely a separate public endpoint or flag)
    const fee = event.memberFee;

    // For belt exams, auto-set the category to the student's current belt
    const beltCategory = event.type === 'BELT_EXAM' ? (currentUser.currentBeltRank || 'White') : categoryBelt;

    // Create registration
    const registration = await prisma.eventRegistration.create({
        data: {
            eventId,
            userId: currentUser.id,
            categoryAge,
            categoryWeight,
            categoryBelt: beltCategory,
            eventType,
            paymentStatus: 'PENDING', // Mock payment for now
            paymentAmount: fee,
            // Belt exams & camps auto-approve; tournaments require approval
            approvalStatus: event.type === 'TOURNAMENT' ? 'PENDING' : 'APPROVED'
        }
    });

    // Send event registration confirmation email
    sendEventRegistrationEmail(currentUser.email, currentUser.name, event.name).catch((err: any) => console.error('[EMAIL]', err.message));

    res.status(201).json({
        status: 'success',
        data: {
            registration,
        },
    });
});

export const approveRegistration = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { registrationId } = req.params;
    const currentUser = req.user;

    const registration = await prisma.eventRegistration.update({
        where: { id: registrationId },
        data: {
            approvalStatus: 'APPROVED',
            approvedBy: currentUser.id,
            approvedAt: new Date()
        }
    });

    res.status(200).json({
        status: 'success',
        data: {
            registration,
        },
    });
});

export const rejectRegistration = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { registrationId } = req.params;

    const registration = await prisma.eventRegistration.update({
        where: { id: registrationId },
        data: {
            approvalStatus: 'REJECTED',
        }
    });

    res.status(200).json({
        status: 'success',
        data: { registration },
    });
});

export const bulkApproveRegistrations = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { registrationIds } = req.body;
    const currentUser = req.user;

    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
        return next(new AppError('Please provide an array of registration IDs', 400));
    }

    const result = await prisma.eventRegistration.updateMany({
        where: { id: { in: registrationIds } },
        data: {
            approvalStatus: 'APPROVED',
            approvedBy: currentUser.id,
            approvedAt: new Date()
        }
    });

    res.status(200).json({
        status: 'success',
        message: `${result.count} registrations approved`,
        data: { count: result.count },
    });
});
export const updateEvent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, type, description, imageUrl, startDate, endDate, location, dojoId, registrationDeadline, maxParticipants, memberFee, nonMemberFee, categories, status, isPreEvent, assignedInstructorId } = req.body;

    // Build update data with only valid Event model fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : undefined;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : undefined;
    if (location !== undefined) updateData.location = location;
    if (dojoId !== undefined) updateData.dojoId = dojoId || null;
    if (registrationDeadline !== undefined) updateData.registrationDeadline = registrationDeadline ? new Date(registrationDeadline) : undefined;
    if (maxParticipants !== undefined) updateData.maxParticipants = maxParticipants;
    if (memberFee !== undefined) updateData.memberFee = memberFee;
    if (nonMemberFee !== undefined) updateData.nonMemberFee = nonMemberFee;
    if (categories !== undefined) updateData.categories = categories;
    if (status !== undefined) updateData.status = status;
    if (isPreEvent !== undefined) updateData.isPreEvent = isPreEvent;
    if (assignedInstructorId !== undefined) updateData.assignedInstructorId = assignedInstructorId || null;

    try {
        const event = await prisma.event.update({
            where: { id: req.params.id },
            data: updateData,
        });

        res.status(200).json({
            status: 'success',
            data: {
                event,
            },
        });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return next(new AppError('No event found with that ID', 404));
        }
        throw error;
    }
});

export const deleteEvent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    await prisma.event.delete({
        where: { id: req.params.id },
    });

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

export const getEventRegistrations = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const registrations = await prisma.eventRegistration.findMany({
        where: { eventId: req.params.id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    dateOfBirth: true,
                    weight: true,
                    height: true,
                    city: true,
                    state: true,
                    currentBeltRank: true,
                    membershipNumber: true,
                    membershipStatus: true,
                    profilePhotoUrl: true,
                    dojo: {
                        select: {
                            name: true,
                            city: true
                        }
                    }
                }
            }
        },
        orderBy: { registeredAt: 'desc' }
    });

    res.status(200).json({
        status: 'success',
        results: registrations.length,
        data: {
            registrations,
        },
    });
});

// ─── Enroll Student in Event (Instructor/Admin on behalf) ─────────────
export const enrollStudentInEvent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const currentUser = req.user;
    const { eventId } = req.params;
    const { studentId, categoryAge, categoryWeight, categoryBelt, eventType, voucherCode } = req.body;

    if (!studentId) return next(new AppError('Student ID is required', 400));

    // Validate event
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return next(new AppError('Event not found', 404));

    if (event.status === 'CANCELLED') return next(new AppError('This event has been cancelled', 400));
    if (event.status === 'COMPLETED') return next(new AppError('This event has already been completed', 400));
    if (new Date() > event.registrationDeadline) {
        return next(new AppError('Registration deadline has passed', 400));
    }

    // Validate student belongs to instructor (unless admin)
    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student) return next(new AppError('Student not found', 404));

    if (currentUser.role === 'INSTRUCTOR') {
        if (student.primaryInstructorId !== currentUser.id) {
            return next(new AppError('You can only enroll your own students', 403));
        }
    }

    // Check student is active member
    if (student.membershipStatus !== 'ACTIVE') {
        return next(new AppError('Student must have an active membership to register for events', 400));
    }

    // Check duplicate registration
    const existingReg = await prisma.eventRegistration.findUnique({
        where: {
            eventId_userId: { eventId, userId: studentId },
        },
    });
    if (existingReg) return next(new AppError('This student is already registered for this event', 400));

    // Check max participants
    if (event.maxParticipants) {
        const regCount = await prisma.eventRegistration.count({ where: { eventId } });
        if (regCount >= event.maxParticipants) {
            return next(new AppError('This event has reached maximum capacity', 400));
        }
    }

    const fee = event.memberFee || 0;

    // For belt exams, auto-set category to student's current belt
    const resolvedCategoryBelt = event.type === 'BELT_EXAM' ? (student.currentBeltRank || 'White') : (categoryBelt || null);

    // Voucher is mandatory for paid events
    if (fee > 0 && !voucherCode) {
        return next(new AppError('A voucher code is required for paid events', 400));
    }

    // ── Handle voucher-based enrollment ──
    if (voucherCode) {
        const voucher = await prisma.cashVoucher.findUnique({
            where: { code: voucherCode.trim().toUpperCase() },
        });
        if (!voucher) return next(new AppError('Invalid voucher code', 404));
        if (!voucher.isActive) return next(new AppError('This voucher has been deactivated', 400));
        if (voucher.isRedeemed) return next(new AppError('This voucher has already been used', 400));
        if (new Date() > voucher.expiryDate) return next(new AppError('This voucher has expired', 400));

        // Check applicability
        if (voucher.applicableTo !== 'ALL') {
            if (voucher.applicableTo !== event.type) {
                return next(new AppError(`This voucher is not valid for ${event.type} events`, 400));
            }
        }
        if (voucher.specificEventId && voucher.specificEventId !== eventId) {
            return next(new AppError('This voucher is for a different event', 400));
        }

        const result = await prisma.$transaction(async (tx: any) => {
            const payment = await tx.payment.create({
                data: {
                    type: 'TOURNAMENT',
                    amount: fee,
                    taxAmount: 0,
                    totalAmount: fee,
                    currency: 'INR',
                    status: 'PAID',
                    paidAt: new Date(),
                    userId: studentId,
                    eventId,
                    description: `Event Registration - ${event.name} (Voucher: ${voucherCode}, enrolled by ${currentUser.name})`,
                },
            });

            const registration = await tx.eventRegistration.create({
                data: {
                    eventId,
                    userId: studentId,
                    categoryAge: categoryAge || null,
                    categoryWeight: categoryWeight || null,
                    categoryBelt: resolvedCategoryBelt,
                    eventType: eventType || null,
                    paymentStatus: 'PAID',
                    paymentAmount: fee,
                    voucherCodeUsed: voucherCode,
                    discountAmount: fee,
                    finalAmount: 0,
                    approvalStatus: event.type === 'TOURNAMENT' ? 'PENDING' : 'APPROVED',
                },
            });

            await tx.cashVoucher.update({
                where: { id: voucher.id },
                data: {
                    isRedeemed: true,
                    redeemedBy: studentId,
                    redeemedAt: new Date(),
                },
            });

            return { registration, payment };
        });

        sendEventRegistrationEmail(student.email, student.name, event.name).catch((err: any) => console.error('[EMAIL]', err.message));

        return res.status(201).json({
            status: 'success',
            message: `${student.name} enrolled in ${event.name} with voucher.`,
            data: { registration: result.registration, payment: result.payment },
        });
    }

    // ── Free event — no voucher needed ──
    const registration = await prisma.eventRegistration.create({
        data: {
            eventId,
            userId: studentId,
            categoryAge: categoryAge || null,
            categoryWeight: categoryWeight || null,
            categoryBelt: resolvedCategoryBelt,
            eventType: eventType || null,
            paymentStatus: 'PAID',
            paymentAmount: 0,
            finalAmount: 0,
            approvalStatus: event.type === 'TOURNAMENT' ? 'PENDING' : 'APPROVED',
        },
    });

    sendEventRegistrationEmail(student.email, student.name, event.name).catch((err: any) => console.error('[EMAIL]', err.message));

    res.status(201).json({
        status: 'success',
        message: `${student.name} enrolled in ${event.name}.`,
        data: { registration },
    });
});
