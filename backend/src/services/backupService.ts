/**
 * Scheduled Database Backup Service
 * Runs daily at 2 AM IST — dumps all PostgreSQL tables via Prisma
 * and stores compressed JSON in MongoDB.
 * Works on any hosting (Render, Railway, etc.) — no pg_dump needed.
 */

import cron from 'node-cron';
import { MongoClient, Binary } from 'mongodb';
import { gzipSync } from 'zlib';
import prisma from '../prisma';

const MONGO_URI = process.env.MONGODB_BACKUP_URI;

async function runBackup() {
    if (!MONGO_URI) {
        console.log('⏭️  Backup skipped — MONGODB_BACKUP_URI not configured');
        return;
    }

    const start = Date.now();
    console.log('🔄 Starting scheduled database backup...');

    try {
        // Dump all tables via Prisma
        const data: Record<string, any[]> = {};
        const tables = [
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
        ];

        let totalRows = 0;
        for (const table of tables) {
            data[table.name] = await table.query();
            totalRows += data[table.name].length;
        }

        const jsonStr = JSON.stringify(data);
        const originalSize = Buffer.byteLength(jsonStr);
        const compressed = gzipSync(Buffer.from(jsonStr), { level: 9 });
        const compressedSize = compressed.length;

        console.log(`   ${tables.length} tables, ${totalRows} rows, ${(compressedSize / 1024).toFixed(1)} KB compressed`);

        // Store in MongoDB
        const client = new MongoClient(MONGO_URI);
        try {
            await client.connect();
            const db = client.db();
            const collection = db.collection('backups');
            await collection.createIndex({ createdAt: 1 });

            await collection.insertOne({
                createdAt: new Date(),
                type: 'prisma_json',
                label: `backup_${new Date().toISOString().replace(/[:.]/g, '-')}`,
                totalRows,
                tableCount: tables.length,
                originalSizeBytes: originalSize,
                compressedSizeBytes: compressedSize,
                dump: new Binary(compressed),
            });

            // Keep only last 30 backups
            const count = await collection.countDocuments();
            if (count > 30) {
                const oldest = await collection.find().sort({ createdAt: 1 }).limit(count - 30).toArray();
                await collection.deleteMany({ _id: { $in: oldest.map(d => d._id) } });
                console.log(`   🧹 Cleaned ${oldest.length} old backup(s)`);
            }
        } finally {
            await client.close();
        }

        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`✅ Backup complete in ${elapsed}s`);
    } catch (error: any) {
        console.error('❌ Backup failed:', error.message);
    }
}

export function startBackupScheduler() {
    if (!MONGO_URI) {
        console.log('📦 Backup scheduler: MONGODB_BACKUP_URI not set — skipping');
        return;
    }

    // Every day at 2:00 AM IST (UTC 20:30 previous day)
    cron.schedule('30 20 * * *', () => {
        console.log('⏰ Scheduled backup triggered');
        runBackup();
    }, { timezone: 'Asia/Kolkata' });

    console.log('📦 Backup scheduler: Daily at 2:00 AM IST → MongoDB');

    // Also run once on server start (first backup)
    setTimeout(() => runBackup(), 10000);
}
