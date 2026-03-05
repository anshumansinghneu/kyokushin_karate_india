/**
 * ═══════════════════════════════════════════════════════════
 *  KKFI Database Backup → MongoDB
 *  Dumps PostgreSQL and stores it compressed in MongoDB
 *
 *  Usage:  cd backend && npx tsx scripts/backup_to_mongo.ts
 *
 *  Env required in backend/.env:
 *    MONGODB_BACKUP_URI=mongodb+srv://user:pass@cluster.mongodb.net/kkfi_backups
 *    DIRECT_URL=postgresql://...  (already exists)
 * ═══════════════════════════════════════════════════════════
 */

import 'dotenv/config';
import { execSync } from 'child_process';
import { MongoClient, Binary } from 'mongodb';
import { gzipSync, gunzipSync } from 'zlib';

const MONGO_URI = process.env.MONGODB_BACKUP_URI;
const DIRECT_URL = process.env.DIRECT_URL;
const PG_DUMP_PATH = process.env.PG_DUMP_PATH || '/opt/homebrew/opt/libpq/bin/pg_dump';

if (!MONGO_URI) {
    console.error('❌ MONGODB_BACKUP_URI not set in .env');
    process.exit(1);
}
if (!DIRECT_URL) {
    console.error('❌ DIRECT_URL not set in .env');
    process.exit(1);
}

async function backup() {
    const start = Date.now();
    console.log('🔄 Running pg_dump...');

    // Run pg_dump
    const sqlDump = execSync(
        `"${PG_DUMP_PATH}" "${DIRECT_URL}" --no-owner --no-privileges --clean --if-exists`,
        { maxBuffer: 100 * 1024 * 1024 } // 100 MB max
    );

    const originalSize = sqlDump.length;
    console.log(`   SQL dump: ${(originalSize / 1024).toFixed(1)} KB`);

    // Compress
    const compressed = gzipSync(sqlDump, { level: 9 });
    const compressedSize = compressed.length;
    console.log(`   Compressed: ${(compressedSize / 1024).toFixed(1)} KB (${((1 - compressedSize / originalSize) * 100).toFixed(0)}% smaller)`);

    // Connect to MongoDB
    console.log('🔄 Uploading to MongoDB...');
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db(); // uses DB name from URI
        const collection = db.collection('backups');

        // Ensure index for cleanup
        await collection.createIndex({ createdAt: 1 });

        const doc = {
            createdAt: new Date(),
            label: `backup_${new Date().toISOString().replace(/[:.]/g, '-')}`,
            originalSizeBytes: originalSize,
            compressedSizeBytes: compressedSize,
            dump: new Binary(compressed),
        };

        const result = await collection.insertOne(doc);
        console.log(`✅ Backup stored in MongoDB (id: ${result.insertedId})`);

        // Keep only last 30 backups
        const count = await collection.countDocuments();
        if (count > 30) {
            const oldest = await collection
                .find()
                .sort({ createdAt: 1 })
                .limit(count - 30)
                .toArray();
            const idsToDelete = oldest.map(d => d._id);
            await collection.deleteMany({ _id: { $in: idsToDelete } });
            console.log(`🧹 Cleaned ${idsToDelete.length} old backup(s), keeping last 30`);
        }

        // List recent backups
        const recent = await collection
            .find({}, { projection: { label: 1, createdAt: 1, compressedSizeBytes: 1 } })
            .sort({ createdAt: -1 })
            .limit(5)
            .toArray();
        console.log('\n📦 Recent backups in MongoDB:');
        recent.forEach(b => {
            console.log(`   ${b.createdAt.toISOString().slice(0, 19)} — ${(b.compressedSizeBytes / 1024).toFixed(1)} KB`);
        });

    } finally {
        await client.close();
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\n✅ Done in ${elapsed}s`);
}

// ── Restore helper (run with: npx tsx scripts/backup_to_mongo.ts restore) ──
async function restore(backupIndex = 0) {
    if (!MONGO_URI) process.exit(1);

    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db();
        const collection = db.collection('backups');

        if (process.argv[3] === 'list') {
            const all = await collection
                .find({}, { projection: { label: 1, createdAt: 1, compressedSizeBytes: 1 } })
                .sort({ createdAt: -1 })
                .limit(10)
                .toArray();
            console.log('📦 Available backups (newest first):');
            all.forEach((b, i) => {
                console.log(`   [${i}] ${b.createdAt.toISOString().slice(0, 19)} — ${(b.compressedSizeBytes / 1024).toFixed(1)} KB — ${b.label}`);
            });
            return;
        }

        const idx = process.argv[3] ? parseInt(process.argv[3], 10) : 0;
        const backups = await collection
            .find()
            .sort({ createdAt: -1 })
            .skip(idx)
            .limit(1)
            .toArray();

        if (backups.length === 0) {
            console.error('❌ No backup found at that index');
            return;
        }

        const backup = backups[0];
        console.log(`🔄 Restoring backup from ${backup.createdAt.toISOString().slice(0, 19)}...`);

        // Decompress
        const sql = gunzipSync(backup.dump.buffer);
        console.log(`   Decompressed: ${(sql.length / 1024).toFixed(1)} KB`);

        // Write to temp file and restore via psql
        const tmpFile = '/tmp/kkfi_restore.sql';
        require('fs').writeFileSync(tmpFile, sql);

        const psqlPath = process.env.PSQL_PATH || '/opt/homebrew/opt/libpq/bin/psql';
        execSync(`"${psqlPath}" "${DIRECT_URL}" < "${tmpFile}" 2>&1 | tail -3`, { stdio: 'inherit' });
        require('fs').unlinkSync(tmpFile);

        console.log('✅ Database restored!');
    } finally {
        await client.close();
    }
}

// ── Entry point ──
const command = process.argv[2];
if (command === 'restore') {
    restore().catch(e => { console.error('❌', e.message); process.exit(1); });
} else {
    backup().catch(e => { console.error('❌', e.message); process.exit(1); });
}
