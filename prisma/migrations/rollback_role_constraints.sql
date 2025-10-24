-- Rollback Migration: Remove role constraints
-- This migration removes the role constraints added in add_role_constraints.sql

-- Remove CHECK constraints
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_role_check";
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_lockedRole_check";
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_roleLocked_consistency_check";

-- Remove indexes
DROP INDEX IF EXISTS "User_role_idx";
DROP INDEX IF EXISTS "User_roleLocked_idx";
DROP INDEX IF EXISTS "User_lockedRole_idx";

-- Remove migration log
DELETE FROM "StaticContent" WHERE key = 'role_constraints_migration';
