/**
 * Scheduled Database Backup Service
 *
 * Runs daily at 2 AM IST — dumps every PostgreSQL table via Prisma, gzips it,
 * encrypts with AES-256-GCM, and uploads to Supabase Storage.
 *
 * Supabase is the primary destination because its credentials
 * (SUPABASE_URL / SUPABASE_SERVICE_KEY) are already provisioned for uploads.
 * MongoDB remains an OPTIONAL secondary destination: if MONGODB_BACKUP_URI is
 * set and reachable, a copy goes there too, but a Mongo failure no longer means
 * the backup is lost.
 *
 * History: backups silently failed for an extended period because the configured
 * Mongo cluster hostname stopped resolving and the only signal was a console
 * line. Two things prevent a repeat: Supabase is now the primary target, and any
 * total failure raises an email alert (see notifyBackupFailure).
 */

import cron from 'node-cron';
import crypto from 'crypto';
import { MongoClient, Binary } from 'mongodb';
import { createClient } from '@supabase/supabase-js';
import { gzipSync, gunzipSync } from 'zlib';
import prisma from '../prisma';
import { sendBackupFailureAlert } from './emailService';

const MONGO_URI = process.env.MONGODB_BACKUP_URI;
const ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const BACKUP_BUCKET = process.env.BACKUP_BUCKET || 'db-backups';
const RETAIN = Number(process.env.BACKUP_RETAIN || 30);

const supabaseEnabled = !!(SUPABASE_URL && SUPABASE_SERVICE_KEY);
const supabase = supabaseEnabled ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null;

// ── Crypto ──────────────────────────────────────────────────

/** Derive a 32-byte key from a passphrase of any length. */
function deriveKey(secret: string): Buffer {
    return crypto.createHash('sha256').update(secret).digest();
}

function encryptBuffer(data: Buffer, secret: string): { iv: Buffer; authTag: Buffer; encrypted: Buffer } {
    const key = deriveKey(secret);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    return { iv, authTag: cipher.getAuthTag(), encrypted };
}

