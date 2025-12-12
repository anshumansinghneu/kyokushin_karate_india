import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting comprehensive seeding...');

    // 1. Clean up database
    await prisma.post.deleteMany();
    await prisma.monthlyRecognition.deleteMany();
    await prisma.trainingSession.deleteMany();
    await prisma.eventRegistration.deleteMany();
    await prisma.tournamentResult.deleteMany();
    await prisma.match.deleteMany();
    await prisma.tournamentBracket.deleteMany();
    await prisma.event.deleteMany();
    await prisma.beltHistory.deleteMany();
    await prisma.beltVerificationRequest.deleteMany();
    await prisma.user.deleteMany();
    await prisma.dojo.deleteMany();
    await prisma.siteContent.deleteMany();

    console.log('🧹 Database cleaned.');

    // 2. Create Multiple Dojos across India
    const dojos = await Promise.all([
        prisma.dojo.create({
            data: {
                name: 'Kyokushin Karate Delhi Dojo',
                dojoCode: 'DEL',
                city: 'New Delhi',
                state: 'Delhi',
                country: 'India',
                address: 'Connaught Place, New Delhi - 110001',
                contactEmail: 'delhi@kyokushin.in',
                contactPhone: '+91-9876543210',
            },
        }),
        prisma.dojo.create({
            data: {
                name: 'Kyokushin Karate Mumbai Dojo',
                dojoCode: 'MUM',
                city: 'Mumbai',
                state: 'Maharashtra',
                country: 'India',
                address: 'Bandra West, Mumbai - 400050',
                contactEmail: 'mumbai@kyokushin.in',
                contactPhone: '+91-9876543211',
            },
        }),
        prisma.dojo.create({
            data: {
                name: 'Kyokushin Karate Bangalore Dojo',
                dojoCode: 'BLR',
                city: 'Bangalore',
                state: 'Karnataka',
                country: 'India',
                address: 'Indiranagar, Bangalore - 560038',
                contactEmail: 'bangalore@kyokushin.in',
                contactPhone: '+91-9876543212',
            },
        }),
        prisma.dojo.create({
            data: {
                name: 'Kyokushin Karate Chennai Dojo',
                dojoCode: 'CHN',
                city: 'Chennai',
                state: 'Tamil Nadu',
                country: 'India',
                address: 'T Nagar, Chennai - 600017',
                contactEmail: 'chennai@kyokushin.in',
                contactPhone: '+91-9876543213',
            },
        }),
        prisma.dojo.create({
            data: {
                name: 'Kyokushin Karate Guwahati Dojo',
                dojoCode: 'GUW',
                city: 'Guwahati',
                state: 'Assam',
                country: 'India',
                address: 'Paltan Bazaar, Guwahati - 781008',
                contactEmail: 'guwahati@kyokushin.in',
                contactPhone: '+91-9876543214',
            },
        }),
    ]);

    console.log('🏯 5 Dojos created across India.');

    // 3. Create Users with proper password
    const passwordHash = await bcrypt.hash('Karate@123', 12);

    // Create Admin
    const admin = await prisma.user.create({
        data: {
            email: 'admin@kyokushin.in',
            passwordHash,
            name: 'Shihan Rajesh Kumar',
            phone: '+919876543200',
            role: 'ADMIN',
            membershipStatus: 'ACTIVE',
            currentBeltRank: '7th Dan',
            city: 'New Delhi',
            state: 'Delhi',
            country: 'India',
            dojoId: dojos[0].id,
            isInstructorApproved: true,
        },
    });

    // Create Instructors for each Dojo
    const instructors = await Promise.all([
        // Delhi Instructor
        prisma.user.create({
            data: {
                email: 'sensei.delhi@kyokushin.in',
                passwordHash,
                name: 'Sensei Vikram Singh',
                phone: '+919876543201',
                role: 'INSTRUCTOR',
                membershipStatus: 'ACTIVE',
                currentBeltRank: '5th Dan',
                city: 'New Delhi',
                state: 'Delhi',
                country: 'India',
                dojoId: dojos[0].id,
                isInstructorApproved: true,
                approvedBy: admin.id,
                approvedAt: new Date(),
            },
        }),
        // Mumbai Instructor
        prisma.user.create({
            data: {
                email: 'sensei.mumbai@kyokushin.in',
                passwordHash,
                name: 'Sensei Priya Sharma',
                phone: '+919876543202',
                role: 'INSTRUCTOR',
                membershipStatus: 'ACTIVE',
                currentBeltRank: '4th Dan',
                city: 'Mumbai',
                state: 'Maharashtra',
                country: 'India',
                dojoId: dojos[1].id,
                isInstructorApproved: true,
                approvedBy: admin.id,
                approvedAt: new Date(),
            },
        }),
        // Bangalore Instructor
        prisma.user.create({
            data: {
                email: 'sensei.bangalore@kyokushin.in',
                passwordHash,
                name: 'Sensei Arjun Reddy',
                phone: '+919876543203',
                role: 'INSTRUCTOR',
                membershipStatus: 'ACTIVE',
                currentBeltRank: '5th Dan',
                city: 'Bangalore',
                state: 'Karnataka',
                country: 'India',
                dojoId: dojos[2].id,
                isInstructorApproved: true,
                approvedBy: admin.id,
                approvedAt: new Date(),
            },
        }),
        // Chennai Instructor
        prisma.user.create({
            data: {
                email: 'sensei.chennai@kyokushin.in',
                passwordHash,
                name: 'Sensei Kumar Raman',
                phone: '+919876543204',
                role: 'INSTRUCTOR',
                membershipStatus: 'ACTIVE',
                currentBeltRank: '3rd Dan',
                city: 'Chennai',
                state: 'Tamil Nadu',
                country: 'India',
                dojoId: dojos[3].id,
                isInstructorApproved: true,
                approvedBy: admin.id,
                approvedAt: new Date(),
            },
        }),
        // Guwahati Instructor (Sihan Vasant Kumar Singh from screenshot)
        prisma.user.create({
            data: {
                email: 'sensei.guwahati@kyokushin.in',
                passwordHash,
                name: 'Sihan Vasant Kumar Singh',
                phone: '+919876543205',
                role: 'INSTRUCTOR',
                membershipStatus: 'ACTIVE',
                currentBeltRank: '6th Dan',
                city: 'Guwahati',
                state: 'Assam',
                country: 'India',
                dojoId: dojos[4].id,
                isInstructorApproved: true,
                approvedBy: admin.id,
                approvedAt: new Date(),
            },
        }),
    ]);

    // Create Students for each Dojo
    const students = await Promise.all([
        // Delhi Students
        prisma.user.create({
            data: {
                email: 'student1.delhi@kyokushin.in',
                passwordHash,
                name: 'Rahul Verma',
                phone: '+919876543301',
                role: 'STUDENT',
                membershipStatus: 'ACTIVE',
                currentBeltRank: 'Brown',
                city: 'New Delhi',
                state: 'Delhi',
                country: 'India',
                dojoId: dojos[0].id,
                primaryInstructorId: instructors[0].id,
                membershipNumber: 'KKI-2025-DEL-00001',
                membershipStartDate: new Date('2024-01-15'),
                membershipEndDate: new Date('2025-01-15'),
                fatherName: 'Mr. Suresh Verma',
                fatherPhone: '+919876543401',
            },
        }),
        prisma.user.create({
            data: {
                email: 'student2.delhi@kyokushin.in',
                passwordHash,
                name: 'Anjali Gupta',
                phone: '+919876543302',
                role: 'STUDENT',
                membershipStatus: 'ACTIVE',
                currentBeltRank: 'Blue',
                city: 'New Delhi',
                state: 'Delhi',
                country: 'India',
                dojoId: dojos[0].id,
                primaryInstructorId: instructors[0].id,
                membershipNumber: 'KKI-2025-DEL-00002',
                membershipStartDate: new Date('2024-06-01'),
                membershipEndDate: new Date('2025-06-01'),
                fatherName: 'Mr. Ramesh Gupta',
                fatherPhone: '+919876543402',
            },
        }),
        // Mumbai Students
        prisma.user.create({
            data: {
                email: 'student1.mumbai@kyokushin.in',
                passwordHash,
                name: 'Rohan Desai',
                phone: '+919876543303',
                role: 'STUDENT',
                membershipStatus: 'ACTIVE',
                currentBeltRank: 'Green',
                city: 'Mumbai',
                state: 'Maharashtra',
                country: 'India',
                dojoId: dojos[1].id,
                primaryInstructorId: instructors[1].id,
                membershipNumber: 'KKI-2025-MUM-00001',
                membershipStartDate: new Date('2024-03-01'),
                membershipEndDate: new Date('2025-03-01'),
                fatherName: 'Mr. Kiran Desai',
                fatherPhone: '+919876543403',
            },
        }),
        // Bangalore Students
        prisma.user.create({
            data: {
                email: 'student1.bangalore@kyokushin.in',
                passwordHash,
                name: 'Aditya Nair',
                phone: '+919876543304',
                role: 'STUDENT',
                membershipStatus: 'ACTIVE',
                currentBeltRank: 'Yellow',
                city: 'Bangalore',
                state: 'Karnataka',
                country: 'India',
                dojoId: dojos[2].id,
                primaryInstructorId: instructors[2].id,
                membershipNumber: 'KKI-2025-BLR-00001',
                membershipStartDate: new Date('2024-07-01'),
                membershipEndDate: new Date('2025-07-01'),
                fatherName: 'Mr. Suresh Nair',
                fatherPhone: '+919876543404',
            },
        }),
        // Chennai Student
        prisma.user.create({
            data: {
                email: 'student1.chennai@kyokushin.in',
                passwordHash,
                name: 'Karthik Subramanian',
                phone: '+919876543305',
                role: 'STUDENT',
                membershipStatus: 'ACTIVE',
                currentBeltRank: 'Orange',
                city: 'Chennai',
                state: 'Tamil Nadu',
                country: 'India',
                dojoId: dojos[3].id,
                primaryInstructorId: instructors[3].id,
                membershipNumber: 'KKI-2025-CHN-00001',
                membershipStartDate: new Date('2024-05-01'),
                membershipEndDate: new Date('2025-05-01'),
                fatherName: 'Mr. Venkat Subramanian',
                fatherPhone: '+919876543405',
            },
        }),
        // Guwahati Student
        prisma.user.create({
            data: {
                email: 'student1.guwahati@kyokushin.in',
                passwordHash,
                name: 'Rajiv Borah',
                phone: '+919876543306',
                role: 'STUDENT',
                membershipStatus: 'ACTIVE',
                currentBeltRank: 'White',
                city: 'Guwahati',
                state: 'Assam',
                country: 'India',
                dojoId: dojos[4].id,
                primaryInstructorId: instructors[4].id,
                membershipNumber: 'KKI-2025-GUW-00001',
                membershipStartDate: new Date('2024-11-01'),
                membershipEndDate: new Date('2025-11-01'),
                fatherName: 'Mr. Dilip Borah',
                fatherPhone: '+919876543406',
            },
        }),
        // Pending Student
        prisma.user.create({
            data: {
                email: 'newstudent@kyokushin.in',
                passwordHash,
                name: 'Prateek Sharma',
                phone: '+919876543307',
                role: 'STUDENT',
                membershipStatus: 'PENDING',
                currentBeltRank: 'White',
                city: 'New Delhi',
                state: 'Delhi',
                country: 'India',
                dojoId: dojos[0].id,
                primaryInstructorId: instructors[0].id,
                fatherName: 'Mr. Ajay Sharma',
                fatherPhone: '+919876543407',
            },
        }),
    ]);

    console.log('👥 Admin, 5 Instructors, and 7 Students created.');

    // 4. Create Events
    const events = await Promise.all([
        // Past Tournament
        prisma.event.create({
            data: {
                type: 'TOURNAMENT',
                name: 'All India Kyokushin Championship 2024',
                description: 'Annual national level Kyokushin Karate championship featuring kumite and kata competitions across all belt ranks.',
                startDate: new Date('2024-10-15'),
                endDate: new Date('2024-10-16'),
                location: 'Indira Gandhi Stadium, New Delhi',
                registrationDeadline: new Date('2024-09-30'),
                memberFee: 1500,
                nonMemberFee: 2500,
                createdBy: admin.id,
                status: 'COMPLETED',
                dojoId: dojos[0].id,
            },
        }),
        // Upcoming Tournament
        prisma.event.create({
            data: {
                type: 'TOURNAMENT',
                name: 'South India Open 2025',
                description: 'Regional tournament open to all Kyokushin practitioners from South India.',
                startDate: new Date('2025-02-20'),
                endDate: new Date('2025-02-21'),
                location: 'Chennai Trade Centre, Chennai',
                registrationDeadline: new Date('2025-02-05'),
                memberFee: 1200,
                nonMemberFee: 2000,
                createdBy: admin.id,
                status: 'UPCOMING',
                dojoId: dojos[3].id,
            },
        }),
        // Winter Camp
        prisma.event.create({
            data: {
                type: 'CAMP',
                name: 'Winter Training Camp 2025',
                description: 'Intensive 3-day training camp focusing on basics, kata, and conditioning. Open to all belt ranks.',
                startDate: new Date('2025-12-20'),
                endDate: new Date('2025-12-22'),
                location: 'Lonavala, Maharashtra',
                registrationDeadline: new Date('2025-12-10'),
                memberFee: 3500,
                nonMemberFee: 5000,
                createdBy: admin.id,
                status: 'UPCOMING',
                dojoId: dojos[1].id,
            },
        }),
        // Belt Test
        prisma.event.create({
            data: {
                type: 'SEMINAR',
                name: 'Q1 Belt Grading 2025',
                description: 'Quarterly belt examination for students ready to advance to their next rank.',
                startDate: new Date('2025-03-15'),
                endDate: new Date('2025-03-15'),
                location: 'Kyokushin Delhi Dojo',
                registrationDeadline: new Date('2025-03-01'),
                memberFee: 500,
                nonMemberFee: 800,
                createdBy: admin.id,
                status: 'UPCOMING',
                dojoId: dojos[0].id,
            },
        }),
        // Seminar
        prisma.event.create({
            data: {
                type: 'SEMINAR',
                name: 'Kata Mastery Seminar with Shihan Rajesh',
                description: 'Special seminar focusing on advanced kata techniques and bunkai applications.',
                startDate: new Date('2025-01-25'),
                endDate: new Date('2025-01-26'),
                location: 'Bangalore Convention Center',
                registrationDeadline: new Date('2025-01-15'),
                memberFee: 2000,
                nonMemberFee: 3000,
                createdBy: admin.id,
                status: 'UPCOMING',
                dojoId: dojos[2].id,
            },
        }),
    ]);

    console.log('📅 5 Events created.');

    // 5. Create Event Registrations
    await Promise.all([
        prisma.eventRegistration.create({
            data: {
                eventId: events[0].id,
                userId: students[0].id,
                paymentStatus: 'PAID',
                approvalStatus: 'APPROVED',
                approvedBy: admin.id,
                approvedAt: new Date('2024-10-01'),
            },
        }),
        prisma.eventRegistration.create({
            data: {
                eventId: events[0].id,
                userId: students[1].id,
                paymentStatus: 'PAID',
                approvalStatus: 'APPROVED',
                approvedBy: admin.id,
                approvedAt: new Date('2024-10-01'),
            },
        }),
        prisma.eventRegistration.create({
            data: {
                eventId: events[1].id,
                userId: students[2].id,
                paymentStatus: 'PENDING',
                approvalStatus: 'PENDING',
            },
        }),
    ]);

    console.log('📝 Event Registrations created.');

    // 6. Create Training Sessions
    const today = new Date();
    const trainingSessions = [];

    // Create training sessions for active students
    for (let studentIdx = 0; studentIdx < 3; studentIdx++) {
        for (let i = 0; i < 10; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i * 2);

            trainingSessions.push({
                userId: students[studentIdx].id,
                date: date,
                duration: 90 + Math.floor(Math.random() * 30),
                intensity: ['LOW', 'MEDIUM', 'HIGH'][i % 3] as any,
                focus: ['Kata', 'Kumite', 'Basics', 'Conditioning'][i % 4],
                notes: 'Good progress, keep practicing!',
            });
        }
    }

    await prisma.trainingSession.createMany({
        data: trainingSessions,
    });

    console.log('🥋 30 Training sessions logged.');

    // 7. Create Belt History
    await Promise.all([
        prisma.beltHistory.create({
            data: {
                studentId: students[0].id,
                oldBelt: 'Blue',
                newBelt: 'Brown',
                promotedBy: instructors[0].id,
            },
        }),
        prisma.beltHistory.create({
            data: {
                studentId: students[1].id,
                oldBelt: 'Yellow',
                newBelt: 'Blue',
                promotedBy: instructors[0].id,
            },
        }),
    ]);

    console.log('🎖️ Belt History created.');

    // 8. Create Posts/Articles
    await Promise.all([
        prisma.post.create({
            data: {
                type: 'BLOG',
                title: 'The Philosophy of Kyokushin Karate',
                slug: 'philosophy-of-kyokushin-karate',
                excerpt: 'Understanding the core principles and philosophy behind Kyokushin Karate training.',
                content: 'Kyokushin Karate, founded by Sosai Masutatsu Oyama, is more than just a martial art - it is a way of life. The philosophy emphasizes perseverance, discipline, and continuous self-improvement...',
                imageUrl: '/images/philosophy.jpg',
                status: 'PUBLISHED',
                authorId: admin.id,
            },
        }),
        prisma.post.create({
            data: {
                type: 'BLOG',
                title: 'Essential Kata for White Belts',
                slug: 'essential-kata-for-white-belts',
                excerpt: 'Learn the fundamental kata every white belt should master before advancing.',
                content: 'Kata is the foundation of karate training. For white belts, mastering Taikyoku Sono Ichi is crucial. This kata teaches proper stances, basic blocks, and punches...',
                imageUrl: '/images/kata.jpg',
                status: 'PUBLISHED',
                authorId: instructors[0].id,
            },
        }),
        prisma.post.create({
            data: {
                type: 'BLOG',
                title: 'Preparing for Your First Tournament',
                slug: 'preparing-for-first-tournament',
                excerpt: 'Tips and advice for students competing in their first Kyokushin tournament.',
                content: 'Competing in your first tournament can be nerve-wracking, but with proper preparation, you can perform your best. Focus on conditioning, practice your kata, and mentally prepare...',
                imageUrl: '/images/tournament.jpg',
                status: 'PUBLISHED',
                authorId: instructors[1].id,
            },
        }),
        prisma.post.create({
            data: {
                type: 'BLOG',
                title: 'Conditioning Exercises for Kyokushin',
                slug: 'conditioning-exercises-kyokushin',
                excerpt: 'Build strength and endurance with these essential conditioning exercises.',
                content: 'Physical conditioning is crucial for Kyokushin practitioners. This article covers push-ups, sit-ups, squats, and other exercises that will improve your karate performance...',
                imageUrl: '/images/conditioning.jpg',
                status: 'PUBLISHED',
                authorId: instructors[2].id,
            },
        }),
        prisma.post.create({
            data: {
                type: 'BLOG',
                title: 'Understanding Belt Rankings in Kyokushin',
                slug: 'understanding-belt-rankings',
                excerpt: 'A comprehensive guide to the belt system and what each rank represents.',
                content: 'The belt system in Kyokushin Karate represents your journey and progress. Starting from White belt and progressing through Yellow, Orange, Blue, Green, Brown, and finally Black belt...',
                imageUrl: '/images/belts.jpg',
                status: 'PUBLISHED',
                authorId: admin.id,
            },
        }),
        prisma.post.create({
            data: {
                type: 'BLOG',
                title: 'The History of Kyokushin Karate in India',
                slug: 'history-kyokushin-india',
                excerpt: 'Tracing the journey of Kyokushin Karate from Japan to India.',
                content: 'Kyokushin Karate was introduced to India in the 1980s and has since grown into a thriving martial arts community. This article explores the pioneers who brought this art to Indian shores...',
                imageUrl: '/images/history.jpg',
                status: 'DRAFT',
                authorId: admin.id,
            },
        }),
    ]);

    console.log('📰 6 Posts/Articles created.');

    // 9. Create Monthly Recognition
    await Promise.all([
        prisma.monthlyRecognition.create({
            data: {
                userId: students[0].id,
                month: 11,
                year: 2024,
                type: 'STUDENT',
            },
        }),
        prisma.monthlyRecognition.create({
            data: {
                userId: students[1].id,
                month: 10,
                year: 2024,
                type: 'STUDENT',
            },
        }),
    ]);

    console.log('🏆 Monthly Recognition records created.');

    // 10. Create Site Content
    await Promise.all([
        prisma.siteContent.create({
            data: {
                key: 'homepage_hero_title',
                value: 'Welcome to Kyokushin Karate India',
                type: 'TEXT',
                description: 'Main heading on homepage',
            },
        }),
        prisma.siteContent.create({
            data: {
                key: 'homepage_hero_subtitle',
                value: 'The Ultimate Karate - Build Strength, Discipline, and Character',
                type: 'TEXT',
                description: 'Subheading on homepage',
            },
        }),
        prisma.siteContent.create({
            data: {
                key: 'about_organization',
                value: 'Kyokushin Karate India is the official organization promoting Kyokushin Karate across India. Founded in 1985, we have grown to over 50 dojos nationwide.',
                type: 'TEXT',
                description: 'About us content',
            },
        }),
    ]);

    console.log('📄 Site Content created.');
    console.log('\n✅ ========================================');
    console.log('✅ SEEDING COMPLETED SUCCESSFULLY!');
    console.log('✅ ========================================\n');
    console.log('📧 LOGIN CREDENTIALS:\n');
    console.log('👑 ADMIN:');
    console.log('   Email: admin@kyokushin.in');
    console.log('   Password: Karate@123');
    console.log('   Name: Shihan Rajesh Kumar\n');
    console.log('👨‍🏫 INSTRUCTORS:');
    console.log('   Delhi - sensei.delhi@kyokushin.in | Karate@123 | Sensei Vikram Singh');
    console.log('   Mumbai - sensei.mumbai@kyokushin.in | Karate@123 | Sensei Priya Sharma');
    console.log('   Bangalore - sensei.bangalore@kyokushin.in | Karate@123 | Sensei Arjun Reddy');
    console.log('   Chennai - sensei.chennai@kyokushin.in | Karate@123 | Sensei Kumar Raman');
    console.log('   Guwahati - sensei.guwahati@kyokushin.in | Karate@123 | Sihan Vasant Kumar Singh\n');
    console.log('🥋 STUDENTS:');
    console.log('   Delhi 1 - student1.delhi@kyokushin.in | Karate@123 | Rahul Verma (Brown Belt)');
    console.log('   Delhi 2 - student2.delhi@kyokushin.in | Karate@123 | Anjali Gupta (Blue Belt)');
    console.log('   Mumbai - student1.mumbai@kyokushin.in | Karate@123 | Rohan Desai (Green Belt)');
    console.log('   Bangalore - student1.bangalore@kyokushin.in | Karate@123 | Aditya Nair (Yellow Belt)');
    console.log('   Chennai - student1.chennai@kyokushin.in | Karate@123 | Karthik Subramanian (Orange Belt)');
    console.log('   Guwahati - student1.guwahati@kyokushin.in | Karate@123 | Rajiv Borah (White Belt)');
    console.log('   Pending - newstudent@kyokushin.in | Karate@123 | Prateek Sharma (PENDING)\n');
    console.log('📊 DATABASE SUMMARY:');
    console.log('   🏯 5 Dojos (Delhi, Mumbai, Bangalore, Chennai, Guwahati)');
    console.log('   👥 13 Users (1 Admin, 5 Instructors, 7 Students)');
    console.log('   📅 5 Events (1 Completed, 4 Upcoming)');
    console.log('   📝 3 Event Registrations');
    console.log('   🥋 30 Training Sessions');
    console.log('   🎖️ 2 Belt History Records');
    console.log('   📰 6 Posts/Articles');
    console.log('   🏆 2 Monthly Recognition Records');
    console.log('   📄 3 Site Content Items\n');
    console.log('🚀 Ready for your demo!\n');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
