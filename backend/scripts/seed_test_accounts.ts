import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed script for creating test accounts for E2E testing
 * Creates: Admin, Instructors, Students from multiple dojos
 * Password for all accounts: password123
 */

async function main() {
    console.log('🌱 Starting test account seeding...');
    console.log('🧹 Cleaning existing data...');

    // Clean up existing data (order matters due to foreign keys)
    await prisma.studentNote.deleteMany();
    await prisma.profileView.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.trainingSession.deleteMany();
    await prisma.eventRegistration.deleteMany();
    await prisma.tournamentResult.deleteMany();
    await prisma.match.deleteMany();
    await prisma.tournamentBracket.deleteMany();
    await prisma.event.deleteMany();
    await prisma.monthlyRecognition.deleteMany();
    await prisma.beltVerificationRequest.deleteMany();
    await prisma.post.deleteMany();
    await prisma.beltHistory.deleteMany();
    await prisma.gallery.deleteMany();
    await prisma.voucherCode.deleteMany();
    await prisma.siteContent.deleteMany();
    await prisma.user.deleteMany();
    await prisma.dojo.deleteMany();

    console.log('✅ Database cleaned');

    const passwordHash = await bcrypt.hash('password123', 12);

    // 1. Create Multiple Dojos
    console.log('🏯 Creating dojos...');

    const dojos = await Promise.all([
        prisma.dojo.create({
            data: {
                name: 'Mumbai Central Dojo',
                dojoCode: 'MUM-01',
                city: 'Mumbai',
                state: 'Maharashtra',
                address: 'Andheri West, Mumbai',
                contactEmail: 'mumbai@kyokushin.in',
            },
        }),
        prisma.dojo.create({
            data: {
                name: 'Delhi Kyokushin Academy',
                dojoCode: 'DEL-01',
                city: 'New Delhi',
                state: 'Delhi',
                address: 'Karol Bagh, New Delhi',
                contactEmail: 'delhi@kyokushin.in',
            },
        }),
        prisma.dojo.create({
            data: {
                name: 'Bangalore Warriors Dojo',
                dojoCode: 'BLR-01',
                city: 'Bangalore',
                state: 'Karnataka',
                address: 'Koramangala, Bangalore',
                contactEmail: 'bangalore@kyokushin.in',
            },
        }),
        prisma.dojo.create({
            data: {
                name: 'Pune Fighting Spirit',
                dojoCode: 'PUN-01',
                city: 'Pune',
                state: 'Maharashtra',
                address: 'Shivaji Nagar, Pune',
                contactEmail: 'pune@kyokushin.in',
            },
        }),
    ]);

    console.log(`✅ Created ${dojos.length} dojos`);

    // 2. Create Admin Account
    console.log('👑 Creating admin account...');

    const admin = await prisma.user.create({
        data: {
            email: 'admin@kyokushin.in',
            passwordHash,
            name: 'Shihan Admin',
            role: 'ADMIN',
            membershipStatus: 'ACTIVE',
            currentBeltRank: '5th Dan',
            dojoId: dojos[0].id,
            membershipNumber: 'KKI-ADMIN-001',
            membershipStartDate: new Date('2020-01-01'),
            membershipEndDate: new Date('2030-12-31'),
            phone: '+91-9876543210',
        },
    });

    console.log(`✅ Admin created: ${admin.email}`);

    // 3. Create Instructors (one per dojo)
    console.log('🥋 Creating instructors...');

    const instructors = await Promise.all(
        dojos.map(async (dojo, idx) => {
            return prisma.user.create({
                data: {
                    email: `instructor${idx + 1}@kyokushin.in`,
                    passwordHash,
                    name: `Sensei ${['Ravi Kumar', 'Amit Sharma', 'Vijay Patel', 'Rahul Singh'][idx]}`,
                    role: 'INSTRUCTOR',
                    membershipStatus: 'ACTIVE',
                    currentBeltRank: ['3rd Dan', '4th Dan', '3rd Dan', '2nd Dan'][idx],
                    dojoId: dojo.id,
                    membershipNumber: `KKI-INST-${String(idx + 1).padStart(3, '0')}`,
                    membershipStartDate: new Date('2021-01-01'),
                    membershipEndDate: new Date('2030-12-31'),
                    phone: `+91-98765432${10 + idx}`,
                },
            });
        })
    );

    console.log(`✅ Created ${instructors.length} instructors`);

    // 4. Create Students (8 per dojo = 32 total for realistic tournament brackets)
    console.log('👨‍🎓 Creating students...');

    const studentNames = [
        // Mumbai Dojo (8 students)
        'Arjun Singh', 'Priya Desai', 'Rohan Mehta', 'Ananya Iyer',
        'Kunal Sharma', 'Sneha Patel', 'Aditya Nair', 'Isha Kapoor',
        // Delhi Dojo (8 students)
        'Karan Verma', 'Meera Reddy', 'Vikram Joshi', 'Neha Gupta',
        'Siddharth Kumar', 'Priyanka Bose', 'Rahul Agarwal', 'Divya Singh',
        // Bangalore Dojo (8 students)
        'Ravi Kumar', 'Kavita Rao', 'Amit Deshmukh', 'Pooja Nair',
        'Suresh Pillai', 'Lakshmi Iyer', 'Karthik Reddy', 'Anjali Menon',
        // Pune Dojo (8 students)
        'Rajesh Patil', 'Smita Joshi', 'Manish Kulkarni', 'Deepa Sharma',
        'Varun Desai', 'Shruti Phadke', 'Nikhil Jadhav', 'Pallavi Deshpande',
    ];

    // Realistic belt distribution (pyramid structure - more lower belts)
    const beltDistribution = [
        'White', 'White', 'White', 'White',      // 4 white belts
        'Yellow', 'Yellow', 'Orange', 'Orange',   // 2 yellow, 2 orange
        'Blue', 'Blue', 'Green', 'Green',         // 2 blue, 2 green
        'Brown', 'Brown',                         // 2 brown
        'Black 1st Dan', 'Black 1st Dan',        // 2 black belts
    ];

    // Age ranges for realistic categories (birth years)
    const ageRanges = [
        { name: '18-25', minYear: 2000, maxYear: 2007 },  // 8 students
        { name: '26-35', minYear: 1990, maxYear: 1999 },  // 12 students
        { name: '36-45', minYear: 1980, maxYear: 1989 },  // 8 students
        { name: '46-55', minYear: 1970, maxYear: 1979 },  // 4 students
    ];

    // Weight ranges for realistic categories (kg)
    const weightRanges = [
        { name: 'Under 65kg', min: 55, max: 64 },   // 8 students
        { name: 'Under 75kg', min: 65, max: 74 },   // 12 students
        { name: 'Under 85kg', min: 75, max: 84 },   // 8 students
        { name: 'Over 85kg', min: 85, max: 100 },   // 4 students
    ];

    const students = [];
    let ageIdx = 0;
    let weightIdx = 0;
    let beltIdx = 0;

    for (let dojoIdx = 0; dojoIdx < dojos.length; dojoIdx++) {
        for (let studentIdx = 0; studentIdx < 8; studentIdx++) {
            const overallIdx = dojoIdx * 8 + studentIdx;

            // Distribute students across age ranges
            const ageRange = ageRanges[ageIdx % ageRanges.length];
            const birthYear = ageRange.minYear + Math.floor(Math.random() * (ageRange.maxYear - ageRange.minYear + 1));
            ageIdx++;

            // Distribute students across weight ranges
            const weightRange = weightRanges[weightIdx % weightRanges.length];
            const weight = weightRange.min + Math.floor(Math.random() * (weightRange.max - weightRange.min + 1));
            weightIdx++;

            // Assign belt from distribution
            const currentBeltRank = beltDistribution[beltIdx % beltDistribution.length];
            beltIdx++;

            const student = await prisma.user.create({
                data: {
                    email: `student${overallIdx + 1}@kyokushin.in`,
                    passwordHash,
                    name: studentNames[overallIdx],
                    role: 'STUDENT',
                    membershipStatus: 'ACTIVE',
                    currentBeltRank,
                    dojoId: dojos[dojoIdx].id,
                    primaryInstructorId: instructors[dojoIdx].id,
                    membershipNumber: `KKI-2025-${dojos[dojoIdx].dojoCode}-${String(studentIdx + 1).padStart(5, '0')}`,
                    membershipStartDate: new Date('2024-06-01'),
                    membershipEndDate: new Date('2026-05-31'),
                    phone: `+91-${9000000000 + overallIdx}`,
                    dateOfBirth: new Date(birthYear, Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28)),
                    weight,
                    height: 155 + Math.floor(Math.random() * 30), // 155-185 cm
                },
            });
            students.push(student);
        }
    }

    console.log(`✅ Created ${students.length} students with realistic age/weight/belt distribution`);

    // 5. Create Test Tournament Event with proper categories
    console.log('🏆 Creating test tournament...');

    const tournament = await prisma.event.create({
        data: {
            type: 'TOURNAMENT',
            name: 'National Kyokushin Championship 2025',
            description: 'Annual National Championship - Kumite competitions across age, weight, and belt categories',
            startDate: new Date('2025-12-15'),
            endDate: new Date('2025-12-16'),
            location: 'Mumbai, Maharashtra',
            registrationDeadline: new Date('2025-12-01'),
            memberFee: 1000,
            nonMemberFee: 1500,
            maxParticipants: 100,
            createdBy: admin.id,
            status: 'UPCOMING',
            categories: [
                // Youth Categories (8 fighters per category)
                { age: '18-25', weight: 'Under 65kg', belt: 'Open' },
                { age: '18-25', weight: 'Under 75kg', belt: 'Open' },
                // Adult Categories (8 fighters per category)
                { age: '26-35', weight: 'Under 75kg', belt: 'Open' },
                { age: '26-35', weight: 'Under 85kg', belt: 'Open' },
                // Masters Categories (4-8 fighters per category)
                { age: '36-45', weight: 'Under 85kg', belt: 'Open' },
                { age: '36-45', weight: 'Over 85kg', belt: 'Open' },
                // Belt-Specific Categories
                { age: 'Open', weight: 'Open', belt: 'White-Yellow' },
                { age: 'Open', weight: 'Open', belt: 'Brown-Black' },
            ],
        },
    });

    console.log(`✅ Tournament created: ${tournament.name}`);

    // 6. Auto-register students to appropriate tournament categories based on their profile
    console.log('📝 Registering students to tournament categories...');

    const registrations = [];

    for (const student of students) {
        const age = new Date().getFullYear() - (student.dateOfBirth?.getFullYear() || 2000);
        const weight = student.weight || 70;
        const belt = student.currentBeltRank || 'White';

        // Determine age category
        let ageCategory = '26-35';
        if (age >= 18 && age <= 25) ageCategory = '18-25';
        else if (age >= 26 && age <= 35) ageCategory = '26-35';
        else if (age >= 36 && age <= 45) ageCategory = '36-45';
        else if (age >= 46 && age <= 55) ageCategory = '46-55';

        // Determine weight category
        let weightCategory = 'Under 75kg';
        if (weight < 65) weightCategory = 'Under 65kg';
        else if (weight < 75) weightCategory = 'Under 75kg';
        else if (weight < 85) weightCategory = 'Under 85kg';
        else weightCategory = 'Over 85kg';

        // Register to age/weight category with Open belt
        const registration = await prisma.eventRegistration.create({
            data: {
                eventId: tournament.id,
                userId: student.id,
                categoryAge: ageCategory,
                categoryWeight: weightCategory,
                categoryBelt: 'Open',
                eventType: 'KUMITE',
                paymentStatus: 'PAID',
                approvalStatus: 'APPROVED',
                approvedBy: admin.id,
                approvedAt: new Date(),
            },
        });
        registrations.push(registration);
    }

    console.log(`✅ Registered ${registrations.length} students to tournament`);

    // 7. Create some training sessions for students
    console.log('🥊 Creating training sessions...');

    const today = new Date();
    let sessionCount = 0;

    for (const student of students.slice(0, 8)) { // First 8 students
        for (let i = 0; i < 3; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - (i * 3));

            await prisma.trainingSession.create({
                data: {
                    userId: student.id,
                    date: date,
                    duration: 90 + Math.floor(Math.random() * 30),
                    intensity: ['HIGH', 'MEDIUM', 'LOW'][Math.floor(Math.random() * 3)] as any,
                    focus: ['Kumite', 'Kata', 'Conditioning'][Math.floor(Math.random() * 3)],
                    notes: `Training session ${i + 1}`,
                },
            });
            sessionCount++;
        }
    }

    console.log(`✅ Created ${sessionCount} training sessions`);

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST ACCOUNT SEEDING COMPLETED!');
    console.log('='.repeat(60));
    console.log('\n📋 ACCOUNT SUMMARY:\n');
    console.log('🔐 All accounts use password: password123\n');

    console.log('👑 ADMIN ACCOUNT:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Role: ${admin.role}\n`);

    console.log('🥋 INSTRUCTOR ACCOUNTS:');
    instructors.forEach((inst, idx) => {
        console.log(`   ${idx + 1}. ${inst.email} - ${inst.name} (${dojos[idx].name})`);
    });

    console.log(`\n👨‍🎓 STUDENT ACCOUNTS: ${students.length} students created`);
    console.log('   student1@kyokushin.in to student32@kyokushin.in');
    console.log('   Age Distribution: 18-25 (8), 26-35 (12), 36-45 (8), 46-55 (4)');
    console.log('   Weight Distribution: Under 65kg (8), 65-75kg (12), 75-85kg (8), Over 85kg (4)');
    console.log('   Belt Distribution: White (4), Yellow (2), Orange (2), Blue (2), Green (2), Brown (2), Black (2)');

    console.log(`\n🏯 DOJOS: ${dojos.length} dojos created (8 students each)`);
    dojos.forEach((dojo, idx) => {
        console.log(`   ${idx + 1}. ${dojo.name} (${dojo.city})`);
    });

    console.log(`\n🏆 TOURNAMENT:`);
    console.log(`   Name: ${tournament.name}`);
    console.log(`   Date: ${tournament.startDate.toLocaleDateString()}`);
    console.log(`   Total Registrations: ${registrations.length} (${students.length} students × 2 categories)`);
    console.log(`   Categories: 8 divisions (age/weight combinations + belt-specific)`);

    console.log('\n' + '='.repeat(60));
    console.log('🎯 QUICK START:');
    console.log('   1. Login as admin@kyokushin.in');
    console.log('   2. Go to Tournaments tab');
    console.log('   3. Click "Generate Brackets" for the tournament');
    console.log('   4. Start scoring matches!');
    console.log('='.repeat(60) + '\n');
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
