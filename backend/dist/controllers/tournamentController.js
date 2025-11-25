"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBrackets = exports.generateBrackets = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const tournamentService_1 = require("../services/tournamentService");
const errorHandler_1 = require("../utils/errorHandler");
exports.generateBrackets = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { eventId } = req.params;
    const brackets = await tournamentService_1.TournamentService.generateBrackets(eventId);
    res.status(200).json({
        status: 'success',
        results: brackets.length,
        data: {
            brackets,
        },
    });
});
exports.getBrackets = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { eventId } = req.params;
    const brackets = await tournamentService_1.TournamentService.getBrackets(eventId);
    // @ts-ignore
    const currentUser = req.user;
    // Visibility Check: If bracket is DRAFT, only Admin can see it
    if (brackets.length > 0) {
        const isDraft = brackets.some(b => b.status === 'DRAFT');
        if (isDraft && currentUser.role !== 'ADMIN') {
            return next(new errorHandler_1.AppError('Tournament brackets are not yet published', 403));
        }
    }
    res.status(200).json({
        status: 'success',
        data: {
            brackets,
        },
    });
});
