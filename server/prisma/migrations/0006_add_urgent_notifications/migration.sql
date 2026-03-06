-- Add URGENT to NotificationType enum
ALTER TYPE "NotificationType" ADD VALUE 'URGENT';

-- Add acknowledged_at column for urgent notification acknowledgement
ALTER TABLE "notifications" ADD COLUMN "acknowledged_at" TIMESTAMP(3);
