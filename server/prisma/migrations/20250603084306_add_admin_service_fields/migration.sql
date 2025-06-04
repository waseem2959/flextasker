-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "details" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "completedById" TEXT;

-- AlterTable
ALTER TABLE "Verification" ADD COLUMN     "processedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
