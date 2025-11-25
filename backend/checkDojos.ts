
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const dojos = await prisma.dojo.findMany();
    console.log(JSON.stringify(dojos, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
