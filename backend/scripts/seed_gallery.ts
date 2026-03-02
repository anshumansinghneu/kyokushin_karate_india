/**
 * Seed Gallery Script
 *
 * Copies selected images from the /images directory to backend/src/uploads/gallery
 * and creates Gallery records in the database pointing to the local server.
 *
 * Usage: cd backend && npx ts-node scripts/seed_gallery.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

// Backend serves /uploads as static — images will be at /uploads/gallery/FILENAME.JPG
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const UPLOADS_DIR = path.join(__dirname, '..', 'src', 'uploads', 'gallery');

// ---------------------------------------------------------------------------
// Image selection — pick a nice variety from each folder
// ---------------------------------------------------------------------------

interface GalleryEntry {
  file: string;        // relative path from images/
  caption: string;
  category: 'training' | 'tournament' | 'seminar' | 'dojo' | 'general';
  featured: boolean;
  eventId?: string;
  dojoId?: string;
}

const ADMIN_ID = 'b89c9259-60a9-411c-8de7-bf5f2b05e437'; // Shihan Vasant Kumar Singh

// Events
const EVENT_ALL_INDIA = '23fa6339-52cd-4343-bb65-a90cd89a53db';
const EVENT_NATIONAL = '96256fcc-6779-4896-9965-f49eb4bdd561';
const EVENT_INTER_DOJO = '976ca1d8-3372-4322-8214-1555ca284d0a';

// Dojos
const DOJO_MAIN = '227bb6ed-cada-48a9-a07d-97b247ed964c';
const DOJO_GUWAHATI = '25faca9f-533e-44b8-8971-42b54958ad4a';
const DOJO_ALIPURDUAR = '690eb5b8-d512-41b6-9914-673387eb9562';
const DOJO_DEHRADUN = 'a5116891-fa5d-472b-860f-5bbd635f3302';

const DIR1 = 'drive-download-20260217T174826Z-1-001';
const DIR2 = 'drive-download-20260217T174826Z-1-002';
const DIR3 = 'drive-download-20260217T174826Z-1-003';

const entries: GalleryEntry[] = [
  // ── Featured / Hero images ──────────────────────────────────────────────
  { file: `${DIR1}/DSC08523.JPG`, caption: 'Kyokushin Karate — Spirit of Osu', category: 'general', featured: true },
  { file: `${DIR1}/DSC08530.JPG`, caption: 'Students in formation before training', category: 'training', featured: true },
  { file: `${DIR1}/DSC08553.JPG`, caption: 'Kata demonstration at the National Championship', category: 'tournament', featured: true, eventId: EVENT_NATIONAL },
  { file: `${DIR2}/DSC08524.JPG`, caption: 'Kumite bout — full contact sparring', category: 'tournament', featured: true, eventId: EVENT_ALL_INDIA },
  { file: `${DIR3}/DSC08526.JPG`, caption: 'Group photo after belt promotion ceremony', category: 'dojo', featured: true, dojoId: DOJO_MAIN },

  // ── Tournament — All India National ─────────────────────────────────────
  { file: `${DIR1}/DSC08534.JPG`, caption: 'Opening ceremony — All India National', category: 'tournament', featured: false, eventId: EVENT_ALL_INDIA },
  { file: `${DIR1}/DSC08541.JPG`, caption: 'Referee signalling ippon', category: 'tournament', featured: false, eventId: EVENT_ALL_INDIA },
  { file: `${DIR1}/DSC08549.JPG`, caption: 'Young fighters facing off', category: 'tournament', featured: false, eventId: EVENT_ALL_INDIA },
  { file: `${DIR1}/DSC08562.JPG`, caption: 'Medal ceremony — junior division', category: 'tournament', featured: false, eventId: EVENT_ALL_INDIA },
  { file: `${DIR1}/DSC08575.JPG`, caption: 'High kick during semi-final', category: 'tournament', featured: false, eventId: EVENT_ALL_INDIA },
  { file: `${DIR1}/DSC08582.JPG`, caption: 'Coaches corner between rounds', category: 'tournament', featured: false, eventId: EVENT_ALL_INDIA },
  { file: `${DIR1}/DSC08594.JPG`, caption: 'Final match — senior heavyweight division', category: 'tournament', featured: false, eventId: EVENT_ALL_INDIA },

  // ── Tournament — National Kyokushin Championship 2025 ───────────────────
  { file: `${DIR2}/DSC08536.JPG`, caption: 'Warm-up drills before the championship', category: 'tournament', featured: false, eventId: EVENT_NATIONAL },
  { file: `${DIR2}/DSC08545.JPG`, caption: 'Ura mawashi geri — spinning kick', category: 'tournament', featured: false, eventId: EVENT_NATIONAL },
  { file: `${DIR2}/DSC08558.JPG`, caption: 'Team kata performance', category: 'tournament', featured: false, eventId: EVENT_NATIONAL },
  { file: `${DIR2}/DSC08573.JPG`, caption: 'Block and counter combination', category: 'tournament', featured: false, eventId: EVENT_NATIONAL },
  { file: `${DIR2}/DSC08586.JPG`, caption: 'Victory celebration on the podium', category: 'tournament', featured: false, eventId: EVENT_NATIONAL },
  { file: `${DIR2}/DSC08596.JPG`, caption: 'Shihan presenting trophies', category: 'tournament', featured: false, eventId: EVENT_NATIONAL },

  // ── Tournament — Inter-Dojo Championship 2025 ──────────────────────────
  { file: `${DIR3}/DSC08531.JPG`, caption: 'Inter-Dojo opening lineup', category: 'tournament', featured: false, eventId: EVENT_INTER_DOJO },
  { file: `${DIR3}/DSC08548.JPG`, caption: 'Chudan mawashi geri to the body', category: 'tournament', featured: false, eventId: EVENT_INTER_DOJO },
  { file: `${DIR3}/DSC08564.JPG`, caption: 'Fighters bow before the match', category: 'tournament', featured: false, eventId: EVENT_INTER_DOJO },
  { file: `${DIR3}/DSC08577.JPG`, caption: 'Corner judge raising flag', category: 'tournament', featured: false, eventId: EVENT_INTER_DOJO },
  { file: `${DIR3}/DSC08589.JPG`, caption: 'Dramatic exchange in the final round', category: 'tournament', featured: false, eventId: EVENT_INTER_DOJO },

  // ── Training / Dojo Life ────────────────────────────────────────────────
  { file: `${DIR1}/DSC08601.JPG`, caption: 'Kihon practice — perfecting basics', category: 'training', featured: false, dojoId: DOJO_MAIN },
  { file: `${DIR1}/DSC08618.JPG`, caption: 'Push-up drills for conditioning', category: 'training', featured: false, dojoId: DOJO_MAIN },
  { file: `${DIR1}/DSC08633.JPG`, caption: 'Pad work — building striking power', category: 'training', featured: false, dojoId: DOJO_MAIN },
  { file: `${DIR1}/DSC08647.JPG`, caption: 'Sensei demonstrating technique', category: 'training', featured: false, dojoId: DOJO_GUWAHATI },
  { file: `${DIR1}/DSC08660.JPG`, caption: 'Stretching session after class', category: 'training', featured: false, dojoId: DOJO_GUWAHATI },
  { file: `${DIR1}/DSC08675.JPG`, caption: 'Sparring practice — controlled contact', category: 'training', featured: false, dojoId: DOJO_ALIPURDUAR },
  { file: `${DIR1}/DSC08694.JPG`, caption: 'Bag work — low kick repetitions', category: 'training', featured: false, dojoId: DOJO_ALIPURDUAR },
  { file: `${DIR1}/DSC08705.JPG`, caption: 'Kids class — learning discipline', category: 'training', featured: false, dojoId: DOJO_DEHRADUN },
  { file: `${DIR1}/DSC08720.JPG`, caption: 'Meditation and breathing exercises', category: 'training', featured: false, dojoId: DOJO_DEHRADUN },
  { file: `${DIR2}/DSC08607.JPG`, caption: 'Board breaking practice', category: 'training', featured: false, dojoId: DOJO_MAIN },

  // ── Seminar / Camp ──────────────────────────────────────────────────────
  { file: `${DIR2}/DSC08619.JPG`, caption: 'Summer training camp — outdoor session', category: 'seminar', featured: false },
  { file: `${DIR2}/DSC08635.JPG`, caption: 'Group kata at the seminar', category: 'seminar', featured: false },
  { file: `${DIR2}/DSC08649.JPG`, caption: 'Self-defense techniques workshop', category: 'seminar', featured: false },
  { file: `${DIR2}/DSC08661.JPG`, caption: 'Breathing and focus training', category: 'seminar', featured: false },

  // ── Dojo Life & Events ──────────────────────────────────────────────────
  { file: `${DIR3}/DSC08600.JPG`, caption: 'New white belts — first day at the dojo', category: 'dojo', featured: false, dojoId: DOJO_MAIN },
  { file: `${DIR3}/DSC08620.JPG`, caption: 'Belt promotion — earning the next rank', category: 'dojo', featured: false, dojoId: DOJO_MAIN },
  { file: `${DIR3}/DSC08634.JPG`, caption: 'Dojo group photo', category: 'dojo', featured: false, dojoId: DOJO_GUWAHATI },
  { file: `${DIR3}/DSC08650.JPG`, caption: 'Students training with Shihan', category: 'dojo', featured: false, dojoId: DOJO_DEHRADUN },
  { file: `${DIR3}/DSC08667.JPG`, caption: 'Annual dojo picnic', category: 'dojo', featured: false, dojoId: DOJO_ALIPURDUAR },

  // ── More general / variety ──────────────────────────────────────────────
  { file: `${DIR1}/DSC08738.JPG`, caption: 'Powerful mae geri — front kick', category: 'general', featured: false },
  { file: `${DIR1}/DSC08750.JPG`, caption: 'Traditional Kyokushin salute', category: 'general', featured: false },
  { file: `${DIR1}/DSC08766.JPG`, caption: 'Concentration before kata', category: 'general', featured: false },
  { file: `${DIR1}/DSC08784.JPG`, caption: 'The spirit of never giving up', category: 'general', featured: false },
  { file: `${DIR1}/DSC08807.JPG`, caption: 'Training under Shihan\'s guidance', category: 'general', featured: false },
  { file: `${DIR1}/DSC08835.JPG`, caption: 'Champions are made in the dojo', category: 'general', featured: false },
  { file: `${DIR1}/DSC08858.JPG`, caption: 'Respect and discipline — bowing in', category: 'general', featured: false },
  { file: `${DIR2}/DSC08674.JPG`, caption: 'Uchi uke — inside block practice', category: 'general', featured: false },
  { file: `${DIR2}/DSC08699.JPG`, caption: 'Makiwara training — toughening the fists', category: 'general', featured: false },
  { file: `${DIR2}/DSC08728.JPG`, caption: 'Line-up after a tough session', category: 'general', featured: false },
  { file: `${DIR3}/DSC08680.JPG`, caption: 'Young karateka showing fighting spirit', category: 'general', featured: false },
  { file: `${DIR3}/DSC08697.JPG`, caption: 'Kancho Memorial Day tribute', category: 'general', featured: false },
  { file: `${DIR3}/DSC08714.JPG`, caption: 'Sanchin kata — strength in stillness', category: 'general', featured: false },
  { file: `${DIR3}/DSC08737.JPG`, caption: 'End of class — Osu!', category: 'general', featured: false },
];

// ---------------------------------------------------------------------------

const IMAGES_ROOT = path.join(__dirname, '..', '..', 'images');

async function main() {
  // Ensure gallery uploads dir exists
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  console.log(`\n📸 Gallery Seeder — copying ${entries.length} images locally\n`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Uploads dir: ${UPLOADS_DIR}`);
  console.log(`Images root: ${IMAGES_ROOT}\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const localPath = path.join(IMAGES_ROOT, entry.file);
    const filename = path.basename(entry.file);

    if (!fs.existsSync(localPath)) {
      console.error(`  ❌ [${i + 1}/${entries.length}] File not found: ${entry.file}`);
      failCount++;
      continue;
    }

    const destPath = path.join(UPLOADS_DIR, filename);
    const imageUrl = `${BACKEND_URL}/uploads/gallery/${filename}`;

    try {
      // Copy file to local uploads
      console.log(`  📋 [${i + 1}/${entries.length}] Copying ${filename}...`);
      fs.copyFileSync(localPath, destPath);

      // Create gallery record in DB
      await prisma.gallery.create({
        data: {
          uploadedBy: ADMIN_ID,
          imageUrl,
          caption: entry.caption,
          eventId: entry.eventId || null,
          dojoId: entry.dojoId || null,
          isApproved: true,
          isPublicFeatured: entry.featured,
          approvedBy: ADMIN_ID,
          approvedAt: new Date(),
        },
      });

      console.log(`  ✅ [${i + 1}/${entries.length}] ${entry.caption}`);
      successCount++;
    } catch (err: any) {
      console.error(`  ❌ [${i + 1}/${entries.length}] Failed: ${err.message}`);
      failCount++;
    }
  }

  console.log(`\n────────────────────────────────────────`);
  console.log(`✅ Copied & saved: ${successCount}`);
  console.log(`❌ Failed:         ${failCount}`);
  console.log(`📊 Total:          ${entries.length}`);
  console.log(`────────────────────────────────────────\n`);
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
