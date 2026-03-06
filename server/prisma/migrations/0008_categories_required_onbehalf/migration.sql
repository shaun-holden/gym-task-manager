-- Add isRequired to EOD template items (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eod_template_items' AND column_name = 'is_required') THEN
    ALTER TABLE "eod_template_items" ADD COLUMN "is_required" BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add submittedById to EOD submissions (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eod_submissions' AND column_name = 'submitted_by_id') THEN
    ALTER TABLE "eod_submissions" ADD COLUMN "submitted_by_id" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'eod_submissions_submitted_by_id_fkey') THEN
    ALTER TABLE "eod_submissions" ADD CONSTRAINT "eod_submissions_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Convert task category from enum to text for custom categories
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TaskCategory') THEN
    ALTER TABLE "tasks" ALTER COLUMN "category" DROP DEFAULT;
    ALTER TABLE "tasks" ALTER COLUMN "category" TYPE TEXT USING "category"::TEXT;
    ALTER TABLE "tasks" ALTER COLUMN "category" SET DEFAULT 'OTHER';
    DROP TYPE "TaskCategory";
  END IF;
END $$;

-- Create task_categories table (idempotent)
CREATE TABLE IF NOT EXISTS "task_categories" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "name" TEXT NOT NULL,
  "organization_id" TEXT,
  "created_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "task_categories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "task_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "task_categories_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
