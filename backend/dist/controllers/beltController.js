"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBeltHistory = exports.promoteStudent = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const errorHandler_1 = require("../utils/errorHandler");
const catchAsync_1 = require("../utils/catchAsync");
const emailService_1 = require("../services/emailService");
// Helper to get belt rank value (higher is better)
const getBeltValue = (belt) => {
    const belts = ['White', 'Orange', 'Blue', 'Yellow', 'Green', 'Brown', 'Black'];
    return belts.indexOf(belt);
};
exports.promoteStudent = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { studentId, newBelt, notes } = req.body;
    // @ts-ignore
    const currentUser = req.user;
    const student = await prisma_1.default.user.findUnique({ where: { id: studentId } });
    if (!student) {
        return next(new errorHandler_1.AppError('Student not found', 404));
    }
    // Authorization Check
    if (currentUser.role === 'INSTRUCTOR') {
        if (student.dojoId !== currentUser.dojoId) {
            return next(new errorHandler_1.AppError('You can only promote students from your dojo', 403));
        }
        // Check if new belt is higher or equal to instructor's belt
        const instructorBeltValue = getBeltValue(currentUser.currentBeltRank || 'White');
        const newBeltValue = getBeltValue(newBelt);
        if (newBeltValue >= instructorBeltValue) {
            return next(new errorHandler_1.AppError('You cannot promote a student to a rank equal to or higher than your own', 400));
        }
    }
    else if (currentUser.role !== 'ADMIN') {
        return next(new errorHandler_1.AppError('Not authorized to promote students', 403));
    }
    const oldBelt = student.currentBeltRank;
    // Transaction to update user and create history record
    const result = await prisma_1.default.$transaction(async (tx) => {
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
    await (0, emailService_1.sendBeltPromotionEmail)(student.email, student.name, newBelt, currentUser.name);
    res.status(200).json({
        status: 'success',
        data: result,
    });
});
exports.getBeltHistory = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { userId } = req.params;
    // @ts-ignore
    const currentUser = req.user;
    // Authorization: Admin, Instructor (same dojo), or the student themselves
    const student = await prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!student)
        return next(new errorHandler_1.AppError('Student not found', 404));
    if (currentUser.role === 'STUDENT' && currentUser.id !== userId) {
        return next(new errorHandler_1.AppError('Not authorized to view this history', 403));
    }
    if (currentUser.role === 'INSTRUCTOR' && student.dojoId !== currentUser.dojoId) {
        return next(new errorHandler_1.AppError('Not authorized to view this history', 403));
    }
    const history = await prisma_1.default.beltHistory.findMany({
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
