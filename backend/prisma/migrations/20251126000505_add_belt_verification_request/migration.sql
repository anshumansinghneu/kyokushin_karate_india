-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('VERIFIED', 'PENDING_VERIFICATION', 'REJECTED');
-- AlterTable
ALTER TABLE "User"
ADD COLUMN "verificationStatus" "VerificationStatus" DEFAULT 'VERIFIED';
-- CreateTable
CREATE TABLE "BeltVerificationRequest" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "requestedBelt" TEXT NOT NULL,
    "examDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BeltVerificationRequest_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "BeltVerificationRequest_studentId_idx" ON "BeltVerificationRequest"("studentId");
-- CreateIndex
CREATE INDEX "BeltVerificationRequest_status_idx" ON "BeltVerificationRequest"("status");
-- AddForeignKey
ALTER TABLE "BeltVerificationRequest"
ADD CONSTRAINT "BeltVerificationRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "BeltVerificationRequest"
ADD CONSTRAINT "BeltVerificationRequest_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
