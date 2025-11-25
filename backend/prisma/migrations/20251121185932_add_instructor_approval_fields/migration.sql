-- AlterTable
ALTER TABLE "User" ADD COLUMN     "instructorApprovedAt" TIMESTAMP(3),
ADD COLUMN     "isInstructorApproved" BOOLEAN NOT NULL DEFAULT false;
