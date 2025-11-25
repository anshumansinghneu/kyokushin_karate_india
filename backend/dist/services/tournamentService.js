"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentService = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const errorHandler_1 = require("../utils/errorHandler");
// Helper to calculate next power of 2
const nextPowerOf2 = (n) => {
    if (n === 0)
        return 0;
    return Math.pow(2, Math.ceil(Math.log2(n)));
};
// Belt Rank Values for Seeding
const BELT_RANKS = {
    'White': 1, 'Orange': 2, 'Blue': 3, 'Yellow': 4, 'Green': 5, 'Brown': 6,
    'Black': 7, 'Black 1st Dan': 7, 'Black 2nd Dan': 8, 'Black 3rd Dan': 9
};
const getBeltValue = (belt) => {
    if (!belt)
        return 0;
    for (const [key, val] of Object.entries(BELT_RANKS)) {
        if (belt.includes(key))
            return val;
    }
    return 1;
};
exports.TournamentService = {
    async generateBrackets(eventId) {
        const event = await prisma_1.default.event.findUnique({ where: { id: eventId } });
        if (!event)
            throw new errorHandler_1.AppError('Event not found', 404);
        // 1. Get all approved registrations
        const registrations = await prisma_1.default.eventRegistration.findMany({
            where: {
                eventId,
                approvalStatus: 'APPROVED'
            },
            include: {
                user: {
                    include: { dojo: true }
                }
            }
        });
        if (registrations.length === 0) {
            throw new errorHandler_1.AppError('No approved participants found', 400);
        }
        // 2. Group by Category
        const categories = new Map();
        registrations.forEach((reg) => {
            const key = `${reg.categoryAge || 'Open'}|${reg.categoryWeight || 'Open'}|${reg.categoryBelt || 'Open'}`;
            if (!categories.has(key)) {
                categories.set(key, []);
            }
            categories.get(key)?.push(reg);
        });
        const generatedBrackets = [];
        // 3. Process each category
        for (const [categoryKey, participants] of categories) {
            const [age, weight, belt] = categoryKey.split('|');
            const categoryName = `${age}, ${weight}, ${belt}`;
            // Sort/Seed Participants
            participants.sort((a, b) => {
                const beltA = getBeltValue(a.user.currentBeltRank);
                const beltB = getBeltValue(b.user.currentBeltRank);
                if (beltA !== beltB)
                    return beltB - beltA;
                return 0;
            });
            const totalParticipants = participants.length;
            const bracketSize = nextPowerOf2(totalParticipants);
            // Create Bracket Record
            const bracket = await prisma_1.default.tournamentBracket.create({
                data: {
                    eventId,
                    categoryName,
                    categoryAge: age,
                    categoryWeight: weight,
                    categoryBelt: belt,
                    totalParticipants,
                    status: 'DRAFT'
                }
            });
            const matches = [];
            let matchNumber = 1;
            // Create Round 1
            for (let i = 0; i < participants.length; i += 2) {
                const fighterA = participants[i];
                const fighterB = participants[i + 1];
                const isBye = !fighterB;
                const match = await prisma_1.default.match.create({
                    data: {
                        bracketId: bracket.id,
                        roundNumber: 1,
                        roundName: 'Round 1',
                        matchNumber: matchNumber++,
                        fighterAId: fighterA.userId,
                        fighterAName: fighterA.user.name,
                        fighterBId: fighterB ? fighterB.userId : null,
                        fighterBName: fighterB ? fighterB.user.name : null,
                        isBye,
                        status: isBye ? 'COMPLETED' : 'SCHEDULED',
                        winnerId: isBye ? fighterA.userId : null,
                        completedAt: isBye ? new Date() : null
                    }
                });
                matches.push(match);
            }
            // Generate placeholders for subsequent rounds
            let currentRoundMatches = matches;
            let round = 2;
            while (currentRoundMatches.length > 1) {
                const nextRoundMatches = [];
                for (let i = 0; i < currentRoundMatches.length; i += 2) {
                    const prevMatch1 = currentRoundMatches[i];
                    const prevMatch2 = currentRoundMatches[i + 1];
                    const nextMatch = await prisma_1.default.match.create({
                        data: {
                            bracketId: bracket.id,
                            roundNumber: round,
                            roundName: `Round ${round}`,
                            matchNumber: matchNumber++,
                            status: 'SCHEDULED'
                        }
                    });
                    await prisma_1.default.match.update({
                        where: { id: prevMatch1.id },
                        data: { nextMatchId: nextMatch.id }
                    });
                    if (prevMatch2) {
                        await prisma_1.default.match.update({
                            where: { id: prevMatch2.id },
                            data: { nextMatchId: nextMatch.id }
                        });
                    }
                    nextRoundMatches.push(nextMatch);
                }
                currentRoundMatches = nextRoundMatches;
                round++;
            }
            generatedBrackets.push(bracket);
        }
        return generatedBrackets;
    },
    async getBrackets(eventId) {
        return prisma_1.default.tournamentBracket.findMany({
            where: { eventId },
            include: {
                matches: {
                    orderBy: { matchNumber: 'asc' }
                }
            }
        });
    }
};
