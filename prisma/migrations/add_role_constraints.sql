-- Migration: Add role constraints and enforce role validity
-- This migration adds CHECK constraints to ensure only valid roles are allowed

-- Add CHECK constraint to enforce valid roles only
ALTER TABLE "User" 
ADD CONSTRAINT "User_role_check" 
CHECK (role IS NULL OR role IN ('jobseeker', 'employer', 'admin'));

-- Add CHECK constraint to enforce valid locked roles only  
ALTER TABLE "User"
ADD CONSTRAINT "User_lockedRole_check"
CHECK (lockedRole IS NULL OR lockedRole IN ('jobseeker', 'employer', 'admin'));

-- Ensure roleLocked is only true when lockedRole is set
ALTER TABLE "User"
ADD CONSTRAINT "User_roleLocked_consistency_check"
CHECK (roleLocked = false OR (roleLocked = true AND lockedRole IS NOT NULL));

-- Add index for better performance on role queries
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_roleLocked_idx" ON "User"("roleLocked");
CREATE INDEX IF NOT EXISTS "User_lockedRole_idx" ON "User"("lockedRole");

-- Update existing users with invalid roles to NULL (they'll need to re-select)
UPDATE "User" 
SET role = NULL 
WHERE role IS NOT NULL 
  AND role NOT IN ('jobseeker', 'employer', 'admin');

-- Log the migration
INSERT INTO "StaticContent" (key, title, content, "isActive", "createdAt", "updatedAt")
VALUES (
  'role_constraints_migration', 
  'Role Constraints Migration Applied', 
  'Database migration applied to enforce role validity constraints. Users with invalid roles have been reset to NULL and must re-select their role.',
  true,
  NOW(),
  NOW()
) ON CONFLICT (key) DO UPDATE SET
  content = EXCLUDED.content,
  "updatedAt" = NOW();
