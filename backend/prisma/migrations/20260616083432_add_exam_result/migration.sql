-- CreateTable
CREATE TABLE "ExamResult" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "testDate" TIMESTAMP(3),
    "awardedDate" TIMESTAMP(3),
    "location" TEXT,
    "pdfUrl" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExamResult_isPublished_createdAt_idx" ON "ExamResult"("isPublished", "createdAt");

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
