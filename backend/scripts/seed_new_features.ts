import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed script to add dummy data for testing new features:
 * 1. Notifications (bell icon center)
 * 2. Belt History (belt progression timeline)
 * 3. Tournament Results (certificate generation)
 * 4. Categories (participant category management)
 *
 * NON-DESTRUCTIVE — only adds data, does not delete existing records.
 * Run with: npx tsx scripts/seed_new_features.ts
 */
async function main() {
    console.log('🌱 Seeding data for new features...\n');

    // ── Find existing users ──
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const instructors = await prisma.user.findMany({ where: { role: 'INSTRUCTOR' }, take: 4 });
    const students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        include: { dojo: true },
        take: 32,
    });

    if (!admin) {
        console.log('❌ No admin found. Run seed_test_accounts.ts first.');
        process.exit(1);
    }
    if (students.length < 8) {
        console.log('❌ Need at least 8 students. Run seed_test_accounts.ts first.');
        process.exit(1);
    }

    const instructor = instructors[0] || admin;

    // ════════════════════════════════════════════
    // 1. NOTIFICATIONS — seed various types
    // ════════════════════════════════════════════
    console.log('🔔 Creating notifications...');

    // Clear existing notifications to avoid duplicates
    await prisma.notification.deleteMany();

    // Find an upcoming event for event reminders
    const events = await prisma.event.findMany({ take: 3 });
    const upcomingEvent = events.find(e => e.status === 'UPCOMING') || events[0];

    const notificationData: any[] = [];

    // Notifications for first 8 students
    for (let i = 0; i < Math.min(8, students.length); i++) {
        const s = students[i];

        notificationData.push(
            // Belt promotion notification
            {
                userId: s.id,
                type: 'BELT_PROMOTION',
                title: 'Belt Promotion!',
                message: `Congratulations! You have been promoted to ${s.currentBeltRank || 'Yellow'} Belt by ${instructor.name}.`,
                isRead: false,
                relatedEventId: null,
                createdAt: new Date(Date.now() - i * 3600 * 1000), // staggered
            },
            // Event reminder
            {
                userId: s.id,
                type: 'EVENT_REMINDER',
                title: 'Upcoming Tournament',
                message: upcomingEvent
                    ? `Reminder: ${upcomingEvent.name} starts on ${new Date(upcomingEvent.startDate).toLocaleDateString()}. Don't forget to prepare!`
                    : 'You have an upcoming event. Check the events page for details.',
                isRead: i % 3 === 0, // every 3rd read
                relatedEventId: upcomingEvent?.id || null,
                createdAt: new Date(Date.now() - (i + 10) * 3600 * 1000),
            },
            // Approval notification
            {
                userId: s.id,
                type: 'APPROVAL',
                title: 'Registration Approved',
                message: 'Your tournament registration has been approved. You are confirmed for the upcoming championship.',
                isRead: i % 2 === 0,
                relatedEventId: upcomingEvent?.id || null,
                createdAt: new Date(Date.now() - (i + 20) * 3600 * 1000),
            },
            // General notification
            {
                userId: s.id,
                type: 'GENERAL',
                title: 'Welcome to KKFI',
                message: 'Thank you for being part of Kyokushin Karate Federation of India. Train hard, fight easy! OSU!',
                isRead: true,
                createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000), // 1 week ago
            },
        );

        // Extra unread for first 3 students (test unread count)
        if (i < 3) {
            notificationData.push({
                userId: s.id,
                type: 'REJECTION',
                title: 'Belt Verification Pending',
                message: 'Your belt verification request requires additional documentation. Please upload your exam certificate.',
                isRead: false,
                createdAt: new Date(Date.now() - 1800 * 1000), // 30 min ago
            });
        }
    }

    // Also create notifications for admin
    notificationData.push(
        {
            userId: admin.id,
            type: 'GENERAL',
            title: 'System Update',
            message: 'New features available: Notification Center, Belt Timeline, Tournament Certificates, and Category Management.',
            isRead: false,
            createdAt: new Date(),
        },
        {
            userId: admin.id,
            type: 'APPROVAL',
            title: '5 Pending Registrations',
            message: 'There are 5 student registrations awaiting your approval for the upcoming tournament.',
            isRead: false,
            createdAt: new Date(Date.now() - 2 * 3600 * 1000),
        },
    );

    await prisma.notification.createMany({ data: notificationData });
    console.log(`   ✅ Created ${notificationData.length} notifications\n`);

    // ════════════════════════════════════════════
    // 2. BELT HISTORY — seed progression for students
    // ════════════════════════════════════════════
    console.log('🥋 Creating belt history (progression timeline)...');

    // Clear existing belt history
    await prisma.beltHistory.deleteMany();

    const beltProgression = ['White', 'Orange', 'Blue', 'Yellow', 'Green', 'Brown', 'Black'];

    let beltCount = 0;
    for (let i = 0; i < Math.min(12, students.length); i++) {
        const s = students[i];
        const currentBelt = s.currentBeltRank || 'White';
        const currentIdx = beltProgression.findIndex(b => currentBelt.includes(b));
        const stepsToReach = currentIdx >= 0 ? currentIdx : 0;

        // Create history entries for each belt promotion leading to current rank
        for (let step = 0; step <= stepsToReach; step++) {
            const monthsAgo = (stepsToReach - step) * 8 + Math.floor(Math.random() * 4); // ~8 months per belt
            const promoDate = new Date();
            promoDate.setMonth(promoDate.getMonth() - monthsAgo);

            const promoterUser = instructors[i % instructors.length] || admin;

            await prisma.beltHistory.create({
                data: {
                    studentId: s.id,
                    oldBelt: step === 0 ? null : beltProgression[step - 1],
                    newBelt: beltProgression[step],
                    promotedBy: promoterUser.id,
                    promotionDate: promoDate,
                    notes: step === 0
                        ? 'Started karate journey'
                        : [`Great improvement in kata`, `Excellent kumite performance`, `Passed belt exam with distinction`, `Showed strong spirit and technique`, `Demonstrated exceptional kihon`][step % 5],
                },
            });
            beltCount++;
        }
    }
    console.log(`   ✅ Created ${beltCount} belt history records\n`);

    // ════════════════════════════════════════════
    // 3. TOURNAMENT RESULTS — seed for certificate generation
    // ════════════════════════════════════════════
    console.log('🏆 Creating tournament results (for certificates)...');

    // Find or create a completed tournament
    let completedTournament = await prisma.event.findFirst({
        where: { type: 'TOURNAMENT', status: 'COMPLETED' },
    });

    if (!completedTournament) {
        completedTournament = await prisma.event.create({
            data: {
                type: 'TOURNAMENT',
                name: 'KKFI Inter-Dojo Championship 2025',
                description: 'Inter-dojo championship with Kumite and Kata divisions',
                startDate: new Date('2025-10-20'),
                endDate: new Date('2025-10-21'),
                location: 'Mumbai, Maharashtra',
                registrationDeadline: new Date('2025-10-01'),
                memberFee: 800,
                nonMemberFee: 1200,
                createdBy: admin.id,
                status: 'COMPLETED',
                categories: [
                    { age: '18-25', weight: 'Under 65kg', belt: 'Open' },
                    { age: '18-25', weight: 'Under 75kg', belt: 'Open' },
                    { age: '26-35', weight: 'Under 75kg', belt: 'Open' },
                    { age: '26-35', weight: 'Under 85kg', belt: 'Open' },
                ],
            },
        });
    }

    // Clear existing results & brackets for this tournament
    await prisma.tournamentResult.deleteMany({ where: { eventId: completedTournament.id } });
    await prisma.match.deleteMany({ where: { bracket: { eventId: completedTournament.id } } });
    await prisma.tournamentBracket.deleteMany({ where: { eventId: completedTournament.id } });

    // Create brackets and results for 3 categories
    const categories = [
        { name: '18-25, Under 65kg, Open', age: '18-25', weight: 'Under 65kg', belt: 'Open' },
        { name: '26-35, Under 75kg, Open', age: '26-35', weight: 'Under 75kg', belt: 'Open' },
        { name: '18-25, Under 75kg, Open', age: '18-25', weight: 'Under 75kg', belt: 'Open' },
    ];

    let resultCount = 0;
    for (let ci = 0; ci < categories.length; ci++) {
        const cat = categories[ci];
        const catStudents = students.slice(ci * 4, ci * 4 + 4); // 4 fighters per category
        if (catStudents.length < 4) continue;

        // Create bracket
        const bracket = await prisma.tournamentBracket.create({
            data: {
                eventId: completedTournament.id,
                categoryName: cat.name,
                categoryAge: cat.age,
                categoryWeight: cat.weight,
                categoryBelt: cat.belt,
                totalParticipants: 4,
                bracketType: 'SINGLE_ELIMINATION',
                status: 'COMPLETED',
                completedAt: completedTournament.endDate,
            },
        });

        // Create semi-final matches
        const semi1 = await prisma.match.create({
            data: {
                bracketId: bracket.id,
                roundNumber: 1, roundName: 'Semi-Finals', matchNumber: 1,
                fighterAId: catStudents[0].id, fighterBId: catStudents[1].id,
                fighterAName: catStudents[0].name, fighterBName: catStudents[1].name,
                fighterAScore: 3, fighterBScore: 1,
                winnerId: catStudents[0].id,
                status: 'COMPLETED',
                completedAt: completedTournament.startDate,
            },
        });

        const semi2 = await prisma.match.create({
            data: {
                bracketId: bracket.id,
                roundNumber: 1, roundName: 'Semi-Finals', matchNumber: 2,
                fighterAId: catStudents[2].id, fighterBId: catStudents[3].id,
                fighterAName: catStudents[2].name, fighterBName: catStudents[3].name,
                fighterAScore: 2, fighterBScore: 4,
                winnerId: catStudents[3].id,
                status: 'COMPLETED',
                completedAt: completedTournament.startDate,
            },
        });

        // Create final match
        await prisma.match.create({
            data: {
                bracketId: bracket.id,
                roundNumber: 2, roundName: 'Final', matchNumber: 3,
                fighterAId: catStudents[0].id, fighterBId: catStudents[3].id,
                fighterAName: catStudents[0].name, fighterBName: catStudents[3].name,
                fighterAScore: 5, fighterBScore: 3,
                winnerId: catStudents[0].id,
                status: 'COMPLETED',
                completedAt: completedTournament.endDate,
            },
        });

        // Create results: Gold, Silver, Bronze(x2)
        const results = [
            { userId: catStudents[0].id, finalRank: 1, medal: 'GOLD', won: 2, lost: 0 },
            { userId: catStudents[3].id, finalRank: 2, medal: 'SILVER', won: 1, lost: 1 },
            { userId: catStudents[1].id, finalRank: 3, medal: 'BRONZE', won: 0, lost: 1 },
            { userId: catStudents[2].id, finalRank: 3, medal: 'BRONZE', won: 0, lost: 1 },
        ];

        for (const r of results) {
            await prisma.tournamentResult.create({
                data: {
                    eventId: completedTournament.id,
                    userId: r.userId,
                    bracketId: bracket.id,
                    categoryName: cat.name,
                    finalRank: r.finalRank,
                    medal: r.medal,
                    totalMatches: 2,
                    matchesWon: r.won,
                    matchesLost: r.lost,
                    eliminatedInRound: r.finalRank > 2 ? 'Semi-Finals' : r.finalRank === 2 ? 'Final' : null,
                },
            });
            resultCount++;
        }

        // Also register these students to the tournament if not already registered
        for (const s of catStudents) {
            const existing = await prisma.eventRegistration.findUnique({
                where: { eventId_userId: { eventId: completedTournament.id, userId: s.id } },
            });
            if (!existing) {
                await prisma.eventRegistration.create({
                    data: {
                        eventId: completedTournament.id,
                        userId: s.id,
                        categoryAge: cat.age,
                        categoryWeight: cat.weight,
                        categoryBelt: cat.belt,
                        eventType: 'KUMITE',
                        paymentStatus: 'PAID',
                        approvalStatus: 'APPROVED',
                        approvedBy: admin.id,
                        approvedAt: new Date(),
                    },
                });
            }
        }
    }
    console.log(`   ✅ Created ${resultCount} tournament results across ${categories.length} categories\n`);

    // ════════════════════════════════════════════
    // 4. EXTRA CATEGORY REGISTRATIONS — for category management testing
    // ════════════════════════════════════════════
    console.log('📋 Ensuring diverse categories for category management...');

    // Find upcoming tournament
    let upcomingTournament = await prisma.event.findFirst({
        where: { type: 'TOURNAMENT', status: 'UPCOMING' },
    });

    if (upcomingTournament) {
        // Check how many registrations exist
        const existingCount = await prisma.eventRegistration.count({
            where: { eventId: upcomingTournament.id },
        });

        if (existingCount < 16) {
            // Add registrations with varied categories
            const categoryAssignments = [
                { age: '18-25', weight: 'Under 65kg', belt: 'Open' },
                { age: '18-25', weight: 'Under 75kg', belt: 'Open' },
                { age: '26-35', weight: 'Under 65kg', belt: 'Open' },
                { age: '26-35', weight: 'Under 75kg', belt: 'Open' },
                { age: '26-35', weight: 'Under 85kg', belt: 'Open' },
                { age: '36-45', weight: 'Under 85kg', belt: 'Open' },
                { age: '18-25', weight: 'Under 65kg', belt: 'Brown-Black' },
                { age: '26-35', weight: 'Under 75kg', belt: 'Brown-Black' },
            ];

            let newRegs = 0;
            for (let i = 0; i < Math.min(students.length, 24); i++) {
                const s = students[i];
                const cat = categoryAssignments[i % categoryAssignments.length];

                const exists = await prisma.eventRegistration.findUnique({
                    where: { eventId_userId: { eventId: upcomingTournament.id, userId: s.id } },
                });

                if (!exists) {
                    await prisma.eventRegistration.create({
                        data: {
                            eventId: upcomingTournament.id,
                            userId: s.id,
                            categoryAge: cat.age,
                            categoryWeight: cat.weight,
                            categoryBelt: cat.belt,
                            eventType: 'KUMITE',
                            paymentStatus: 'PAID',
                            approvalStatus: 'APPROVED',
                            approvedBy: admin.id,
                            approvedAt: new Date(),
                        },
                    });
                    newRegs++;
                }
            }
            console.log(`   ✅ Added ${newRegs} category registrations to upcoming tournament\n`);
        } else {
            console.log(`   ✅ ${existingCount} registrations already exist\n`);
        }
    } else {
        console.log('   ⚠️ No upcoming tournament found. Categories tab will be empty.\n');
    }

    // ════════════════════════════════════════════
    // SUMMARY
    // ════════════════════════════════════════════
    console.log('═'.repeat(60));
    console.log('✅ NEW FEATURES SEED DATA COMPLETE!');
    console.log('═'.repeat(60));
    console.log('\n🧪 HOW TO TEST EACH FEATURE:\n');

    console.log('🔔 NOTIFICATION CENTER:');
    console.log('   • Login as any student (student1@kyokushin.in / password123)');
    console.log('   • See bell icon with unread count in navbar');
    console.log('   • Click bell to see notification panel');
    console.log('   • Also login as admin (admin@kyokushin.in) for admin notifications\n');

    console.log('🥋 BELT PROGRESSION TIMELINE:');
    console.log('   • Login as any student');
    console.log('   • Dashboard → Overview tab → scroll down to "Belt Journey"');
    console.log('   • Shows color-coded timeline with promotions, dates, days between\n');

    console.log('🏆 TOURNAMENT CERTIFICATES:');
    console.log('   • Login as admin@kyokushin.in');
    console.log('   • Go to Management → Tournaments');
    if (completedTournament) {
        console.log(`   • Open "${completedTournament.name}"`);
    }
    console.log('   • Click "Certificates" tab');
    console.log('   • Download individual or all certificates (PDF)\n');

    console.log('📋 CATEGORY MANAGEMENT:');
    console.log('   • Login as admin@kyokushin.in');
    console.log('   • Go to Management → Tournaments');
    if (upcomingTournament) {
        console.log(`   • Open "${upcomingTournament.name}"`);
    }
    console.log('   • Click "Categories" tab → see participants grouped by category');
    console.log('   • Click "Move" button to reassign a participant to a different category\n');

    console.log('═'.repeat(60));
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
