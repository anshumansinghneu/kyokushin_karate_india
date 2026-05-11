/**
 * One-off uploader: 35th All India Karate Tournament Uttrakhand 2025 — batch 1
 *
 * - Creates Album if missing
 * - Uploads 10 selected resized photos to Supabase Storage (bucket: uploads)
 * - Creates Gallery rows with the Supabase public URL
 * - Links each Gallery row to the Album via AlbumPhoto
 * - Sets first photo as cover
 *
 * Run: cd backend && npx ts-node scripts/upload_35th_tournament_batch1.ts
 */
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const ALBUM_NAME = '35th All India Karate Tournament Uttrakhand 2025';
const ALBUM_DATE = new Date('2025-11-30T00:00:00.000Z');
const ADMIN_ID = '6bde56a7-dd87-40cd-bd01-7180f4b3068b'; // Vasant Kumar Singh
const RESIZED_DIR = '/tmp/kkfi-batch1';
const BUCKET = 'uploads';
const STORAGE_PREFIX = 'gallery/35th-all-india-uttrakhand-2025';

const PICKS: { file: string; caption: string }[] = [
  { file: 'DSC08527.JPG', caption: 'Award presentation at the 35th All India Full Contact Karate Tournament 2025' },
  { file: 'DSC08800.JPG', caption: 'High kick exchange during kumite' },
  { file: 'DSC08919.JPG', caption: 'Referee raises the winner’s hand' },
  { file: 'DSC09114.JPG', caption: 'Certificate presentation to a young karateka' },
  { file: 'DSC09257.JPG', caption: 'Female fighters face off before kumite' },
  { file: 'DSC09421.JPG', caption: 'Backstage — medal preparation' },
  { file: 'DSC08991.JPG', caption: 'Junior kumite — knee strike under referee’s call' },
  { file: 'DSC09493.JPG', caption: 'Medal ceremony — women’s podium' },
  { file: 'DSC09148.JPG', caption: 'Mid-flight kick during a heated bout' },
  { file: 'DSC09294.JPG', caption: 'Chief guests at the 30 November 2025 tournament, Dehradun' },
];

const prisma = new PrismaClient();
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}
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
  // 1. Find or create album
  let album = await prisma.album.findFirst({ where: { name: ALBUM_NAME } });
  if (!album) {
    album = await prisma.album.create({
      data: {
        name: ALBUM_NAME,
        description: '35th All India Full Contact Karate Tournament held on 30 November 2025 at Multi Purpose Hall, Parade Ground, Dehradun, Uttarakhand — organized by Kyokushin Karate Foundation of India.',
        type: 'TOURNAMENT',
        date: ALBUM_DATE,
        createdBy: ADMIN_ID,
      },
    });
    console.log(`Created album: ${album.id}`);
  } else {
    console.log(`Album already exists: ${album.id}`);
  }

  // 2. Determine next order index in the album
  const existingCount = await prisma.albumPhoto.count({ where: { albumId: album.id } });
  let orderIdx = existingCount;

  let firstImageUrl: string | null = null;

  for (let i = 0; i < PICKS.length; i++) {
    const pick = PICKS[i];
    const localPath = path.join(RESIZED_DIR, pick.file);
    if (!fs.existsSync(localPath)) {
      console.error(`  ! Missing resized file: ${localPath}`);
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
        isPublicFeatured: i === 0,
        approvedBy: ADMIN_ID,
        approvedAt: new Date(),
      },
    });

    await prisma.albumPhoto.create({
      data: { albumId: album.id, galleryId: gallery.id, order: orderIdx++ },
    });

    if (!firstImageUrl) firstImageUrl = publicUrl;
    console.log(`     -> ${publicUrl}`);
  }

  if (firstImageUrl && !album.coverImageUrl) {
    await prisma.album.update({ where: { id: album.id }, data: { coverImageUrl: firstImageUrl } });
    console.log(`  Cover set to first photo.`);
  }

  console.log(`\nDone. Album "${ALBUM_NAME}" now has ${orderIdx} photos.`);
}

main()
  .catch((e) => {
    console.error('FATAL:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
