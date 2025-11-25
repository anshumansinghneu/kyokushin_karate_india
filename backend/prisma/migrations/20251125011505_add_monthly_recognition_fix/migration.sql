-- CreateTable
CREATE TABLE "MonthlyRecognition" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "type" "UserRole" NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyRecognition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyRecognition_month_year_type_userId_key" ON "MonthlyRecognition"("month", "year", "type", "userId");

-- AddForeignKey
ALTER TABLE "MonthlyRecognition" ADD CONSTRAINT "MonthlyRecognition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
