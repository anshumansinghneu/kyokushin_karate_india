
import prisma from './src/prisma';

async function main() {
    const events = await prisma.event.findMany();
    console.log(JSON.stringify(events, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
