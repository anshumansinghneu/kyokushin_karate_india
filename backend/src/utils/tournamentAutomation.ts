import prisma from '../prisma';

/**
 * Automatically calculate and save tournament results when all matches in a bracket are complete
 */
export async function autoCalculateBracketResults(bracketId: string): Promise<void> {
    const bracket = await prisma.tournamentBracket.findUnique({
        where: { id: bracketId },
        include: {
            matches: {
                orderBy: { roundNumber: 'asc' }
            }
        }
    });

    if (!bracket) return;

    // Check if all matches are completed
    const allMatchesComplete = bracket.matches.every(m => m.status === 'COMPLETED');
    if (!allMatchesComplete) return;

    // Check if results already exist for this bracket
    const existingResults = await prisma.tournamentResult.findFirst({
        where: { bracketId }
    });

    if (existingResults) {
        console.log(`Results already exist for bracket ${bracketId}`);
        return;
    }

    console.log(`🏆 Auto-calculating results for bracket: ${bracket.categoryName}`);

    // Find the final match (highest round number)
    const maxRound = Math.max(...bracket.matches.map(m => m.roundNumber));
    const finalMatch = bracket.matches.find(m => m.roundNumber === maxRound);

    if (!finalMatch || !finalMatch.winnerId) {
        console.log(`❌ No final match winner found for bracket ${bracketId}`);
        return;
    }

    // Calculate match statistics for each participant
    const participantStats = new Map<string, {
        totalMatches: number;
        matchesWon: number;
        matchesLost: number;
        eliminatedInRound: string | null;
        eliminatedByUserId: string | null;
    }>();

    // Initialize all participants
    const allParticipants = new Set<string>();
    bracket.matches.forEach(match => {
        if (match.fighterAId) allParticipants.add(match.fighterAId);
        if (match.fighterBId) allParticipants.add(match.fighterBId);
    });

    allParticipants.forEach(userId => {
        participantStats.set(userId, {
            totalMatches: 0,
            matchesWon: 0,
            matchesLost: 0,
            eliminatedInRound: null,
            eliminatedByUserId: null
        });
    });

    // Calculate stats from matches
    bracket.matches.forEach(match => {
        if (match.status !== 'COMPLETED') return;

        const fighterAId = match.fighterAId;
        const fighterBId = match.fighterBId;
        const winnerId = match.winnerId;

        if (fighterAId) {
            const stats = participantStats.get(fighterAId)!;
            stats.totalMatches++;
            if (winnerId === fighterAId) {
                stats.matchesWon++;
            } else {
                stats.matchesLost++;
                stats.eliminatedInRound = match.roundName;
                stats.eliminatedByUserId = winnerId;
            }
        }

        if (fighterBId) {
            const stats = participantStats.get(fighterBId)!;
            stats.totalMatches++;
            if (winnerId === fighterBId) {
                stats.matchesWon++;
            } else {
                stats.matchesLost++;
                stats.eliminatedInRound = match.roundName;
                stats.eliminatedByUserId = winnerId;
            }
        }
    });

    // 1st Place (Gold) - Winner of final
    const goldWinnerId = finalMatch.winnerId;
    const goldStats = participantStats.get(goldWinnerId)!;

    await prisma.tournamentResult.create({
        data: {
            eventId: bracket.eventId,
            bracketId: bracket.id,
            userId: goldWinnerId,
            categoryName: bracket.categoryName,
            finalRank: 1,
            medal: 'GOLD',
            totalMatches: goldStats.totalMatches,
            matchesWon: goldStats.matchesWon,
            matchesLost: goldStats.matchesLost,
            eliminatedInRound: 'Champion',
            eliminatedByUserId: null,
        }
    });
    console.log(`🥇 1st Place recorded`);

    // 2nd Place (Silver) - Loser of final
    const silverWinnerId = finalMatch.winnerId === finalMatch.fighterAId ? finalMatch.fighterBId : finalMatch.fighterAId;
    if (silverWinnerId) {
        const silverStats = participantStats.get(silverWinnerId)!;
        await prisma.tournamentResult.create({
            data: {
                eventId: bracket.eventId,
                bracketId: bracket.id,
                userId: silverWinnerId,
                categoryName: bracket.categoryName,
                finalRank: 2,
                medal: 'SILVER',
                totalMatches: silverStats.totalMatches,
                matchesWon: silverStats.matchesWon,
                matchesLost: silverStats.matchesLost,
                eliminatedInRound: 'Final',
                eliminatedByUserId: goldWinnerId,
            }
        });
        console.log(`🥈 2nd Place recorded`);
    }

    // 3rd Place (Bronze) - Losers of semi-finals
    if (maxRound >= 2) {
        const semiFinals = bracket.matches.filter(m => m.roundNumber === maxRound - 1);
        let bronzePosition = 3;

        for (const match of semiFinals) {
            const loserId = match.winnerId === match.fighterAId ? match.fighterBId : match.fighterAId;
            if (loserId) {
                const loserStats = participantStats.get(loserId)!;
                await prisma.tournamentResult.create({
                    data: {
                        eventId: bracket.eventId,
                        bracketId: bracket.id,
                        userId: loserId,
                        categoryName: bracket.categoryName,
                        finalRank: bronzePosition,
                        medal: 'BRONZE',
                        totalMatches: loserStats.totalMatches,
                        matchesWon: loserStats.matchesWon,
                        matchesLost: loserStats.matchesLost,
                        eliminatedInRound: 'Semi Finals',
                        eliminatedByUserId: match.winnerId,
                    }
                });
                console.log(`🥉 3rd Place recorded`);
                bronzePosition++; // If there are two bronze medals, increment
            }
        }
    }

    // Record remaining participants (4th place and below)
    const medalists = new Set([goldWinnerId, silverWinnerId]);
    if (maxRound >= 2) {
        const semiFinals = bracket.matches.filter(m => m.roundNumber === maxRound - 1);
        semiFinals.forEach(match => {
            const loserId = match.winnerId === match.fighterAId ? match.fighterBId : match.fighterAId;
            if (loserId) medalists.add(loserId);
        });
    }

    let currentRank = medalists.size + 1;
    const remainingParticipants = Array.from(allParticipants).filter(id => !medalists.has(id));

    // Sort by round eliminated (higher round = better placement) and then by wins
    const sortedRemaining = remainingParticipants.map(userId => ({
        userId,
        stats: participantStats.get(userId)!,
        eliminatedRound: bracket.matches
            .filter(m => m.status === 'COMPLETED' && (m.fighterAId === userId || m.fighterBId === userId) && m.winnerId !== userId)
            .reduce((max, m) => Math.max(max, m.roundNumber), 0)
    })).sort((a, b) => {
        if (b.eliminatedRound !== a.eliminatedRound) return b.eliminatedRound - a.eliminatedRound;
        return b.stats.matchesWon - a.stats.matchesWon;
    });

    for (const participant of sortedRemaining) {
        await prisma.tournamentResult.create({
            data: {
                eventId: bracket.eventId,
                bracketId: bracket.id,
                userId: participant.userId,
                categoryName: bracket.categoryName,
                finalRank: currentRank,
                medal: null,
                totalMatches: participant.stats.totalMatches,
                matchesWon: participant.stats.matchesWon,
                matchesLost: participant.stats.matchesLost,
                eliminatedInRound: participant.stats.eliminatedInRound,
                eliminatedByUserId: participant.stats.eliminatedByUserId,
            }
        });
        currentRank++;
    }

    // Update bracket status to COMPLETED
    await prisma.tournamentBracket.update({
        where: { id: bracketId },
        data: {
            status: 'COMPLETED',
            completedAt: new Date()
        }
    });

    console.log(`✅ Bracket ${bracket.categoryName} completed with ${currentRank - 1} participants`);
}

/**
 * Check if tournament is complete and update tournament status
 */
export async function checkTournamentCompletion(eventId: string): Promise<void> {
    const brackets = await prisma.tournamentBracket.findMany({
        where: { eventId }
    });

    const allBracketsComplete = brackets.every(b => b.status === 'COMPLETED');

    if (allBracketsComplete && brackets.length > 0) {
        await prisma.event.update({
            where: { id: eventId },
            data: { status: 'COMPLETED' }
        });
        console.log(`🎉 Tournament ${eventId} marked as COMPLETED`);
    }
}
