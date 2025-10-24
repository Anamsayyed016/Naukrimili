-- Safe Database Cleanup Script for Testing Real-time Notifications
-- This script removes test users and their related data safely

-- IMPORTANT: Run these commands carefully and in order
-- Make sure to backup your database first if you have important data

-- 1. First, check what users exist (for safety)
SELECT 
    id, 
    email, 
    name, 
    role, 
    "createdAt",
    "isActive"
FROM "User" 
ORDER BY "createdAt" DESC;

-- 2. Check notifications for these users
SELECT 
    u.email,
    n.type,
    n.title,
    n."createdAt"
FROM "Notification" n
JOIN "User" u ON n."userId" = u.id
ORDER BY n."createdAt" DESC;

-- 3. Check sessions and accounts
SELECT 
    u.email,
    a.provider,
    a."providerAccountId",
    s."expires"
FROM "User" u
LEFT JOIN "Account" a ON u.id = a."userId"
LEFT JOIN "Session" s ON u.id = s."userId"
ORDER BY u."createdAt" DESC;

-- 4. SAFE DELETION ORDER (run these in sequence)

-- Step 1: Delete notifications first (they reference users)
DELETE FROM "Notification" 
WHERE "userId" IN (
    SELECT id FROM "User" 
    WHERE email LIKE '%test%' 
    OR email LIKE '%example%'
    OR email LIKE '%gmail.com'
    OR email LIKE '%yahoo.com'
    OR email LIKE '%outlook.com'
    OR email LIKE '%hotmail.com'
    OR "createdAt" > '2025-01-01'  -- Adjust date as needed
);

-- Step 2: Delete sessions
DELETE FROM "Session" 
WHERE "userId" IN (
    SELECT id FROM "User" 
    WHERE email LIKE '%test%' 
    OR email LIKE '%example%'
    OR email LIKE '%gmail.com'
    OR email LIKE '%yahoo.com'
    OR email LIKE '%outlook.com'
    OR email LIKE '%hotmail.com'
    OR "createdAt" > '2025-01-01'
);

-- Step 3: Delete accounts (OAuth connections)
DELETE FROM "Account" 
WHERE "userId" IN (
    SELECT id FROM "User" 
    WHERE email LIKE '%test%' 
    OR email LIKE '%example%'
    OR email LIKE '%gmail.com'
    OR email LIKE '%yahoo.com'
    OR email LIKE '%outlook.com'
    OR email LIKE '%hotmail.com'
    OR "createdAt" > '2025-01-01'
);

-- Step 4: Delete applications (if any)
DELETE FROM "Application" 
WHERE "userId" IN (
    SELECT id FROM "User" 
    WHERE email LIKE '%test%' 
    OR email LIKE '%example%'
    OR email LIKE '%gmail.com'
    OR email LIKE '%yahoo.com'
    OR email LIKE '%outlook.com'
    OR email LIKE '%hotmail.com'
    OR "createdAt" > '2025-01-01'
);

-- Step 5: Delete bookmarks (if any)
DELETE FROM "Bookmark" 
WHERE "userId" IN (
    SELECT id FROM "User" 
    WHERE email LIKE '%test%' 
    OR email LIKE '%example%'
    OR email LIKE '%gmail.com'
    OR email LIKE '%yahoo.com'
    OR email LIKE '%outlook.com'
    OR email LIKE '%hotmail.com'
    OR "createdAt" > '2025-01-01'
);

-- Step 6: Delete resumes (if any)
DELETE FROM "Resume" 
WHERE "userId" IN (
    SELECT id FROM "User" 
    WHERE email LIKE '%test%' 
    OR email LIKE '%example%'
    OR email LIKE '%gmail.com'
    OR email LIKE '%yahoo.com'
    OR email LIKE '%outlook.com'
    OR email LIKE '%hotmail.com'
    OR "createdAt" > '2025-01-01'
);

-- Step 7: Finally, delete users
DELETE FROM "User" 
WHERE email LIKE '%test%' 
OR email LIKE '%example%'
OR email LIKE '%gmail.com'
OR email LIKE '%yahoo.com'
OR email LIKE '%outlook.com'
OR email LIKE '%hotmail.com'
OR "createdAt" > '2025-01-01';

-- 5. Verify cleanup
SELECT COUNT(*) as remaining_users FROM "User";
SELECT COUNT(*) as remaining_notifications FROM "Notification";
SELECT COUNT(*) as remaining_sessions FROM "Session";
SELECT COUNT(*) as remaining_accounts FROM "Account";

-- 6. Check for any orphaned data
SELECT 'Orphaned notifications' as issue, COUNT(*) as count
FROM "Notification" n
LEFT JOIN "User" u ON n."userId" = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 'Orphaned sessions' as issue, COUNT(*) as count
FROM "Session" s
LEFT JOIN "User" u ON s."userId" = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 'Orphaned accounts' as issue, COUNT(*) as count
FROM "Account" a
LEFT JOIN "User" u ON a."userId" = u.id
WHERE u.id IS NULL;
