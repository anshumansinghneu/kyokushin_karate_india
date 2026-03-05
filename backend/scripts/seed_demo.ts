/**
 * KKFI Seed — Clean DB + create admin only
 * Run: cd backend && npx tsx scripts/seed_demo.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning all data...');

    await prisma.studentNote.deleteMany();
    await prisma.profileView.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.trainingSession.deleteMany();
    await prisma.beltExamResult.deleteMany();
    await prisma.eventRegistration.deleteMany();
    await prisma.tournamentResult.deleteMany();
    await prisma.match.deleteMany();
    await prisma.tournamentBracket.deleteMany();
    await prisma.merchOrderItem.deleteMany();
    await prisma.merchOrder.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.cashVoucher.deleteMany();
    await prisma.gallery.deleteMany();
    await prisma.event.deleteMany();
    await prisma.monthlyRecognition.deleteMany();
    await prisma.beltVerificationRequest.deleteMany();
    await prisma.post.deleteMany();
    await prisma.beltHistory.deleteMany();
    await prisma.product.deleteMany();
    await prisma.siteContent.deleteMany();
    await prisma.siteVisit.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.passwordResetToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.dojo.deleteMany();
    console.log('Database cleaned');

    const passwordHash = await bcrypt.hash('Admin@1234', 12);

    const admin = await prisma.user.create({
        data: {
            email: 'admin@kyokushin.com',
            passwordHash,
            name: 'Vasant Kumar Singh',
            role: 'ADMIN',
            membershipStatus: 'ACTIVE',
            currentBeltRank: 'Black 4th Dan',
            membershipNumber: 'KKFI-ADM-0001',
            membershipStartDate: new Date('2015-01-01'),
            membershipEndDate: new Date('2030-12-31'),
        },
    });

    console.log('Admin created');
    console.log('  Email: admin@kyokushin.com');
    console.log('  Password: Admin@1234');
    console.log('  Name: ' + admin.name);
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
