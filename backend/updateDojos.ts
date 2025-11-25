
import prisma from './src/prisma';

async function main() {
    console.log('Updating dojos...');
    await prisma.dojo.updateMany({
        data: {
            country: 'India',
            state: 'Maharashtra',
            city: 'Mumbai' // Ensure city is consistent
        }
    });
    console.log('Dojos updated.');

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
