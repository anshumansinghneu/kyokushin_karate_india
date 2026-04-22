import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Cleaning up demo/seed gallery data...\n");

    // Find demo albums (created by seed_demo_gallery.ts)
    const demoAlbums = await prisma.album.findMany({
        where: {
            OR: [
                { name: { startsWith: 'Demo Album' } },
                { coverImageUrl: { contains: 'images.unsplash.com' } },
            ],
        },
        select: { id: true, name: true },
    });

    console.log(`Found ${demoAlbums.length} demo album(s)`);

    // Find demo gallery photos (unsplash placeholder images)
    const demoPhotos = await prisma.gallery.findMany({
        where: { imageUrl: { contains: 'images.unsplash.com' } },
        select: { id: true, caption: true },
    });

    console.log(`Found ${demoPhotos.length} demo photo(s)\n`);

    if (demoAlbums.length === 0 && demoPhotos.length === 0) {
        console.log("Nothing to clean up!");
        return;
    }

    // Delete album-photo links for demo albums
    const albumIds = demoAlbums.map(a => a.id);
    const photoIds = demoPhotos.map(p => p.id);

    if (albumIds.length > 0) {
        const deletedLinks = await prisma.albumPhoto.deleteMany({
            where: { albumId: { in: albumIds } },
        });
        console.log(`Deleted ${deletedLinks.count} album-photo link(s)`);
    }

    // Also delete any album-photo links for demo photos in non-demo albums
    if (photoIds.length > 0) {
        const deletedPhotoLinks = await prisma.albumPhoto.deleteMany({
            where: { galleryId: { in: photoIds } },
        });
        console.log(`Deleted ${deletedPhotoLinks.count} orphan photo link(s)`);
    }

    // Delete demo albums
    if (albumIds.length > 0) {
        const deletedAlbums = await prisma.album.deleteMany({
            where: { id: { in: albumIds } },
        });
        console.log(`Deleted ${deletedAlbums.count} demo album(s)`);
    }

    // Delete demo gallery photos
    if (photoIds.length > 0) {
        const deletedPhotos = await prisma.gallery.deleteMany({
            where: { id: { in: photoIds } },
        });
        console.log(`Deleted ${deletedPhotos.count} demo photo(s)`);
    }

    console.log("\nDemo data cleanup complete!");
}

main()
    .catch((e) => {
        console.error("Cleanup failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
