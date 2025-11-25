import prisma from './prisma';

async function runMigration() {
    try {
        console.log('🔄 Checking for schema updates...');

        // Try to add new columns if they don't exist
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "User"
            ADD COLUMN IF NOT EXISTS "countryCode" TEXT DEFAULT '+91';
        `);

        await prisma.$executeRawUnsafe(`
            ALTER TABLE "User"
            ADD COLUMN IF NOT EXISTS "fatherName" TEXT;
        `);

        await prisma.$executeRawUnsafe(`
            ALTER TABLE "User"
            ADD COLUMN IF NOT EXISTS "fatherPhone" TEXT;
        `);

        console.log('✅ Schema migration completed successfully');
    } catch (error) {
        console.error('❌ Migration error:', error);
        // Don't throw - let the app start anyway
    }
}

export default runMigration;
