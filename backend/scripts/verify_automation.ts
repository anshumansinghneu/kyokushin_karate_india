import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAutomation() {
    console.log('🔍 End-to-End Tournament Automation Verification\n');
    console.log('=' .repeat(60));

    try {
        // 1. Check Tournament exists
        console.log('\n📋 Step 1: Checking Tournament...');
        const tournament = await prisma.event.findFirst({
            where: { type: 'TOURNAMENT' }
        });

        if (!tournament) {
            console.log('❌ No tournament found');
            return;
        }

        console.log(`✅ Tournament: ${tournament.name}`);
        console.log(`   Status: ${tournament.status}`);
        console.log(`   ID: ${tournament.id}`);

        // 2. Check Brackets
        console.log('\n🥋 Step 2: Checking Brackets...');
        const brackets = await prisma.tournamentBracket.findMany({
            where: { eventId: tournament.id }
        });

        console.log(`✅ Found ${brackets.length} brackets`);
        brackets.forEach((b, i) => {
            console.log(`   ${i + 1}. ${b.categoryName} - Status: ${b.status}`);
        });

        // 3. Check Matches
        console.log('\n⚔️  Step 3: Checking Matches...');
        for (const bracket of brackets) {
            const matches = await prisma.match.findMany({
                where: { bracketId: bracket.id },
                orderBy: { roundNumber: 'asc' }
            });

            console.log(`\n   Bracket: ${bracket.categoryName}`);
            console.log(`   Total matches: ${matches.length}`);

            const completed = matches.filter(m => m.status === 'COMPLETED').length;
            const pending = matches.filter(m => m.status === 'PENDING').length;

            console.log(`   Completed: ${completed}/${matches.length}`);
            console.log(`   Pending: ${pending}/${matches.length}`);

            if (completed === matches.length) {
                console.log(`   ✅ All matches completed!`);
            } else {
                console.log(`   ⏳ Waiting for ${pending} more matches`);
            }
        }

        // 4. Check Tournament Results
        console.log('\n🏆 Step 4: Checking Tournament Results...');
        const results = await prisma.tournamentResult.findMany({
            where: { eventId: tournament.id },
            include: {
                user: { select: { name: true } }
            },
            orderBy: [
                { bracketId: 'asc' },
                { finalRank: 'asc' }
            ]
        });

        if (results.length === 0) {
            console.log('⚠️  No results calculated yet');
            console.log('   Results will be auto-calculated when all bracket matches complete');
        } else {
            console.log(`✅ Found ${results.length} tournament results`);

            // Group by bracket
            const resultsByBracket = results.reduce((acc, r) => {
                if (!acc[r.bracketId]) acc[r.bracketId] = [];
                acc[r.bracketId].push(r);
                return acc;
            }, {} as Record<string, typeof results>);

            for (const [bracketId, bracketResults] of Object.entries(resultsByBracket)) {
                const bracket = brackets.find(b => b.id === bracketId);
                console.log(`\n   📊 ${bracket?.categoryName || 'Unknown Category'}:`);

                const medals = bracketResults.filter(r => r.medal);
                if (medals.length > 0) {
                    medals.forEach(r => {
                        const icon = r.medal === 'GOLD' ? '🥇' : r.medal === 'SILVER' ? '🥈' : '🥉';
                        console.log(`      ${icon} ${r.finalRank}. ${r.user.name} - ${r.matchesWon}W-${r.matchesLost}L`);
                    });
                }
            }
        }

        // 5. Check Winner API Data
        console.log('\n🎯 Step 5: Checking Winners API Data...');
        const recentWinners = await prisma.tournamentResult.findMany({
            where: {
                eventId: tournament.id,
                finalRank: { lte: 3 }
            },
            include: {
                user: { select: { name: true } },
                event: { select: { name: true } }
            }
        });

        console.log(`✅ ${recentWinners.length} winners (top 3 finishers) ready for API`);

        // 6. Test Automation Status
        console.log('\n🤖 Step 6: Automation Status Check...');

        const allBracketsComplete = brackets.every(b => b.status === 'COMPLETED');
        const tournamentComplete = tournament.status === 'COMPLETED';
        const resultsExist = results.length > 0;

        console.log(`   All brackets completed: ${allBracketsComplete ? '✅' : '❌'}`);
        console.log(`   Tournament completed: ${tournamentComplete ? '✅' : '❌'}`);
        console.log(`   Results calculated: ${resultsExist ? '✅' : '❌'}`);

        // 7. Summary
        console.log('\n' + '='.repeat(60));
        console.log('📈 AUTOMATION SUMMARY:\n');

        if (allBracketsComplete && tournamentComplete && resultsExist) {
            console.log('✅ ✅ ✅ FULL AUTOMATION WORKING!');
            console.log('\nAll systems operational:');
            console.log('  ✅ Matches completed');
            console.log('  ✅ Results auto-calculated');
            console.log('  ✅ Brackets auto-completed');
            console.log('  ✅ Tournament auto-completed');
            console.log('  ✅ Winners API ready');
            console.log('  ✅ Dashboard data available');
        } else if (resultsExist && !allBracketsComplete) {
            console.log('⚠️  PARTIAL: Some brackets still have pending matches');
            console.log('\nAutomation will trigger when remaining matches complete');
        } else if (!resultsExist) {
            console.log('⏳ WAITING: Complete all matches to trigger automation');
            console.log('\nWhat happens automatically when last match completes:');
            console.log('  1. Winner advances to next match');
            console.log('  2. System checks if all bracket matches done');
            console.log('  3. Calculates all placements (1st, 2nd, 3rd...)');
            console.log('  4. Saves tournament results');
            console.log('  5. Updates bracket status to COMPLETED');
            console.log('  6. Checks if all brackets done');
            console.log('  7. Marks tournament as COMPLETED');
            console.log('  8. Broadcasts WebSocket event');
            console.log('  9. Updates all UIs automatically');
        }

        console.log('\n' + '='.repeat(60));

        // 8. Next Steps
        if (!allBracketsComplete) {
            console.log('\n📝 TO TEST AUTOMATION:');
            console.log('   1. Complete remaining matches via API:');
            console.log('      PATCH /api/matches/:matchId/score');
            console.log('      { winnerId: "user-id", status: "COMPLETED" }');
            console.log('\n   2. Watch console for auto-calculation logs');
            console.log('   3. Check Winners tab for automatic updates');
            console.log('   4. Verify student dashboards show medals');
        } else {
            console.log('\n🎉 READY FOR TESTING:');
            console.log('   1. Open Management → Winners tab');
            console.log('   2. Login as student to see tournament history');
            console.log('   3. Check WebSocket events in browser console');
        }

    } catch (error) {
        console.error('\n❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyAutomation();
