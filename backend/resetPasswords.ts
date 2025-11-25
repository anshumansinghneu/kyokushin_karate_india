
import prisma from './src/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    const password = await bcrypt.hash('password123', 10);

    // Reset Admin
    await prisma.user.updateMany({
        where: { role: 'ADMIN' },
        data: { passwordHash: password }
    });

    // Reset Instructor
    await prisma.user.updateMany({
        where: { email: 'instructor@kyokushin.com' },
        data: { passwordHash: password }
    });

    console.log('Passwords reset to "password123"');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
