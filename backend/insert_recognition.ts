import prisma from './src/prisma';

async function main() {
    const email = 'admin@kyokushin.com';
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.log('Admin user not found');
        return;
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Clear existing for this month to avoid unique constraint
    await prisma.monthlyRecognition.deleteMany({
        where: { month, year }
    });

    await prisma.monthlyRecognition.create({
        data: {
            userId: user.id,
            type: 'INSTRUCTOR',
            month,
            year
        }
    });

    console.log('Inserted recognition for admin user as Instructor');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
