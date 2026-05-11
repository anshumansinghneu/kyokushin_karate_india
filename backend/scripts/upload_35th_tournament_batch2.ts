/**
 * Batch 2 uploader: 35th All India Karate Tournament Uttrakhand 2025
 * Adds 10 more photos to the existing album.
 */
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const ALBUM_ID = '54a22356-c5ca-4f54-b730-3c07e8e55d24';
const ADMIN_ID = '6bde56a7-dd87-40cd-bd01-7180f4b3068b';
const RESIZED_DIR = '/tmp/kkfi-batch2';
const BUCKET = 'uploads';
const STORAGE_PREFIX = 'gallery/35th-all-india-uttrakhand-2025';

const PICKS: { file: string; caption: string }[] = [
  { file: 'DSC08526.JPG', caption: 'Felicitation under the 35th All India Full Contact Karate Tournament 2025 banner' },
  { file: 'DSC08905.JPG', caption: 'Jumping spinning kick in mid-air' },
  { file: 'DSC09241.JPG', caption: 'Fighters lock up in a tight clinch' },
  { file: 'DSC09494.JPG', caption: 'Medal pinning ceremony against the KKFI backdrop' },
  { file: 'DSC08801.JPG', caption: 'High kick clash between red and blue corners' },
  { file: 'DSC09149.JPG', caption: 'Simultaneous double-kick exchange under the referee’s call' },
  { file: 'DSC09291.JPG', caption: 'Powerful body strike in a women’s bout' },
  { file: 'DSC09480.JPG', caption: 'Junior medalists with the national flag' },
  { file: 'DSC09200.JPG', caption: 'Open-class kumite — punch exchange' },
  { file: 'DSC09464.JPG', caption: 'Boys’ podium — full medal lineup' },
];

const prisma = new PrismaClient();
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function uploadToSupabase(localPath: string, storageKey: string): Promise<string> {
  const buf = fs.readFileSync(localPath);
  const { error } = await supabase.storage.from(BUCKET).upload(storageKey, buf, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw new Error(`Supabase upload failed for ${storageKey}: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storageKey);
  return data.publicUrl;
}

async function main() {
  const album = await prisma.album.findUnique({ where: { id: ALBUM_ID } });
  if (!album) throw new Error('Album not found');
  console.log(`Adding to album: ${album.name}`);

  const existingCount = await prisma.albumPhoto.count({ where: { albumId: ALBUM_ID } });
  let orderIdx = existingCount;
  console.log(`Existing photos: ${existingCount}, next order index: ${orderIdx}`);

  for (let i = 0; i < PICKS.length; i++) {
    const pick = PICKS[i];
    const localPath = path.join(RESIZED_DIR, pick.file);
    if (!fs.existsSync(localPath)) {
      console.error(`  ! Missing: ${localPath}`);
      continue;
    }
    const storageKey = `${STORAGE_PREFIX}/${pick.file.toLowerCase()}`;
    console.log(`  [${i + 1}/${PICKS.length}] uploading ${pick.file}...`);
    const publicUrl = await uploadToSupabase(localPath, storageKey);

    const gallery = await prisma.gallery.create({
      data: {
        uploadedBy: ADMIN_ID,
        imageUrl: publicUrl,
        caption: pick.caption,
        isApproved: true,
        isPublicFeatured: false,
        approvedBy: ADMIN_ID,
        approvedAt: new Date(),
      },
    });

    await prisma.albumPhoto.create({
      data: { albumId: ALBUM_ID, galleryId: gallery.id, order: orderIdx++ },
    });
    console.log(`     -> ${publicUrl}`);
  }

  console.log(`\nDone. Album now has ${orderIdx} photos.`);
}

main()
  .catch((e) => {
    console.error('FATAL:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
