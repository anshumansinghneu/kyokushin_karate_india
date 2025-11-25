"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrainingSessions = exports.logTrainingSession = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const errorHandler_1 = require("../utils/errorHandler");
const catchAsync_1 = require("../utils/catchAsync");
exports.logTrainingSession = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    // @ts-ignore
    const userId = req.user.id;
    const { date, duration, intensity, focus, notes } = req.body;
    if (!date || !duration || !intensity) {
        return next(new errorHandler_1.AppError('Please provide date, duration, and intensity', 400));
    }
    const session = await prisma_1.default.trainingSession.create({
        data: {
            userId,
            date: new Date(date),
            duration: parseInt(duration),
            intensity,
            focus,
            notes
        }
    });
    res.status(201).json({
        status: 'success',
        data: {
            session
        }
    });
});
exports.getTrainingSessions = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    // @ts-ignore
    const userId = req.user.id;
    const sessions = await prisma_1.default.trainingSession.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 30 // Get last 30 sessions
    });
    res.status(200).json({
        status: 'success',
        results: sessions.length,
        data: {
            sessions
        }
    });
});
