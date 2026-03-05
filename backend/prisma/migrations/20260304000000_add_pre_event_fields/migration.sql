-- AlterTable
ALTER TABLE "Event"
ADD COLUMN "isPreEvent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event"
ADD COLUMN "assignedInstructorId" TEXT;
-- AddForeignKey
ALTER TABLE "Event"
ADD CONSTRAINT "Event_assignedInstructorId_fkey" FOREIGN KEY ("assignedInstructorId") REFERENCES "User"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
