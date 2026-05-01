import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KARATE_IMAGES = [
    "https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1580088031269-e70a59aeb78f?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1629851609386-77894aa1c1be?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1599058917212-97d1489115ba?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1000&auto=format&fit=crop"
];

async function main() {
    console.log("Starting mock gallery seed...");

    // Find first user to be the creator
    const user = await prisma.user.findFirst();
    if (!user) {
        console.log("No users found. Please create a user first.");
        return;
    }

    const types = ["CAMP", "SEMINAR", "TOURNAMENT", "TRAINING"];
    
    for (let i = 0; i < 6; i++) {
        const coverImg = KARATE_IMAGES[i % KARATE_IMAGES.length];
        
        // Create Album
        const album = await prisma.album.create({
            data: {
                name: `Demo Album ${i + 1}`,
                description: `A breathtaking collection of moments deeply embedded in Kyokushin spirit. Volume ${i + 1}`,
                coverImageUrl: coverImg,
                type: types[i % types.length] as any,
                createdBy: user.id,
                date: new Date(Date.now() - Math.random() * 10000000000),
                isPinned: i === 0,
            }
        });

        // Add some photos
        for (let j = 0; j < 5; j++) {
            const photoImg = KARATE_IMAGES[(i + j) % KARATE_IMAGES.length];
            const gallery = await prisma.gallery.create({
                data: {
                    uploadedBy: user.id,
                    imageUrl: photoImg,
                    isApproved: true,
                    isPublicFeatured: true,
                    caption: `Epic shot ${j + 1} from ${album.name}`
                }
            });

            await prisma.albumPhoto.create({
                data: {
                    albumId: album.id,
                    galleryId: gallery.id,
                    order: j
                }
            });
        }
        
        console.log(`Created Album: ${album.name} with 5 photos`);
    }

    console.log("Gallery seeded successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
