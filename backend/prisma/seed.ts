import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seeding...');

    // 1. Clean up database
    await prisma.trainingSession.deleteMany();
    await prisma.eventRegistration.deleteMany();
    await prisma.tournamentResult.deleteMany();
    await prisma.match.deleteMany();
    await prisma.tournamentBracket.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
    await prisma.dojo.deleteMany();

    console.log('🧹 Database cleaned.');

    // 2. Create Dojo
    const dojo = await prisma.dojo.create({
        data: {
            name: 'Kyokushin Honbu Dojo',
            dojoCode: 'HQ',
            city: 'Tokyo',
            state: 'Tokyo',
            address: '1-1-1 Ikebukuro, Toshima-ku',
            contactEmail: 'hq@kyokushin.com',
        },
    });

    console.log('🏯 Dojo created.');

    // 3. Create Users
    const passwordHash = await bcrypt.hash('password123', 12);

    // Admin
    const admin = await prisma.user.create({
        data: {
            email: 'admin@kyokushin.com',
            passwordHash,
            name: 'Mas Oyama',
            role: 'ADMIN',
            membershipStatus: 'ACTIVE',
            currentBeltRank: '10th Dan',
            dojoId: dojo.id,
        },
    });

    // Instructor
    const instructor = await prisma.user.create({
        data: {
            email: 'instructor@kyokushin.com',
            passwordHash,
            name: 'Kenji Yamaki',
            role: 'INSTRUCTOR',
            membershipStatus: 'ACTIVE',
            currentBeltRank: '8th Dan',
            dojoId: dojo.id,
        },
    });

    // Student
    const student = await prisma.user.create({
        data: {
            email: 'student@kyokushin.com',
            passwordHash,
            name: 'Hajime Kazumi',
            role: 'STUDENT',
            membershipStatus: 'ACTIVE',
            currentBeltRank: 'Brown',
            dojoId: dojo.id,
            primaryInstructorId: instructor.id,
            membershipNumber: 'KKI-2025-HQ-00001',
            membershipStartDate: new Date(),
            membershipEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        },
    });

    // Pending Student
    const pendingStudent = await prisma.user.create({
        data: {
            email: 'newbie@kyokushin.com',
            passwordHash,
            name: 'New Student',
            role: 'STUDENT',
            membershipStatus: 'PENDING',
            currentBeltRank: 'White',
            dojoId: dojo.id,
        },
    });

    console.log('👥 Users created.');

    // 4. Create Events
    const pastEvent = await prisma.event.create({
        data: {
            type: 'TOURNAMENT',
            name: 'All Japan Open 2024',
            description: 'The 56th All Japan Open Karate Championship',
            startDate: new Date('2024-11-15'),
            endDate: new Date('2024-11-16'),
            location: 'Tokyo Metropolitan Gymnasium',
            registrationDeadline: new Date('2024-10-01'),
            memberFee: 50,
            nonMemberFee: 100,
            createdBy: admin.id,
            status: 'COMPLETED',
        },
    });

    const upcomingEvent = await prisma.event.create({
        data: {
            type: 'CAMP',
            name: 'Winter Training Camp 2025',
            description: 'Annual winter training camp in the mountains.',
            startDate: new Date('2025-12-20'),
            endDate: new Date('2025-12-22'),
            location: 'Mount Mitsumine',
            registrationDeadline: new Date('2025-12-01'),
            memberFee: 200,
            nonMemberFee: 300,
            createdBy: admin.id,
            status: 'UPCOMING',
        },
    });

    console.log('📅 Events created.');

    // 5. Register Student to Past Event
    await prisma.eventRegistration.create({
        data: {
            eventId: pastEvent.id,
            userId: student.id,
            paymentStatus: 'PAID',
            approvalStatus: 'APPROVED',
            approvedBy: admin.id,
            approvedAt: new Date(),
        },
    });

    console.log('📝 Registrations created.');

    // 6. Create Training Sessions
    const today = new Date();
    const sessions = [];

    // Create 5 sessions over the last week
    for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        sessions.push({
            userId: student.id,
            date: date,
            duration: 90 + Math.floor(Math.random() * 30), // 90-120 mins
            intensity: i % 2 === 0 ? 'HIGH' : 'MEDIUM',
            focus: i % 2 === 0 ? 'Kumite' : 'Kata',
            notes: 'Good session, worked on basics.',
        });
    }

    await prisma.trainingSession.createMany({
        data: sessions,
    });

    console.log('oss! Training sessions logged.');
    console.log('✅ Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
