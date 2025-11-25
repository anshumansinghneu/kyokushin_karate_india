import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const content = await prisma.siteContent.findMany();
    console.log(JSON.stringify(content, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
