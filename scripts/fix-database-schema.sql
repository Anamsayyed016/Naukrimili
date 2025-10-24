-- Fix database schema issues
-- Add missing applicationData field to Application table

-- Add applicationData column to Application table
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "applicationData" JSONB;

-- Update any existing applications to have empty applicationData
UPDATE "Application" SET "applicationData" = '{}' WHERE "applicationData" IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS "Application_applicationData_idx" ON "Application" USING GIN ("applicationData");

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Application' 
AND column_name = 'applicationData';
