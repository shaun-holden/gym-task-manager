-- AlterEnum
ALTER TYPE "EodItemType" ADD VALUE 'RATING';

-- AlterTable
ALTER TABLE "eod_submissions" ADD COLUMN "notes" TEXT,
ADD COLUMN "mood" INTEGER;
