-- DropIndex
DROP INDEX IF EXISTS "Payment_razorpayOrderId_key";
DROP INDEX IF EXISTS "Payment_razorpayOrderId_idx";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN IF EXISTS "razorpayOrderId",
                      DROP COLUMN IF EXISTS "razorpayPaymentId",
                      DROP COLUMN IF EXISTS "razorpaySignature";

ALTER TABLE "MerchOrder" DROP COLUMN IF EXISTS "razorpayOrderId",
                         DROP COLUMN IF EXISTS "razorpayPaymentId";
