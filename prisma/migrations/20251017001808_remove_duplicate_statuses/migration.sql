-- First, update any existing COMPLETED status to PASSED
UPDATE "TestCase" SET status = 'PASSED' WHERE status = 'COMPLETED';

-- Update any existing DEFECT_REPORTED status to FAILED
UPDATE "TestCase" SET status = 'FAILED' WHERE status = 'DEFECT_REPORTED';

-- Create new enum type without COMPLETED and DEFECT_REPORTED
CREATE TYPE "TestCaseStatus_new" AS ENUM ('NOT_EXECUTED', 'IN_PROGRESS', 'PASSED', 'FAILED');

-- Drop the default constraint first
ALTER TABLE "TestCase" ALTER COLUMN status DROP DEFAULT;

-- Alter the column to use the new enum type
ALTER TABLE "TestCase" ALTER COLUMN status TYPE "TestCaseStatus_new" USING (status::text::"TestCaseStatus_new");

-- Drop the old enum type
DROP TYPE "TestCaseStatus";

-- Rename the new enum type to the original name
ALTER TYPE "TestCaseStatus_new" RENAME TO "TestCaseStatus";

-- Re-add the default constraint
ALTER TABLE "TestCase" ALTER COLUMN status SET DEFAULT 'NOT_EXECUTED'::"TestCaseStatus";
