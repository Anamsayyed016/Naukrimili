-- Fix User IDs to cuid format
-- This script updates existing user IDs to cuid format

-- First, let's see the current users
SELECT id, email, role FROM "User";

-- Update user IDs to cuid format
UPDATE "User" SET id = 'clx' || substr(md5(random()::text), 1, 24) WHERE id = '3';
UPDATE "User" SET id = 'clx' || substr(md5(random()::text), 1, 24) WHERE id = '4';
UPDATE "User" SET id = 'clx' || substr(md5(random()::text), 1, 24) WHERE id = '5';
UPDATE "User" SET id = 'clx' || substr(md5(random()::text), 1, 24) WHERE id = '6';
UPDATE "User" SET id = 'clx' || substr(md5(random()::text), 1, 24) WHERE id = '7';

-- Verify the changes
SELECT id, email, role FROM "User";