export function decryptBuffer(encrypted: Buffer, iv: Buffer, authTag: Buffer, secret: string): Buffer {
    const key = deriveKey(secret);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

// ── Self-describing file format ─────────────────────────────
//
// A Storage object is a flat blob, so the IV and auth tag travel in a fixed
// header rather than in database columns. Without them an encrypted dump is
// unrecoverable, so they must never be stored separately from the ciphertext.
//
//   [0..8)   magic "KKFIBK01"
//   [8]      flags: 1 = encrypted, 0 = gzip only
//   [9..25)  iv       (zero-filled when unencrypted)
//   [25..41) authTag  (zero-filled when unencrypted)
//   [41..]   ciphertext, or gzip(json) when unencrypted

const MAGIC = Buffer.from('KKFIBK01', 'ascii');
const HEADER_LEN = 8 + 1 + 16 + 16;

export function packBackup(payload: Buffer, iv: Buffer | null, authTag: Buffer | null): Buffer {
    const header = Buffer.alloc(HEADER_LEN);
    MAGIC.copy(header, 0);
    header[8] = iv && authTag ? 1 : 0;
    if (iv && authTag) {
        iv.copy(header, 9);
        authTag.copy(header, 25);
    }
    return Buffer.concat([header, payload]);
}

/** Reverse of packBackup + decrypt + gunzip. Used by the restore path. */
export function unpackBackup(file: Buffer, secret?: string): Record<string, any[]> {
    if (file.length < HEADER_LEN || !file.subarray(0, 8).equals(MAGIC)) {
        throw new Error('Not a KKFI backup file (bad magic header)');
    }
    const encrypted = file[8] === 1;
    const body = file.subarray(HEADER_LEN);
    let compressed: Buffer;
    if (encrypted) {
        if (!secret) throw new Error('Backup is encrypted — BACKUP_ENCRYPTION_KEY is required to restore');
        compressed = decryptBuffer(body, file.subarray(9, 25), file.subarray(25, 41), secret);
    } else {
        compressed = body;
    }
    return JSON.parse(gunzipSync(compressed).toString('utf8'));
}

// ── Dump ────────────────────────────────────────────────────

/**
 * Every table in schema.prisma.
 *
 * Keep this list exhaustive. It previously covered 26 of 33 models, silently
 * omitting monthlyFee, attendanceRecord, examResult, album, albumPhoto,
 * eventFeedback and anonymousMessage — the fee ledger and attendance register
 * were absent from every "successful" backup.
 */
function tableSet() {
    return [
        { name: 'dojo', query: () => prisma.dojo.findMany() },
        { name: 'user', query: () => prisma.user.findMany() },
        { name: 'beltHistory', query: () => prisma.beltHistory.findMany() },
        { name: 'event', query: () => prisma.event.findMany() },
        { name: 'eventRegistration', query: () => prisma.eventRegistration.findMany() },
        { name: 'tournamentBracket', query: () => prisma.tournamentBracket.findMany() },
        { name: 'match', query: () => prisma.match.findMany() },
        { name: 'tournamentResult', query: () => prisma.tournamentResult.findMany() },
        { name: 'beltExamResult', query: () => prisma.beltExamResult.findMany() },
        { name: 'gallery', query: () => prisma.gallery.findMany() },
        { name: 'album', query: () => prisma.album.findMany() },
        { name: 'albumPhoto', query: () => prisma.albumPhoto.findMany() },
        { name: 'cashVoucher', query: () => prisma.cashVoucher.findMany() },
        { name: 'notification', query: () => prisma.notification.findMany() },
        { name: 'trainingSession', query: () => prisma.trainingSession.findMany() },
        { name: 'siteContent', query: () => prisma.siteContent.findMany() },
        { name: 'post', query: () => prisma.post.findMany() },
        { name: 'monthlyRecognition', query: () => prisma.monthlyRecognition.findMany() },
        { name: 'beltVerificationRequest', query: () => prisma.beltVerificationRequest.findMany() },
        { name: 'payment', query: () => prisma.payment.findMany() },
        { name: 'profileView', query: () => prisma.profileView.findMany() },
        { name: 'studentNote', query: () => prisma.studentNote.findMany() },
        { name: 'product', query: () => prisma.product.findMany() },
        { name: 'merchOrder', query: () => prisma.merchOrder.findMany() },
        { name: 'merchOrderItem', query: () => prisma.merchOrderItem.findMany() },
        { name: 'siteVisit', query: () => prisma.siteVisit.findMany() },
        { name: 'refreshToken', query: () => prisma.refreshToken.findMany() },
        { name: 'passwordResetToken', query: () => prisma.passwordResetToken.findMany() },
        { name: 'eventFeedback', query: () => prisma.eventFeedback.findMany() },
        { name: 'anonymousMessage', query: () => prisma.anonymousMessage.findMany() },
        { name: 'examResult', query: () => prisma.examResult.findMany() },
        { name: 'monthlyFee', query: () => prisma.monthlyFee.findMany() },
        { name: 'attendanceRecord', query: () => prisma.attendanceRecord.findMany() },
        // Implicit m2m join table: instructor↔dojo assignments live nowhere else.
        { name: '_InstructorDojos', query: () => prisma.$queryRawUnsafe('SELECT * FROM "_InstructorDojos"') },
    ];
}

interface DumpResult {
    data: Record<string, any[]>;
    totalRows: number;
    tableCount: number;
    failed: string[];
}

async function dumpDatabase(): Promise<DumpResult> {
    const tables = tableSet();
    const data: Record<string, any[]> = {};
    const failed: string[] = [];
    let totalRows = 0;

    for (const table of tables) {
        try {
            data[table.name] = (await table.query()) as any[];
            totalRows += data[table.name].length;
        } catch (err: any) {
            // Record the miss instead of quietly writing an empty array — an
            // empty table and an unreadable one must not look identical.
            console.warn(`   ⚠️  Table ${table.name} failed: ${err.message}`);
            failed.push(table.name);
            data[table.name] = [];
        }
    }
    return { data, totalRows, tableCount: tables.length, failed };
}

// ── Destinations ────────────────────────────────────────────

async function ensureBucket(): Promise<void> {
    if (!supabase) return;
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) throw new Error(`listBuckets: ${error.message}`);
    if (buckets?.some(b => b.name === BACKUP_BUCKET)) return;

    // Private bucket: these dumps contain every user record.
    const { error: createErr } = await supabase.storage.createBucket(BACKUP_BUCKET, { public: false });
    if (createErr) throw new Error(`createBucket: ${createErr.message}`);
    console.log(`   📦 Created private bucket "${BACKUP_BUCKET}"`);
}

