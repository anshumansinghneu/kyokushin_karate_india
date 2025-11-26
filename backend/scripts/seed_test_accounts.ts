import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Seed script for creating test accounts for E2E testing
 * Creates: Admin, Instructors, Students from multiple dojos
 * Password for all accounts: password123
 */

async function main() {
    console.log('🌱 Starting test account seeding...');

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

    // 4. Create Students (4 per dojo = 16 total for tournament brackets)
    console.log('👨‍🎓 Creating students...');
    
    const studentNames = [
        'Arjun Singh', 'Priya Desai', 'Rohan Mehta', 'Ananya Iyer',
        'Karan Verma', 'Sneha Reddy', 'Aditya Joshi', 'Neha Kapoor',
        'Vikram Gupta', 'Pooja Nair', 'Siddharth Kumar', 'Divya Patel',
        'Rajesh Rao', 'Kavita Sharma', 'Manish Agarwal', 'Priyanka Bose',
    ];

    const beltRanks = ['White', 'Yellow', 'Orange', 'Blue', 'Green', 'Brown', 'Black'];
    const students = [];

    for (let dojoIdx = 0; dojoIdx < dojos.length; dojoIdx++) {
        for (let studentIdx = 0; studentIdx < 4; studentIdx++) {
            const overallIdx = dojoIdx * 4 + studentIdx;
            const student = await prisma.user.create({
                data: {
                    email: `student${overallIdx + 1}@kyokushin.in`,
                    passwordHash,
                    name: studentNames[overallIdx],
                    role: 'STUDENT',
                    membershipStatus: 'ACTIVE',
                    currentBeltRank: beltRanks[Math.floor(Math.random() * beltRanks.length)],
                    dojoId: dojos[dojoIdx].id,
                    primaryInstructorId: instructors[dojoIdx].id,
                    membershipNumber: `KKI-2025-${dojos[dojoIdx].dojoCode}-${String(studentIdx + 1).padStart(5, '0')}`,
                    membershipStartDate: new Date('2024-06-01'),
                    membershipEndDate: new Date('2026-05-31'),
                    phone: `+91-${9000000000 + overallIdx}`,
                    dateOfBirth: new Date(1995 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), 1),
                    weight: 60 + Math.floor(Math.random() * 30), // 60-90 kg
                },
            });
            students.push(student);
        }
    }

    console.log(`✅ Created ${students.length} students`);

    // 5. Create Test Tournament Event
    console.log('🏆 Creating test tournament...');
    
    const tournament = await prisma.event.create({
        data: {
            type: 'TOURNAMENT',
            name: 'National Kyokushin Championship 2025',
            description: 'Annual National Championship - Kumite and Kata competitions',
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
                { age: '18-35', weight: 'Under 70kg', belt: 'Brown' },
                { age: '18-35', weight: 'Under 80kg', belt: 'Black' },
                { age: '18-35', weight: 'Over 80kg', belt: 'Open' },
                { age: '36-45', weight: 'Open', belt: 'Open' },
            ],
        },
    });

    console.log(`✅ Tournament created: ${tournament.name}`);

    // 6. Auto-register all students to the tournament
    console.log('📝 Registering students to tournament...');
    
    const categories = [
        { age: '18-35', weight: 'Under 70kg', belt: 'Brown' },
        { age: '18-35', weight: 'Under 80kg', belt: 'Black' },
        { age: '18-35', weight: 'Over 80kg', belt: 'Open' },
        { age: '36-45', weight: 'Open', belt: 'Open' },
    ];

    const registrations = await Promise.all(
        students.map(async (student, idx) => {
            const category = categories[idx % categories.length];
            return prisma.eventRegistration.create({
                data: {
                    eventId: tournament.id,
                    userId: student.id,
                    categoryAge: category.age,
                    categoryWeight: category.weight,
                    categoryBelt: category.belt,
                    eventType: 'KUMITE',
                    paymentStatus: 'PAID',
                    approvalStatus: 'APPROVED',
                    approvedBy: admin.id,
                    approvedAt: new Date(),
                },
            });
        })
    );

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
    console.log('   student1@kyokushin.in to student16@kyokushin.in');
    
    console.log(`\n🏯 DOJOS: ${dojos.length} dojos created`);
    dojos.forEach((dojo, idx) => {
        console.log(`   ${idx + 1}. ${dojo.name} (${dojo.city})`);
    });
    
    console.log(`\n🏆 TOURNAMENT:`);
    console.log(`   Name: ${tournament.name}`);
    console.log(`   Date: ${tournament.startDate.toLocaleDateString()}`);
    console.log(`   Registered: ${registrations.length} participants`);
    console.log(`   Categories: ${categories.length}`);
    
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
