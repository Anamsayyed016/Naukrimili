-- Manual Migration for Primary Key Changes
-- Run this as PostgreSQL superuser

-- Step 1: Add new columns with cuid() type
ALTER TABLE "JobBookmark" ADD COLUMN new_id TEXT;
ALTER TABLE "Job" ADD COLUMN new_id TEXT;
ALTER TABLE "User" ADD COLUMN new_id TEXT;
ALTER TABLE "Account" ADD COLUMN new_id TEXT;
ALTER TABLE "Session" ADD COLUMN new_id TEXT;
ALTER TABLE "VerificationToken" ADD COLUMN new_id TEXT;
ALTER TABLE "Company" ADD COLUMN new_id TEXT;
ALTER TABLE "Resume" ADD COLUMN new_id TEXT;
ALTER TABLE "Application" ADD COLUMN new_id TEXT;
ALTER TABLE "Message" ADD COLUMN new_id TEXT;
ALTER TABLE "Category" ADD COLUMN new_id TEXT;
ALTER TABLE "Settings" ADD COLUMN new_id TEXT;
ALTER TABLE "StaticContent" ADD COLUMN new_id TEXT;

-- Step 2: Generate cuid() values for existing records
-- You'll need to run this for each table with actual cuid() values
-- Example for JobBookmark:
-- UPDATE "JobBookmark" SET new_id = 'clx1234567890abcdef' WHERE id = 1;

-- Step 3: Drop foreign key constraints
ALTER TABLE "JobBookmark" DROP CONSTRAINT IF EXISTS "JobBookmark_userId_fkey";
ALTER TABLE "JobBookmark" DROP CONSTRAINT IF EXISTS "JobBookmark_jobId_fkey";
-- Add similar lines for other foreign key constraints

-- Step 4: Drop primary key constraints
ALTER TABLE "JobBookmark" DROP CONSTRAINT "JobBookmark_pkey";
ALTER TABLE "Job" DROP CONSTRAINT "Job_pkey";
ALTER TABLE "User" DROP CONSTRAINT "User_pkey";
-- Continue for all tables

-- Step 5: Rename columns
ALTER TABLE "JobBookmark" DROP COLUMN id;
ALTER TABLE "JobBookmark" RENAME COLUMN new_id TO id;
-- Continue for all tables

-- Step 6: Add new primary key constraints
ALTER TABLE "JobBookmark" ADD CONSTRAINT "JobBookmark_pkey" PRIMARY KEY (id);
ALTER TABLE "Job" ADD CONSTRAINT "Job_pkey" PRIMARY KEY (id);
ALTER TABLE "User" ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);
-- Continue for all tables

-- Step 7: Recreate foreign key constraints with new column types
-- This will be done by Prisma after the migration
