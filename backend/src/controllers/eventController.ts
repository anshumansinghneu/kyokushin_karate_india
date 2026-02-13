import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';
import { catchAsync } from '../utils/catchAsync';
import { sendEventRegistrationEmail } from '../services/emailService';

export const getAllEvents = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const events = await prisma.event.findMany({
        orderBy: { startDate: 'asc' },
        select: {
            id: true,
            type: true,
            name: true,
            description: true,
            startDate: true,
            endDate: true,
            location: true,
            registrationDeadline: true,
            maxParticipants: true,
            memberFee: true,
            nonMemberFee: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            dojoId: true,
            dojo: {
                select: { name: true, city: true }
            }
            // Intentionally omitting imageUrl until migration is run in production
        }
    });

    res.status(200).json({
        status: 'success',
        results: events.length,
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
            registrations: {
                include: {
                    user: { select: { name: true, currentBeltRank: true, dojo: { select: { name: true } } } }
                }
            }
        }
    });

    if (!event) {
        return next(new AppError('No event found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            event,
        },
    });
});

export const createEvent = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const currentUser = req.user;

    const {
        type, name, description, imageUrl, startDate, endDate, location, dojoId,
        registrationDeadline, maxParticipants, memberFee, nonMemberFee, categories
    } = req.body;

    const newEvent = await prisma.event.create({
        data: {
            type,
            name,
            description,
            imageUrl,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            location,
            dojoId,
            registrationDeadline: new Date(registrationDeadline),
            maxParticipants,
            memberFee,
            nonMemberFee,
            categories,
            createdBy: currentUser.id,
            status: 'UPCOMING'
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
    // @ts-ignore
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

    // Create registration
    const registration = await prisma.eventRegistration.create({
        data: {
            eventId,
            userId: currentUser.id,
            categoryAge,
            categoryWeight,
            categoryBelt,
            eventType,
            paymentStatus: 'PENDING', // Mock payment for now
            paymentAmount: fee,
            approvalStatus: event.type === 'TOURNAMENT' ? 'PENDING' : 'APPROVED' // Camps auto-approve
        }
    });

    // Send event registration confirmation email
    sendEventRegistrationEmail(currentUser.email, currentUser.name, event.name);

    res.status(201).json({
        status: 'success',
        data: {
            registration,
        },
    });
});

export const approveRegistration = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { registrationId } = req.params;
    // @ts-ignore
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
    // @ts-ignore
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
    const { name, type, description, imageUrl, startDate, endDate, location, dojoId, registrationDeadline, maxParticipants, memberFee, nonMemberFee, categories, status } = req.body;

    // Build update data with only valid Event model fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (location !== undefined) updateData.location = location;
    if (dojoId !== undefined) updateData.dojoId = dojoId;
    if (registrationDeadline !== undefined) updateData.registrationDeadline = new Date(registrationDeadline);
    if (maxParticipants !== undefined) updateData.maxParticipants = maxParticipants;
    if (memberFee !== undefined) updateData.memberFee = memberFee;
    if (nonMemberFee !== undefined) updateData.nonMemberFee = nonMemberFee;
    if (categories !== undefined) updateData.categories = categories;
    if (status !== undefined) updateData.status = status;

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
