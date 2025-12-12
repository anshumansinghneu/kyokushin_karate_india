import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestWinners() {
    console.log('🏆 Creating test tournament winners...\n');

    try {
        // Get the tournament
        const tournament = await prisma.event.findFirst({
            where: { type: 'TOURNAMENT' },
        });

        if (!tournament) {
            console.log('❌ No tournament found. Please run seed script first.');
            return;
        }

        console.log('📋 Tournament:', tournament.name);

        // Change tournament status to COMPLETED
        await prisma.event.update({
            where: { id: tournament.id },
            data: { status: 'COMPLETED' },
        });
        console.log('✅ Set tournament status to COMPLETED');

        // Get some students
        const students = await prisma.user.findMany({
            where: { role: 'STUDENT' },
            take: 24, // 3 categories × 8 participants each
        });

        if (students.length < 24) {
            console.log(`❌ Need at least 24 students, found ${students.length}. Run seed script first.`);
            return;
        }

        console.log(`✅ Found ${students.length} students\n`);

        // Create 3 brackets (categories)
        const categories = [
            { name: 'Men 18-25 Under 75kg', age: '18-25', weight: 'Under 75kg', belt: 'Open' },
            { name: 'Men 26-35 Under 85kg', age: '26-35', weight: 'Under 85kg', belt: 'Open' },
            { name: 'Men 36-45 Over 85kg', age: '36-45', weight: 'Over 85kg', belt: 'Open' },
        ];

        let studentIndex = 0;

        for (const category of categories) {
            console.log(`\n🥋 Creating bracket: ${category.name}`);

            // Create bracket
            const bracket = await prisma.tournamentBracket.create({
                data: {
                    eventId: tournament.id,
                    categoryName: category.name,
                    categoryAge: category.age,
                    categoryWeight: category.weight,
                    categoryBelt: category.belt,
                    totalParticipants: 8,
                    status: 'COMPLETED',
                },
            });

            console.log(`  ✅ Bracket created: ${bracket.id}`);

            // Create results for 8 participants (1st, 2nd, 3rd, and 5 others)
            const categoryStudents = students.slice(studentIndex, studentIndex + 8);
            studentIndex += 8;

            // 1st Place - Gold Medal
            await prisma.tournamentResult.create({
                data: {
                    userId: categoryStudents[0].id,
                    eventId: tournament.id,
                    bracketId: bracket.id,
                    categoryName: category.name,
                    finalRank: 1,
                    medal: 'GOLD',
                    totalMatches: 3,
                    matchesWon: 3,
                    matchesLost: 0,
                    eliminatedInRound: 'Final',
                },
            });
            console.log(`  🥇 1st Place: ${categoryStudents[0].name}`);

            // 2nd Place - Silver Medal
            await prisma.tournamentResult.create({
                data: {
                    userId: categoryStudents[1].id,
                    eventId: tournament.id,
                    bracketId: bracket.id,
                    categoryName: category.name,
                    finalRank: 2,
                    medal: 'SILVER',
                    totalMatches: 3,
                    matchesWon: 2,
                    matchesLost: 1,
                    eliminatedInRound: 'Final',
                    eliminatedByUserId: categoryStudents[0].id,
                },
            });
            console.log(`  🥈 2nd Place: ${categoryStudents[1].name}`);

            // 3rd Place - Bronze Medal
            await prisma.tournamentResult.create({
                data: {
                    userId: categoryStudents[2].id,
                    eventId: tournament.id,
                    bracketId: bracket.id,
                    categoryName: category.name,
                    finalRank: 3,
                    medal: 'BRONZE',
                    totalMatches: 3,
                    matchesWon: 2,
                    matchesLost: 1,
                    eliminatedInRound: 'Semi Finals',
                },
            });
            console.log(`  🥉 3rd Place: ${categoryStudents[2].name}`);

            // 4th Place (alternate bronze)
            await prisma.tournamentResult.create({
                data: {
                    userId: categoryStudents[3].id,
                    eventId: tournament.id,
                    bracketId: bracket.id,
                    categoryName: category.name,
                    finalRank: 4,
                    medal: null,
                    totalMatches: 3,
                    matchesWon: 1,
                    matchesLost: 2,
                    eliminatedInRound: 'Semi Finals',
                },
            });

            // Quarter finalists (5th-8th place)
            for (let i = 4; i < 8; i++) {
                await prisma.tournamentResult.create({
                    data: {
                        userId: categoryStudents[i].id,
                        eventId: tournament.id,
                        bracketId: bracket.id,
                        categoryName: category.name,
                        finalRank: i + 1,
                        medal: null,
                        totalMatches: 2,
                        matchesWon: 1,
                        matchesLost: 1,
                        eliminatedInRound: 'Quarter Finals',
                    },
                });
            }
        }

        console.log('\n✅ Test tournament winners created successfully!');
        console.log('\n📊 Summary:');
        console.log('  - 3 categories created');
        console.log('  - 24 total participants');
        console.log('  - 9 medal winners (3 gold, 3 silver, 3 bronze)');
        console.log('\n🎉 You can now test the Winners tab!');

    } catch (error) {
        console.error('❌ Error creating test winners:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestWinners();
