-- Migration: Add Resume Builder Fields
-- This migration adds builder-specific fields to the existing Resume model

-- Add new columns to the Resume table
ALTER TABLE "Resume" ADD COLUMN "isBuilder" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Resume" ADD COLUMN "templateStyle" TEXT;
ALTER TABLE "Resume" ADD COLUMN "builderData" JSONB;
ALTER TABLE "Resume" ADD COLUMN "colorScheme" TEXT;

-- Add comments for documentation
COMMENT ON COLUMN "Resume"."isBuilder" IS 'Distinguish upload vs builder resumes';
COMMENT ON COLUMN "Resume"."templateStyle" IS 'For builder resumes (e.g., "modern", "classic", "creative")';
COMMENT ON COLUMN "Resume"."builderData" IS 'Builder-generated content structure';
COMMENT ON COLUMN "Resume"."colorScheme" IS 'Color theme for builder resumes';

-- Create index for builder resumes
CREATE INDEX "Resume_isBuilder_idx" ON "Resume"("isBuilder");
