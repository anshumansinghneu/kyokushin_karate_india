
import prisma from './src/prisma';

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'finalstudent@kyokushin.in' },
        include: { registrations: true }
    });
    console.log(JSON.stringify(user, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
