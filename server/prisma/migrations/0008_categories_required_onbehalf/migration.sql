-- Add isRequired to EOD template items
ALTER TABLE "eod_template_items" ADD COLUMN "is_required" BOOLEAN NOT NULL DEFAULT false;

-- Add submittedById to EOD submissions (for on-behalf submissions)
ALTER TABLE "eod_submissions" ADD COLUMN "submitted_by_id" UUID;
ALTER TABLE "eod_submissions" ADD CONSTRAINT "eod_submissions_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Convert task category from enum to text for custom categories
ALTER TABLE "tasks" ALTER COLUMN "category" TYPE TEXT USING "category"::TEXT;
ALTER TABLE "tasks" ALTER COLUMN "category" SET DEFAULT 'OTHER';
DROP TYPE "TaskCategory";

-- Create task_categories table
CREATE TABLE "task_categories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "organization_id" UUID,
  "created_by_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "task_categories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "task_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "task_categories_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
