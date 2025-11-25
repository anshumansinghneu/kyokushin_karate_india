-- AlterTable
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "countryCode" TEXT DEFAULT '+91',
    ADD COLUMN IF NOT EXISTS "fatherName" TEXT,
    ADD COLUMN IF NOT EXISTS "fatherPhone" TEXT;
-- Update country default for existing users
UPDATE "User"
SET "country" = 'India'
WHERE "country" IS NULL;
