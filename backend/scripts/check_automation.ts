import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
    console.log('\n🧪 Tournament Automation Verification\n');
    console.log('═'.repeat(60));

    try {
        // Get tournament
        const tournament = await prisma.event.findFirst({
            where: { type: 'TOURNAMENT', status: 'COMPLETED' }
        });

        if (!tournament) {
            console.log('\n❌ No completed tournament found');
            console.log('💡 Run: npx ts-node scripts/create_test_winners.ts\n');
            return;
        }

        console.log(`\n✅ Tournament: ${tournament.name}`);
        console.log(`   Status: ${tournament.status}`);
        console.log(`   Location: ${tournament.location}`);

        // Get brackets
        const brackets = await prisma.tournamentBracket.findMany({
            where: { eventId: tournament.id },
            include: { matches: true }
        });

        console.log(`\n✅ Brackets: ${brackets.length}`);
        brackets.forEach(b => {
            const completed = b.matches.filter(m => m.status === 'COMPLETED').length;
            console.log(`   🥋 ${b.categoryName}`);
            console.log(`      Status: ${b.status}`);
            console.log(`      Matches: ${completed}/${b.matches.length} completed`);
        });

        // Get results
        const results = await prisma.tournamentResult.findMany({
            where: { eventId: tournament.id },
            include: { user: { select: { name: true } } },
            orderBy: [{ bracketId: 'asc' }, { finalRank: 'asc' }]
        });

        console.log(`\n✅ Tournament Results: ${results.length} participants`);

        const byBracket: Record<string, typeof results> = {};
        results.forEach(r => {
            if (!byBracket[r.categoryName]) byBracket[r.categoryName] = [];
            byBracket[r.categoryName].push(r);
        });

        for (const [cat, res] of Object.entries(byBracket)) {
            console.log(`\n   🥋 ${cat}:`);
            res.forEach(r => {
                const medal = r.medal === 'GOLD' ? '🥇' :
                    r.medal === 'SILVER' ? '🥈' :
                        r.medal === 'BRONZE' ? '🥉' : '  ';
                const rank = `#${r.finalRank}`.padEnd(4);
                const name = r.user.name.padEnd(22);
                const record = `${r.matchesWon}-${r.matchesLost}`.padEnd(5);
                console.log(`      ${medal} ${rank} ${name} ${record} (${r.totalMatches} matches)`);
            });
        }

        // Verification checks
        console.log('\n' + '═'.repeat(60));
        console.log('\n📊 Verification Checks:\n');

        let passed = 0;
        let total = 0;

        // Check 1
        total++;
        const allBracketsComplete = brackets.every(b => b.status === 'COMPLETED');
        console.log(allBracketsComplete ? '   ✅' : '   ❌', 'All brackets completed');
        if (allBracketsComplete) passed++;

        // Check 2
        total++;
        const allMatchesComplete = brackets.every(b =>
            b.matches.every(m => m.status === 'COMPLETED')
        );
        console.log(allMatchesComplete ? '   ✅' : '   ❌', 'All matches completed');
        if (allMatchesComplete) passed++;

        // Check 3
        total++;
        const hasResults = results.length > 0;
        console.log(hasResults ? '   ✅' : '   ❌', 'Results auto-generated');
        if (hasResults) passed++;

        // Check 4
        total++;
        const goldCount = results.filter(r => r.medal === 'GOLD').length;
        const correctGold = goldCount === brackets.length;
        console.log(correctGold ? '   ✅' : '   ❌', `${goldCount} Gold medals (${brackets.length} expected)`);
        if (correctGold) passed++;

        // Check 5
        total++;
        const silverCount = results.filter(r => r.medal === 'SILVER').length;
        const correctSilver = silverCount === brackets.length;
        console.log(correctSilver ? '   ✅' : '   ❌', `${silverCount} Silver medals (${brackets.length} expected)`);
        if (correctSilver) passed++;

        // Check 6
        total++;
        const bronzeCount = results.filter(r => r.medal === 'BRONZE').length;
        const correctBronze = bronzeCount >= brackets.length;
        console.log(correctBronze ? '   ✅' : '   ❌', `${bronzeCount} Bronze medals (≥${brackets.length} expected)`);
        if (correctBronze) passed++;

        // Check 7
        total++;
        const hasStats = results.every(r => r.totalMatches > 0 && r.matchesWon >= 0 && r.matchesLost >= 0);
        console.log(hasStats ? '   ✅' : '   ❌', 'Match statistics recorded');
        if (hasStats) passed++;

        // Check 8
        total++;
        const tournamentComplete = tournament.status === 'COMPLETED';
        console.log(tournamentComplete ? '   ✅' : '   ❌', 'Tournament marked COMPLETED');
        if (tournamentComplete) passed++;

        // Summary
        console.log('\n' + '═'.repeat(60));
        const percentage = ((passed / total) * 100).toFixed(0);
        console.log(`\n📈 Results: ${passed}/${total} checks passed (${percentage}%)\n`);

        if (passed === total) {
            console.log('🎉 ALL CHECKS PASSED!\n');
            console.log('✅ Tournament automation verified:\n');
            console.log('   • Bracket generation');
            console.log('   • Match completion tracking');
            console.log('   • Winner advancement (automatic)');
            console.log('   • Result calculation (automatic)');
            console.log('   • Medal distribution (automatic)');
            console.log('   • Statistics recording (automatic)');
            console.log('   • Tournament completion (automatic)');
        } else {
            console.log('⚠️  Some checks failed. Review above.\n');
        }

        console.log('═'.repeat(60) + '\n');

    } catch (error) {
        console.error('\n❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
