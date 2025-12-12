import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Connecting to DB...");
    const user = await prisma.user.findUnique({
        where: { email: 'osu@kyokushin.in' }
    });

    if (!user) {
        console.log("No user found in DB.");
        return;
    }

    console.log(`Found user: ${user.email} (${user.id})`);

    console.log("Attempting to run getMe query logic...");

    try {
        const fullUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                dojo: true,
                beltHistory: {
                    orderBy: { promotionDate: 'desc' }
                },
                tournamentResults: {
                    include: { event: true }
                },
                registrations: {
                    include: { event: true },
                    orderBy: { registeredAt: 'desc' }
                }
            }
        });
        console.log("Query successful!");
        console.log("User data retrieved successfully");
        // Access a nested property to ensure it exists
        if (fullUser?.tournamentResults) {
            console.log(`Tournament Results: ${fullUser.tournamentResults.length}`);
        }
    } catch (error) {
        console.error("Query failed!");
        console.error(error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
