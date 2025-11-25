import prisma from './src/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    const email = 'admin@kyokushin.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await prisma.user.findUnique({
        where: { email }
    });

    if (!admin) {
        console.log('Admin user not found. Creating...');
        await prisma.user.create({
            data: {
                name: 'Admin User',
                email,
                passwordHash: hashedPassword,
                role: 'ADMIN',
                membershipStatus: 'ACTIVE'
            }
        });
        console.log('Admin user created.');
    } else {
        console.log('Admin user found. Resetting password...');
        await prisma.user.update({
            where: { email },
            data: {
                passwordHash: hashedPassword,
                role: 'ADMIN' // Ensure role is ADMIN
            }
        });
        console.log('Admin password reset.');
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
