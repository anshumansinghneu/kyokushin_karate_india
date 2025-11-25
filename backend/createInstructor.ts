
import prisma from './src/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    const email = 'instructor@kyokushin.com';
    const password = await bcrypt.hash('instructor123', 10);

    const instructor = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            passwordHash: password,
            name: 'Sensei Kenji',
            role: 'INSTRUCTOR',
            membershipStatus: 'ACTIVE',
            currentBeltRank: '3rd Dan',
        },
    });

    console.log('Instructor created:', instructor);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
