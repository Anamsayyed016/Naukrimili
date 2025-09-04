-- PostgreSQL Script to Remove Only OAuth Users
-- This script removes users who have OAuth accounts but no password

-- First, let's see what OAuth users we have
SELECT 
    u.id,
    u.name,
    u.email,
    u."createdAt",
    COUNT(a.id) as oauth_accounts
FROM "User" u
LEFT JOIN "Account" a ON u.id = a."userId"
WHERE u.password IS NULL 
  AND u.id IN (SELECT DISTINCT "userId" FROM "Account")
GROUP BY u.id, u.name, u.email, u."createdAt"
ORDER BY u."createdAt" DESC;

-- Delete OAuth users and their related data
-- Step 1: Delete job applications for OAuth users
DELETE FROM "JobApplication" 
WHERE "userId" IN (
    SELECT u.id 
    FROM "User" u 
    WHERE u.password IS NULL 
      AND u.id IN (SELECT DISTINCT "userId" FROM "Account")
);

-- Step 2: Delete jobs posted by OAuth users
DELETE FROM "Job" 
WHERE "userId" IN (
    SELECT u.id 
    FROM "User" u 
    WHERE u.password IS NULL 
      AND u.id IN (SELECT DISTINCT "userId" FROM "Account")
);

-- Step 3: Delete resumes uploaded by OAuth users
DELETE FROM "Resume" 
WHERE "userId" IN (
    SELECT u.id 
    FROM "User" u 
    WHERE u.password IS NULL 
      AND u.id IN (SELECT DISTINCT "userId" FROM "Account")
);

-- Step 4: Delete notifications for OAuth users
DELETE FROM "Notification" 
WHERE "userId" IN (
    SELECT u.id 
    FROM "User" u 
    WHERE u.password IS NULL 
      AND u.id IN (SELECT DISTINCT "userId" FROM "Account")
);

-- Step 5: Delete OAuth accounts
DELETE FROM "Account" 
WHERE "userId" IN (
    SELECT u.id 
    FROM "User" u 
    WHERE u.password IS NULL 
      AND u.id IN (SELECT DISTINCT "userId" FROM "Account")
);

-- Step 6: Delete OAuth users
DELETE FROM "User" 
WHERE password IS NULL 
  AND id IN (SELECT DISTINCT "userId" FROM "Account");

-- Verify cleanup
SELECT 
    'Remaining Users' as status,
    COUNT(*) as count
FROM "User"
UNION ALL
SELECT 
    'OAuth Accounts' as status,
    COUNT(*) as count
FROM "Account"
UNION ALL
SELECT 
    'Jobs' as status,
    COUNT(*) as count
FROM "Job"
UNION ALL
SELECT 
    'Applications' as status,
    COUNT(*) as count
FROM "JobApplication";
