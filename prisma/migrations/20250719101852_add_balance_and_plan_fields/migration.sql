-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'PRO', 'PREMIUM');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "balance" DECIMAL(18,6) NOT NULL DEFAULT 0,
ADD COLUMN     "creditsUsedToday" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "plan" "PlanType" NOT NULL DEFAULT 'FREE';
