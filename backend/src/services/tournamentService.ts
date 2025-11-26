import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';

// Helper to calculate next power of 2
const nextPowerOf2 = (n: number) => {
    if (n === 0) return 0;
    return Math.pow(2, Math.ceil(Math.log2(n)));
};

// Belt Rank Values for Seeding
const BELT_RANKS: { [key: string]: number } = {
    'White': 1, 'Orange': 2, 'Blue': 3, 'Yellow': 4, 'Green': 5, 'Brown': 6,
    'Black': 7, 'Black 1st Dan': 7, 'Black 2nd Dan': 8, 'Black 3rd Dan': 9
};

const getBeltValue = (belt: string | null) => {
    if (!belt) return 0;
    for (const [key, val] of Object.entries(BELT_RANKS)) {
        if (belt.includes(key)) return val;
    }
    return 1;
};

export const TournamentService = {
    async generateBrackets(eventId: string) {
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) throw new AppError('Event not found', 404);

        // 1. Get all approved registrations
        const registrations = await prisma.eventRegistration.findMany({
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
            throw new AppError('No approved participants found', 400);
        }

        // 2. Group by Category
        const categories = new Map<string, typeof registrations>();

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
                if (beltA !== beltB) return beltB - beltA;
                return 0;
            });

            const totalParticipants = participants.length;
            const bracketSize = nextPowerOf2(totalParticipants);

            // Create Bracket Record
            const bracket = await prisma.tournamentBracket.create({
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

                const match = await prisma.match.create({
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

                    const nextMatch = await prisma.match.create({
                        data: {
                            bracketId: bracket.id,
                            roundNumber: round,
                            roundName: `Round ${round}`,
                            matchNumber: matchNumber++,
                            status: 'SCHEDULED'
                        }
                    });

                    await prisma.match.update({
                        where: { id: prevMatch1.id },
                        data: { nextMatchId: nextMatch.id }
                    });

                    if (prevMatch2) {
                        await prisma.match.update({
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

    async getBrackets(eventId: string) {
        return prisma.tournamentBracket.findMany({
            where: { eventId },
            include: {
                matches: {
                    orderBy: { matchNumber: 'asc' }
                }
            }
        });
    },

    async getTournamentStatistics(eventId: string) {
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                registrations: {
                    where: { approvalStatus: 'APPROVED' },
                    include: {
                        user: {
                            include: { dojo: true }
                        }
                    }
                }
            }
        });

        if (!event) throw new AppError('Event not found', 404);

        const brackets = await prisma.tournamentBracket.findMany({
            where: { eventId },
            include: {
                matches: {
                    where: { status: 'COMPLETED' },
                    include: {
                        fighterA: { include: { dojo: true } },
                        fighterB: { include: { dojo: true } },
                        winner: { include: { dojo: true } }
                    }
                }
            }
        });

        // Calculate Winners by Category
        const categoryWinners = brackets.map(bracket => {
            // Find the final match (highest round number)
            const finalMatch = bracket.matches.reduce((prev, current) =>
                (current.roundNumber > prev.roundNumber) ? current : prev
            , bracket.matches[0]);

            // Find semi-final matches (second highest round)
            const semiFinalists = bracket.matches
                .filter(m => m.roundNumber === finalMatch?.roundNumber - 1)
                .flatMap(m => [m.fighterA, m.fighterB])
                .filter(f => f && f.id !== finalMatch?.winnerId);

            const firstPlace = finalMatch?.winner || null;
            const secondPlace = finalMatch?.winnerId === finalMatch?.fighterAId
                ? finalMatch?.fighterB
                : finalMatch?.fighterA;
            const thirdPlace = semiFinalists.length > 0 ? semiFinalists[0] : null;

            return {
                categoryName: bracket.categoryName,
                bracketId: bracket.id,
                status: bracket.status,
                firstPlace: firstPlace ? {
                    id: firstPlace.id,
                    name: firstPlace.name,
                    dojoName: firstPlace.dojo?.name,
                    beltRank: firstPlace.currentBeltRank
                } : null,
                secondPlace: secondPlace ? {
                    id: secondPlace.id,
                    name: secondPlace.name,
                    dojoName: secondPlace.dojo?.name,
                    beltRank: secondPlace.currentBeltRank
                } : null,
                thirdPlace: thirdPlace ? {
                    id: thirdPlace.id,
                    name: thirdPlace.name,
                    dojoName: thirdPlace.dojo?.name,
                    beltRank: thirdPlace.currentBeltRank
                } : null
            };
        });

        // Calculate Dojo Medal Counts
        const dojoMedals = new Map<string, { gold: number; silver: number; bronze: number; total: number; dojoId: string }>();

        categoryWinners.forEach(category => {
            if (category.firstPlace?.dojoName) {
                const dojoName = category.firstPlace.dojoName;
                if (!dojoMedals.has(dojoName)) {
                    dojoMedals.set(dojoName, { gold: 0, silver: 0, bronze: 0, total: 0, dojoId: category.firstPlace.id });
                }
                const stats = dojoMedals.get(dojoName)!;
                stats.gold++;
                stats.total++;
            }
            if (category.secondPlace?.dojoName) {
                const dojoName = category.secondPlace.dojoName;
                if (!dojoMedals.has(dojoName)) {
                    dojoMedals.set(dojoName, { gold: 0, silver: 0, bronze: 0, total: 0, dojoId: category.secondPlace.id });
                }
                const stats = dojoMedals.get(dojoName)!;
                stats.silver++;
                stats.total++;
            }
            if (category.thirdPlace?.dojoName) {
                const dojoName = category.thirdPlace.dojoName;
                if (!dojoMedals.has(dojoName)) {
                    dojoMedals.set(dojoName, { gold: 0, silver: 0, bronze: 0, total: 0, dojoId: category.thirdPlace.id });
                }
                const stats = dojoMedals.get(dojoName)!;
                stats.bronze++;
                stats.total++;
            }
        });

        const dojoLeaderboard = Array.from(dojoMedals.entries())
            .map(([dojoName, stats]) => ({ dojoName, ...stats }))
            .sort((a, b) => {
                if (b.gold !== a.gold) return b.gold - a.gold;
                if (b.silver !== a.silver) return b.silver - a.silver;
                if (b.bronze !== a.bronze) return b.bronze - a.bronze;
                return b.total - a.total;
            });

        // Calculate Performance Stats
        const allMatches = brackets.flatMap(b => b.matches);
        const completedMatches = allMatches.filter(m => m.status === 'COMPLETED' && m.fighterAScore !== null && m.fighterBScore !== null);

        let fastestWin: any = null;
        let highestScore: any = null;
        let mostDominant: any = null;

        completedMatches.forEach(match => {
            const duration = match.startedAt && match.completedAt
                ? (new Date(match.completedAt).getTime() - new Date(match.startedAt).getTime()) / 1000 / 60
                : null;

            if (duration && (!fastestWin || duration < fastestWin.duration)) {
                fastestWin = {
                    duration,
                    winner: match.winner,
                    matchId: match.id
                };
            }

            const maxScore = Math.max(match.fighterAScore || 0, match.fighterBScore || 0);
            if (!highestScore || maxScore > highestScore.score) {
                highestScore = {
                    score: maxScore,
                    winner: match.winner,
                    matchId: match.id
                };
            }

            const scoreDiff = Math.abs((match.fighterAScore || 0) - (match.fighterBScore || 0));
            if (!mostDominant || scoreDiff > mostDominant.difference) {
                mostDominant = {
                    difference: scoreDiff,
                    winner: match.winner,
                    winnerScore: Math.max(match.fighterAScore || 0, match.fighterBScore || 0),
                    loserScore: Math.min(match.fighterAScore || 0, match.fighterBScore || 0),
                    matchId: match.id
                };
            }
        });

        return {
            tournament: {
                id: event.id,
                name: event.name,
                date: event.startDate,
                location: event.location || '',
                totalParticipants: event.registrations.length,
                totalCategories: brackets.length,
                completedMatches: completedMatches.length,
                totalMatches: allMatches.length
            },
            categoryWinners,
            dojoLeaderboard,
            performanceStats: {
                fastestWin: fastestWin ? {
                    duration: Math.round(fastestWin.duration * 10) / 10,
                    winner: fastestWin.winner ? {
                        id: fastestWin.winner.id,
                        name: fastestWin.winner.name,
                        dojoName: fastestWin.winner.dojo?.name
                    } : null
                } : null,
                highestScore: highestScore ? {
                    score: highestScore.score,
                    winner: highestScore.winner ? {
                        id: highestScore.winner.id,
                        name: highestScore.winner.name,
                        dojoName: highestScore.winner.dojo?.name
                    } : null
                } : null,
                mostDominant: mostDominant ? {
                    scoreDifference: mostDominant.difference,
                    finalScore: `${mostDominant.winnerScore}-${mostDominant.loserScore}`,
                    winner: mostDominant.winner ? {
                        id: mostDominant.winner.id,
                        name: mostDominant.winner.name,
                        dojoName: mostDominant.winner.dojo?.name
                    } : null
                } : null
            }
        };
    }
};
