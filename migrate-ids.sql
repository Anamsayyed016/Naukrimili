-- Migration script to convert integer IDs to UUID strings
-- First, add new UUID columns
ALTER TABLE "User" ADD COLUMN new_id UUID DEFAULT gen_random_uuid();
ALTER TABLE "Account" ADD COLUMN new_id UUID DEFAULT gen_random_uuid();
ALTER TABLE "Session" ADD COLUMN new_id UUID DEFAULT gen_random_uuid();
ALTER TABLE "VerificationToken" ADD COLUMN new_id UUID DEFAULT gen_random_uuid();
ALTER TABLE "JobBookmark" ADD COLUMN new_id UUID DEFAULT gen_random_uuid();
ALTER TABLE "Company" ADD COLUMN new_id UUID DEFAULT gen_random_uuid();
ALTER TABLE "Resume" ADD COLUMN new_id UUID DEFAULT gen_random_uuid();
ALTER TABLE "Application" ADD COLUMN new_id UUID DEFAULT gen_random_uuid();
ALTER TABLE "Message" ADD COLUMN new_id UUID DEFAULT gen_random_uuid();
ALTER TABLE "Category" ADD COLUMN new_id UUID DEFAULT gen_random_uuid();
ALTER TABLE "Settings" ADD COLUMN new_id UUID DEFAULT gen_random_uuid();
ALTER TABLE "Job" ADD COLUMN new_id UUID DEFAULT gen_random_uuid();

-- Update foreign key references to use new UUIDs
-- This is a simplified version - you'll need to handle the relationships properly
