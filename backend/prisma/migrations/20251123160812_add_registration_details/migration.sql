-- AlterTable
ALTER TABLE "Dojo" ADD COLUMN     "country" TEXT;

-- AlterTable
ALTER TABLE "EventRegistration" ADD COLUMN     "eventType" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "country" TEXT,
ADD COLUMN     "state" TEXT;
