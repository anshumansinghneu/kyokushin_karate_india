
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdmin() {
    try {
        const email = 'admin@kyokushin.com';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                passwordHash: hashedPassword,
                role: 'ADMIN'
            },
            create: {
                email,
                passwordHash: hashedPassword,
                name: 'Mas Oyama',
                role: 'ADMIN',
                currentBeltRank: '10th Dan',
                dojoId: 'default-dojo-id' // This might fail if dojo doesn't exist, but let's try update first
            }
        });

        console.log(`Admin user ${user.email} updated/created. Password is: ${password}`);
    } catch (error) {
        console.error('Error resetting admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetAdmin();
