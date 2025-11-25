"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEvent = exports.updateEvent = exports.approveRegistration = exports.registerForEvent = exports.createEvent = exports.getEvent = exports.getAllEvents = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const errorHandler_1 = require("../utils/errorHandler");
const catchAsync_1 = require("../utils/catchAsync");
exports.getAllEvents = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const events = await prisma_1.default.event.findMany({
        orderBy: { startDate: 'asc' },
        include: {
            dojo: { select: { name: true, city: true } }
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
exports.getEvent = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const event = await prisma_1.default.event.findUnique({
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
        return next(new errorHandler_1.AppError('No event found with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            event,
        },
    });
});
exports.createEvent = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    // @ts-ignore
    const currentUser = req.user;
    const { type, name, description, imageUrl, startDate, endDate, location, dojoId, registrationDeadline, maxParticipants, memberFee, nonMemberFee, categories } = req.body;
    const newEvent = await prisma_1.default.event.create({
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
exports.registerForEvent = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { eventId } = req.params;
    const { categoryAge, categoryWeight, categoryBelt, eventType } = req.body;
    // @ts-ignore
    const currentUser = req.user;
    const event = await prisma_1.default.event.findUnique({ where: { id: eventId } });
    if (!event)
        return next(new errorHandler_1.AppError('Event not found', 404));
    // Check deadline
    if (new Date() > event.registrationDeadline) {
        return next(new errorHandler_1.AppError('Registration deadline has passed', 400));
    }
    // Check existing registration
    const existingRegistration = await prisma_1.default.eventRegistration.findUnique({
        where: {
            eventId_userId: {
                eventId,
                userId: currentUser.id
            }
        }
    });
    if (existingRegistration) {
        return next(new errorHandler_1.AppError('You are already registered for this event', 400));
    }
    // Determine fee
    // For MVP, assume user is member if they have a role of STUDENT/INSTRUCTOR/ADMIN
    // Non-member logic would be different (likely a separate public endpoint or flag)
    const fee = event.memberFee;
    // Create registration
    const registration = await prisma_1.default.eventRegistration.create({
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
    res.status(201).json({
        status: 'success',
        data: {
            registration,
        },
    });
});
exports.approveRegistration = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { registrationId } = req.params;
    // @ts-ignore
    const currentUser = req.user;
    const registration = await prisma_1.default.eventRegistration.update({
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
exports.updateEvent = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const event = await prisma_1.default.event.update({
        where: { id: req.params.id },
        data: req.body,
    });
    if (!event) {
        return next(new errorHandler_1.AppError('No event found with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            event,
        },
    });
});
exports.deleteEvent = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    await prisma_1.default.event.delete({
        where: { id: req.params.id },
    });
    res.status(204).json({
        status: 'success',
        data: null,
    });
});
