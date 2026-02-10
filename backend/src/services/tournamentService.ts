import prisma from '../prisma';
import { AppError } from '../utils/errorHandler';

// Helper to calculate next power of 2
const nextPowerOf2 = (n: number) => {
    if (n <= 1) return 1;
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

// Get proper round name based on how many matches remain
const getRoundName = (roundNumber: number, totalRounds: number): string => {
    const roundsFromEnd = totalRounds - roundNumber;
    if (roundsFromEnd === 0) return 'Final';
    if (roundsFromEnd === 1) return 'Semi-Finals';
    if (roundsFromEnd === 2) return 'Quarter-Finals';
    return `Round ${roundNumber}`;
};

export const TournamentService = {
    /**
     * Generates single-elimination brackets with proper bye distribution.
     *
     * Algorithm:
     * 1. Pad participant list to next power of 2 with BYEs
     * 2. Place BYEs so top seeds face them (spread evenly)
     * 3. Create all rounds, auto-advance bye winners
     */
    async generateBrackets(eventId: string) {
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) throw new AppError('Event not found', 404);

        // Delete existing brackets for this event (allow re-generation)
        const existingBrackets = await prisma.tournamentBracket.findMany({
            where: { eventId },
            select: { id: true }
        });
        if (existingBrackets.length > 0) {
            const bracketIds = existingBrackets.map(b => b.id);
            await prisma.match.deleteMany({ where: { bracketId: { in: bracketIds } } });
            await prisma.tournamentBracket.deleteMany({ where: { eventId } });
        }

        // 1. Get all approved registrations
        const registrations = await prisma.eventRegistration.findMany({
            where: { eventId, approvalStatus: 'APPROVED' },
            include: { user: { include: { dojo: true } } }
        });

        if (registrations.length === 0) {
            throw new AppError('No approved participants found', 400);
        }

        // 2. Group by Category
        const categories = new Map<string, typeof registrations>();
        registrations.forEach((reg) => {
            const key = `${reg.categoryAge || 'Open'}|${reg.categoryWeight || 'Open'}|${reg.categoryBelt || 'Open'}`;
            if (!categories.has(key)) categories.set(key, []);
            categories.get(key)?.push(reg);
        });

        const generatedBrackets = [];

        // 3. Process each category
        for (const [categoryKey, participants] of categories) {
            const [age, weight, belt] = categoryKey.split('|');
            const categoryName = `${age}, ${weight}, ${belt}`;

            // Sort/Seed Participants — highest belt rank first (best player = seed #1)
            participants.sort((a, b) => {
                const beltA = getBeltValue(a.user.currentBeltRank);
                const beltB = getBeltValue(b.user.currentBeltRank);
                return beltB - beltA;
            });

            const totalParticipants = participants.length;

            // Handle single participant — auto-win
            if (totalParticipants === 1) {
                const bracket = await prisma.tournamentBracket.create({
                    data: {
                        eventId, categoryName, categoryAge: age, categoryWeight: weight,
                        categoryBelt: belt, totalParticipants: 1, status: 'COMPLETED',
                        completedAt: new Date()
                    }
                });
                // Create a single "final" match with the lone participant as winner
                await prisma.match.create({
                    data: {
                        bracketId: bracket.id, roundNumber: 1, roundName: 'Final',
                        matchNumber: 1,
                        fighterAId: participants[0].userId,
                        fighterAName: participants[0].user.name,
                        isBye: true, status: 'COMPLETED',
                        winnerId: participants[0].userId,
                        completedAt: new Date()
                    }
                });
                generatedBrackets.push(bracket);
                continue;
            }

            const bracketSize = nextPowerOf2(totalParticipants);
            const numByes = bracketSize - totalParticipants;
            const totalRounds = Math.log2(bracketSize);

            // Create bracket record
            const bracket = await prisma.tournamentBracket.create({
                data: {
                    eventId, categoryName, categoryAge: age, categoryWeight: weight,
                    categoryBelt: belt, totalParticipants, status: 'DRAFT'
                }
            });

            // Build the seeded slot list with BYEs distributed to top seeds
            // Slot format: { userId, userName } or null (BYE)
            type Slot = { userId: string; userName: string } | null;
            const slots: Slot[] = new Array(bracketSize).fill(null);

            // Place participants — top seed at 0, second seed at end, etc. (standard bracket seeding)
            // For simplicity, place participants in order and byes at the end
            // This means top seeds get byes (since they're at the top and byes fill the bottom)
            for (let i = 0; i < totalParticipants; i++) {
                slots[i] = { userId: participants[i].userId, userName: participants[i].user.name };
            }
            // Remaining slots (indices totalParticipants..bracketSize-1) are null = BYE

            let matchNumber = 1;
            const allRoundMatches: { id: string; isBye: boolean; winnerId: string | null; winnerName: string | null }[][] = [];

            // === Round 1: Create all first-round matches ===
            const round1Matches: { id: string; isBye: boolean; winnerId: string | null; winnerName: string | null }[] = [];
            const r1Name = getRoundName(1, totalRounds);

            for (let i = 0; i < bracketSize; i += 2) {
                const slotA = slots[i];
                const slotB = slots[i + 1];
                const isBye = !slotA || !slotB;

                let winnerId: string | null = null;
                let winnerName: string | null = null;
                if (isBye) {
                    // The non-null fighter auto-advances
                    if (slotA) { winnerId = slotA.userId; winnerName = slotA.userName; }
                    else if (slotB) { winnerId = slotB.userId; winnerName = slotB.userName; }
                }

                const match = await prisma.match.create({
                    data: {
                        bracketId: bracket.id,
                        roundNumber: 1,
                        roundName: r1Name,
                        matchNumber: matchNumber++,
                        fighterAId: slotA?.userId || null,
                        fighterAName: slotA?.userName || null,
                        fighterBId: slotB?.userId || null,
                        fighterBName: slotB?.userName || null,
                        isBye,
                        status: isBye ? 'COMPLETED' : 'SCHEDULED',
                        winnerId,
                        completedAt: isBye ? new Date() : null
                    }
                });

                round1Matches.push({ id: match.id, isBye, winnerId, winnerName });
            }
            allRoundMatches.push(round1Matches);

            // === Subsequent rounds: Create matches and link them, advancing bye winners ===
            let prevRoundMatches = round1Matches;

            for (let round = 2; round <= totalRounds; round++) {
                const roundName = getRoundName(round, totalRounds);
                const currentRoundMatches: typeof round1Matches = [];

                for (let i = 0; i < prevRoundMatches.length; i += 2) {
                    const prev1 = prevRoundMatches[i];
                    const prev2 = prevRoundMatches[i + 1];

                    // Pre-fill fighters from bye winners of previous round
                    let fighterAId: string | null = null;
                    let fighterAName: string | null = null;
                    let fighterBId: string | null = null;
                    let fighterBName: string | null = null;

                    if (prev1.isBye && prev1.winnerId) {
                        fighterAId = prev1.winnerId;
                        fighterAName = prev1.winnerName;
                    }
                    if (prev2 && prev2.isBye && prev2.winnerId) {
                        fighterBId = prev2.winnerId;
                        fighterBName = prev2.winnerName;
                    }

                    // If both slots are filled by bye winners, this match is also a bye (auto-resolved)
                    // This shouldn't happen in proper bracket but handle gracefully
                    const bothFilled = fighterAId !== null && fighterBId !== null;

                    const match = await prisma.match.create({
                        data: {
                            bracketId: bracket.id,
                            roundNumber: round,
                            roundName,
                            matchNumber: matchNumber++,
                            fighterAId,
                            fighterAName,
                            fighterBId,
                            fighterBName,
                            status: 'SCHEDULED',
                        }
                    });

                    // Link previous round matches to this one
                    await prisma.match.update({
                        where: { id: prev1.id },
                        data: { nextMatchId: match.id }
                    });
                    if (prev2) {
                        await prisma.match.update({
                            where: { id: prev2.id },
                            data: { nextMatchId: match.id }
                        });
                    }

                    currentRoundMatches.push({
                        id: match.id,
                        isBye: false,
                        winnerId: null,
                        winnerName: null
                    });
                }

                prevRoundMatches = currentRoundMatches;
                allRoundMatches.push(currentRoundMatches);
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

    async updateBracketStatus(bracketId: string, status: 'DRAFT' | 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED') {
        const data: any = { status };
        if (status === 'LOCKED') data.lockedAt = new Date();
        if (status === 'COMPLETED') data.completedAt = new Date();
        return prisma.tournamentBracket.update({ where: { id: bracketId }, data });
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
