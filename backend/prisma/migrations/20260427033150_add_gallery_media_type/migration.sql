-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- AlterTable
ALTER TABLE "Gallery" ADD COLUMN "mediaType" "MediaType" NOT NULL DEFAULT 'IMAGE',
                     ADD COLUMN "videoUrl" TEXT,
                     ADD COLUMN "videoProvider" TEXT,
                     ADD COLUMN "videoId" TEXT,
                     ADD COLUMN "duration" INTEGER;
