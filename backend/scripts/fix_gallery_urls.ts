/**
 * Update gallery image URLs to use relative paths
 * so they're served from the frontend's public folder
 */
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

async function main() {
  const items = await prisma.gallery.findMany({ select: { id: true, imageUrl: true } });

  let updated = 0;
  for (const item of items) {
    const filename = item.imageUrl.split('/').pop();
    const newUrl = `/gallery/${filename}`;

    if (item.imageUrl !== newUrl) {
      await prisma.gallery.update({
        where: { id: item.id },
        data: { imageUrl: newUrl },
      });
      updated++;
    }
  }

  console.log(`Updated ${updated} / ${items.length} gallery URLs`);

  // Show a sample
  const sample = await prisma.gallery.findFirst({ select: { imageUrl: true, caption: true } });
  console.log('Sample:', sample);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
