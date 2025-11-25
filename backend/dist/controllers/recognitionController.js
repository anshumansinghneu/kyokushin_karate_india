"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeRecognition = exports.assignRecognition = exports.getCurrentMonthRecognitions = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const errorHandler_1 = require("../utils/errorHandler");
const catchAsync_1 = require("../utils/catchAsync");
exports.getCurrentMonthRecognitions = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();
    const recognitions = await prisma_1.default.monthlyRecognition.findMany({
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
exports.assignRecognition = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { userId, type, month, year } = req.body;
    // Validate type
    if (!['INSTRUCTOR', 'STUDENT'].includes(type)) {
        return next(new errorHandler_1.AppError('Invalid recognition type', 400));
    }
    // Check if user exists
    const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user) {
        return next(new errorHandler_1.AppError('User not found', 404));
    }
    // Check if limit reached (Top 2)
    const count = await prisma_1.default.monthlyRecognition.count({
        where: {
            month,
            year,
            type
        }
    });
    if (count >= 2) {
        return next(new errorHandler_1.AppError(`Cannot assign more than 2 ${type.toLowerCase()}s for this month`, 400));
    }
    // Create recognition
    const recognition = await prisma_1.default.monthlyRecognition.create({
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
exports.removeRecognition = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { id } = req.params;
    await prisma_1.default.monthlyRecognition.delete({
        where: { id }
    });
    res.status(204).json({
        status: 'success',
        data: null
    });
});
