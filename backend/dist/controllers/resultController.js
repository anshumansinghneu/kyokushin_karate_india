"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResults = exports.calculateResults = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const errorHandler_1 = require("../utils/errorHandler");
const catchAsync_1 = require("../utils/catchAsync");
exports.calculateResults = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { bracketId } = req.params;
    const bracket = await prisma_1.default.tournamentBracket.findUnique({
        where: { id: bracketId },
        include: {
            matches: {
                orderBy: { roundNumber: 'desc' }
            }
        }
    });
    if (!bracket)
        return next(new errorHandler_1.AppError('Bracket not found', 404));
    // Check if all matches are completed
    const incompleteMatches = bracket.matches.filter((m) => m.status !== 'COMPLETED');
    if (incompleteMatches.length > 0) {
        return next(new errorHandler_1.AppError('Cannot calculate results until all matches are completed', 400));
    }
    // Find the final match (highest round)
    const maxRound = Math.max(...bracket.matches.map((m) => m.roundNumber));
    const finalMatch = bracket.matches.find((m) => m.roundNumber === maxRound);
    if (!finalMatch || !finalMatch.winnerId) {
        return next(new errorHandler_1.AppError('Final match not found or no winner', 500));
    }
    const goldWinnerId = finalMatch.winnerId;
    const silverWinnerId = finalMatch.winnerId === finalMatch.fighterAId ? finalMatch.fighterBId : finalMatch.fighterAId;
    // Bronze: Losers of semi-finals (Round - 1)
    const semiFinals = bracket.matches.filter((m) => m.roundNumber === maxRound - 1);
    const bronzeWinnerIds = [];
    semiFinals.forEach((match) => {
        const loserId = match.winnerId === match.fighterAId ? match.fighterBId : match.fighterAId;
        if (loserId)
            bronzeWinnerIds.push(loserId);
    });
    // Save Results
    const results = [];
    // Gold
    results.push(await prisma_1.default.tournamentResult.create({
        data: {
            eventId: bracket.eventId,
            bracketId: bracket.id,
            userId: goldWinnerId,
            finalRank: 1,
            medal: 'GOLD',
            categoryName: bracket.categoryName
        }
    }));
    // Silver
    if (silverWinnerId) {
        results.push(await prisma_1.default.tournamentResult.create({
            data: {
                eventId: bracket.eventId,
                bracketId: bracket.id,
                userId: silverWinnerId,
                finalRank: 2,
                medal: 'SILVER',
                categoryName: bracket.categoryName
            }
        }));
    }
    // Bronze
    for (const userId of bronzeWinnerIds) {
        results.push(await prisma_1.default.tournamentResult.create({
            data: {
                eventId: bracket.eventId,
                bracketId: bracket.id,
                userId,
                finalRank: 3,
                medal: 'BRONZE',
                categoryName: bracket.categoryName
            }
        }));
    }
    await prisma_1.default.tournamentBracket.update({
        where: { id: bracketId },
        data: { status: 'COMPLETED' }
    });
    res.status(200).json({
        status: 'success',
        data: {
            results,
        },
    });
});
exports.getResults = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { eventId } = req.params;
    const results = await prisma_1.default.tournamentResult.findMany({
        where: { eventId },
        include: {
            user: { select: { name: true, dojo: { select: { name: true } } } }
        },
        orderBy: { finalRank: 'asc' }
    });
    res.status(200).json({
        status: 'success',
        data: {
            results,
        },
    });
});
