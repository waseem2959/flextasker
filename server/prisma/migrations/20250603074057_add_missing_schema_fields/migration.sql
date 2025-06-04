/*
  Warnings:

  - A unique constraint covering the columns `[provider,providerUserId]` on the table `OauthAccount` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `payerId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_receiverId_fkey";

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "resource" TEXT,
ADD COLUMN     "targetId" TEXT,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "contactUserId" TEXT;

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "isGroup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "taskId" TEXT;

-- AlterTable
ALTER TABLE "Export" ADD COLUMN     "dataType" TEXT,
ADD COLUMN     "filePath" TEXT;

-- AlterTable
ALTER TABLE "FeatureFlag" ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rules" JSONB,
ADD COLUMN     "type" TEXT;

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "processingError" TEXT,
ADD COLUMN     "processingMetadata" JSONB;

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "receiverId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "data" JSONB;

-- AlterTable
ALTER TABLE "NotificationPreference" ADD COLUMN     "types" JSONB;

-- AlterTable
ALTER TABLE "OauthAccount" ADD COLUMN     "providerUserId" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "gatewayResponse" JSONB,
ADD COLUMN     "gatewayTransactionId" TEXT,
ADD COLUMN     "payerId" TEXT NOT NULL,
ADD COLUMN     "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "processingFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "refundedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PaymentMethod" ADD COLUMN     "details" JSONB;

-- AlterTable
ALTER TABLE "PlatformRevenue" ADD COLUMN     "sourceId" TEXT;

-- AlterTable
ALTER TABLE "Refund" ADD COLUMN     "requestedById" TEXT;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "qualityRating" INTEGER,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerificationExpires" TIMESTAMP(3),
ADD COLUMN     "pendingBalance" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "resetPasswordExpires" TIMESTAMP(3),
ADD COLUMN     "zipCode" TEXT;

-- AlterTable
ALTER TABLE "UserDevice" ADD COLUMN     "deviceInfo" JSONB;

-- AlterTable
ALTER TABLE "Verification" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "OauthAccount_provider_providerUserId_key" ON "OauthAccount"("provider", "providerUserId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