async function uploadToSupabase(file: Buffer, label: string): Promise<string> {
    if (!supabase) throw new Error('Supabase not configured');
    await ensureBucket();
    const path = `${label}.kkfibk`;
    const { error } = await supabase.storage
        .from(BACKUP_BUCKET)
        .upload(path, file, { contentType: 'application/octet-stream', upsert: false });
    if (error) throw new Error(`upload: ${error.message}`);
    return path;
}

async function pruneSupabase(): Promise<number> {
    if (!supabase) return 0;
    const { data, error } = await supabase.storage
        .from(BACKUP_BUCKET)
        .list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } });
    if (error || !data) return 0;

    // Labels are ISO-derived, so lexical order equals chronological order.
    const objects = data.filter(o => o.name.endsWith('.kkfibk'));
    if (objects.length <= RETAIN) return 0;
    const stale = objects.slice(0, objects.length - RETAIN).map(o => o.name);
    const { error: rmErr } = await supabase.storage.from(BACKUP_BUCKET).remove(stale);
    return rmErr ? 0 : stale.length;
}

async function uploadToMongo(
    payload: Buffer,
    iv: Buffer | null,
    authTag: Buffer | null,
    meta: { totalRows: number; tableCount: number; originalSize: number; compressedSize: number; label: string }
): Promise<void> {
    if (!MONGO_URI) throw new Error('MONGODB_BACKUP_URI not set');
    const separator = MONGO_URI.includes('?') ? '&' : '?';
    const safeUri = MONGO_URI.includes('tlsInsecure') ? MONGO_URI : `${MONGO_URI}${separator}tlsInsecure=true`;
    const client = new MongoClient(safeUri, { serverSelectionTimeoutMS: 15000 });
    try {
        await client.connect();
        const collection = client.db().collection('backups');
        await collection.createIndex({ createdAt: 1 });
        await collection.insertOne({
            createdAt: new Date(),
            type: 'prisma_json',
            label: meta.label,
            totalRows: meta.totalRows,
            tableCount: meta.tableCount,
            originalSizeBytes: meta.originalSize,
            compressedSizeBytes: meta.compressedSize,
            encrypted: !!(iv && authTag),
            ...(iv && { iv: new Binary(iv) }),
            ...(authTag && { authTag: new Binary(authTag) }),
            dump: new Binary(payload),
        });
        const count = await collection.countDocuments();
        if (count > RETAIN) {
            const oldest = await collection.find().sort({ createdAt: 1 }).limit(count - RETAIN).toArray();
            await collection.deleteMany({ _id: { $in: oldest.map(d => d._id) } });
        }
    } finally {
        await client.close().catch(() => undefined);
    }
}

// ── Orchestration ───────────────────────────────────────────

export interface BackupOutcome {
    ok: boolean;
    label: string;
    totalRows: number;
    tableCount: number;
    compressedSize: number;
    encrypted: boolean;
    destinations: string[];
    errors: string[];
    failedTables: string[];
    elapsedSeconds: number;
}

