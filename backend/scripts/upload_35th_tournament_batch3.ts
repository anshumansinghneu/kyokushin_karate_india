/**
 * Batch 3 (final) uploader: 35th All India Karate Tournament Uttrakhand 2025
 * Adds the last 10 photos to the existing album.
 */
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const ALBUM_ID = '54a22356-c5ca-4f54-b730-3c07e8e55d24';
const ADMIN_ID = '6bde56a7-dd87-40cd-bd01-7180f4b3068b';
const RESIZED_DIR = '/tmp/kkfi-batch3';
const BUCKET = 'uploads';
const STORAGE_PREFIX = 'gallery/35th-all-india-uttrakhand-2025';

const PICKS: { file: string; caption: string }[] = [
  { file: 'DSC09147.JPG', caption: 'Plaque presentation under the 35th All India Full Contact Karate Tournament banner with Sosai Oyama portrait' },
  { file: 'DSC08594.JPG', caption: 'Young karateka in blue armor — moment of focus before the bout' },
  { file: 'DSC08541.JPG', caption: 'Chief referee raises the winner’s hand after a junior bout' },
  { file: 'DSC09290.JPG', caption: 'Women’s kumite — close-quarters elbow exchange' },
  { file: 'DSC09150.JPG', caption: 'Boys’ kumite — face-to-face guard before contact' },
  { file: 'DSC09269.JPG', caption: 'Women’s kumite — straight punch under the referee’s call' },
  { file: 'DSC09142.JPG', caption: 'Boys’ podium with chief guest in front of the KKFI backdrop' },
  { file: 'DSC08917.JPG', caption: 'Sportsmanship — junior fighters embrace after the bout' },
  { file: 'DSC09504.JPG', caption: 'Brown-belt heavyweight medalists at the podium' },
  { file: 'DSC09453.JPG', caption: 'Junior female medalists with the Indian flag' },
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
