
import prisma from './src/prisma';

async function main() {
    const admin = await prisma.user.findFirst({
        where: {
            OR: [
                { role: 'ADMIN' },
                { name: { contains: 'Vasant', mode: 'insensitive' } }
            ]
        }
    });
    console.log(JSON.stringify(admin, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