export async function runBackup(): Promise<BackupOutcome> {
    const start = Date.now();
    const label = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const destinations: string[] = [];
    const errors: string[] = [];
    console.log('🔄 Starting scheduled database backup...');

    let totalRows = 0;
    let tableCount = 0;
    let failedTables: string[] = [];
    let compressedSize = 0;
    let encrypted = false;

    try {
        const dump = await dumpDatabase();
        totalRows = dump.totalRows;
        tableCount = dump.tableCount;
        failedTables = dump.failed;

        const jsonStr = JSON.stringify(dump.data);
        const originalSize = Buffer.byteLength(jsonStr);
        const compressed = gzipSync(Buffer.from(jsonStr), { level: 9 });
        compressedSize = compressed.length;

        // Widened to Buffer so the encrypted variant is assignable over the
        // NonSharedBuffer that gzipSync returns.
        let payload: Buffer = compressed;
        let iv: Buffer | null = null;
        let authTag: Buffer | null = null;
        if (ENCRYPTION_KEY) {
            const enc = encryptBuffer(compressed, ENCRYPTION_KEY);
            payload = enc.encrypted;
            iv = enc.iv;
            authTag = enc.authTag;
            encrypted = true;
        }
        console.log(
            `   ${tableCount} tables, ${totalRows} rows, ${(compressedSize / 1024).toFixed(1)} KB compressed` +
            (encrypted ? ', encrypted ✅' : ' (⚠️ unencrypted — set BACKUP_ENCRYPTION_KEY)')
        );

        // Primary: Supabase Storage.
        if (supabaseEnabled) {
            try {
                const path = await uploadToSupabase(packBackup(payload, iv, authTag), label);
                destinations.push(`supabase:${BACKUP_BUCKET}/${path}`);
                const pruned = await pruneSupabase();
                if (pruned) console.log(`   🧹 Pruned ${pruned} old backup object(s)`);
            } catch (err: any) {
                errors.push(`supabase: ${err.message}`);
                console.error(`   ❌ Supabase upload failed: ${err.message}`);
            }
        } else {
            errors.push('supabase: SUPABASE_URL / SUPABASE_SERVICE_KEY not configured');
        }

        // Secondary, best effort. Never fatal on its own.
        if (MONGO_URI) {
            try {
                await uploadToMongo(payload, iv, authTag, { totalRows, tableCount, originalSize, compressedSize, label });
                destinations.push('mongodb:backups');
            } catch (err: any) {
                errors.push(`mongodb: ${err.message}`);
                console.warn(`   ⚠️  MongoDB copy failed (secondary): ${err.message}`);
            }
        }
    } catch (err: any) {
        errors.push(`dump: ${err.message}`);
        console.error('❌ Backup dump failed:', err.message);
    }

    const elapsedSeconds = Number(((Date.now() - start) / 1000).toFixed(1));
    const ok = destinations.length > 0;

    const outcome: BackupOutcome = {
        ok, label, totalRows, tableCount, compressedSize,
        encrypted, destinations, errors, failedTables, elapsedSeconds,
    };

    if (ok) {
        console.log(`✅ Backup complete in ${elapsedSeconds}s → ${destinations.join(', ')}`);
        if (failedTables.length) {
            console.warn(`   ⚠️  ${failedTables.length} table(s) unreadable: ${failedTables.join(', ')}`);
        }
    } else {
        console.error(`❌ Backup FAILED — stored nowhere. ${errors.join(' | ')}`);
    }

    // A backup that lands nowhere, or that silently skips tables, must page a
    // human. This is the safeguard that was missing.
    if (!ok || failedTables.length > 0) {
        await notifyBackupFailure(outcome);
    }
    return outcome;
}

async function notifyBackupFailure(outcome: BackupOutcome) {
    try {
        await sendBackupFailureAlert(outcome);
    } catch (err: any) {
        console.error('   ❌ Could not send backup alert email:', err.message);
    }
}

export function startBackupScheduler() {
    if (!supabaseEnabled && !MONGO_URI) {
        console.log('📦 Backup scheduler: no destination configured (need SUPABASE_URL + SUPABASE_SERVICE_KEY) — skipping');
        return;
    }

    cron.schedule('0 2 * * *', () => {
        console.log('⏰ Scheduled backup triggered');
        runBackup();
    }, { timezone: 'Asia/Kolkata' });

    const primary = supabaseEnabled ? `Supabase Storage ("${BACKUP_BUCKET}")` : 'MongoDB';
    console.log(
        `📦 Backup scheduler: Daily at 2:00 AM IST → ${primary}` +
        (ENCRYPTION_KEY ? ' (encrypted)' : ' (⚠️ unencrypted)') +
        `, retaining ${RETAIN}`
    );

    setTimeout(() => runBackup(), 10000);
}
