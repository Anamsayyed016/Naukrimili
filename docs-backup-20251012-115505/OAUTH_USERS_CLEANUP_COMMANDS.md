# OAuth Users Cleanup Commands for PostgreSQL 🗑️

## Quick Commands to Remove Only OAuth Users

### **Option 1: Using Node.js Script (Recommended)**
```bash
# Run the OAuth users cleanup script
node scripts/clear-oauth-users.js
```

### **Option 2: Using PostgreSQL Directly**
```bash
# Connect to your PostgreSQL database
psql -U your_username -d your_database_name

# Run the SQL script
\i scripts/clear-oauth-users.sql
```

### **Option 3: Direct PostgreSQL Commands**
```bash
# Connect and run commands directly
psql -U your_username -d your_database_name -f scripts/clear-oauth-users.sql
```

## What This Does

### **Identifies OAuth Users:**
- Users with `password = NULL` (no password set)
- Users who have entries in the `Account` table (OAuth accounts)
- Preserves users with credentials (email/password login)

### **Removes OAuth User Data:**
- ✅ OAuth user accounts
- ✅ Jobs posted by OAuth users
- ✅ Job applications by OAuth users
- ✅ Resumes uploaded by OAuth users
- ✅ Notifications for OAuth users
- ✅ The OAuth users themselves

### **Preserves:**
- ✅ Users with email/password login
- ✅ System data and configurations
- ✅ Non-user related data

## Step-by-Step Commands

### **For Local Development:**
```bash
# 1. Navigate to project directory
cd /path/to/your/jobportal

# 2. Run OAuth cleanup
node scripts/clear-oauth-users.js
```

### **For Production Server:**
```bash
# 1. SSH into your server
ssh user@your-server.com

# 2. Navigate to project directory
cd /var/www/jobportal

# 3. Pull latest changes
git pull origin main

# 4. Run OAuth cleanup
node scripts/clear-oauth-users.js

# 5. Restart application
pm2 restart jobportal
```

### **Using PostgreSQL Directly:**
```bash
# 1. Connect to database
psql -U your_username -d your_database_name

# 2. Run the cleanup SQL
\i scripts/clear-oauth-users.sql

# 3. Exit database
\q
```

## PostgreSQL-Specific Commands

### **Check OAuth Users Before Cleanup:**
```sql
-- See what OAuth users exist
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
```

### **Manual OAuth User Deletion:**
```sql
-- Delete OAuth users manually
DELETE FROM "JobApplication" 
WHERE "userId" IN (
    SELECT u.id 
    FROM "User" u 
    WHERE u.password IS NULL 
      AND u.id IN (SELECT DISTINCT "userId" FROM "Account")
);

DELETE FROM "Job" 
WHERE "userId" IN (
    SELECT u.id 
    FROM "User" u 
    WHERE u.password IS NULL 
      AND u.id IN (SELECT DISTINCT "userId" FROM "Account")
);

DELETE FROM "Resume" 
WHERE "userId" IN (
    SELECT u.id 
    FROM "User" u 
    WHERE u.password IS NULL 
      AND u.id IN (SELECT DISTINCT "userId" FROM "Account")
);

DELETE FROM "Notification" 
WHERE "userId" IN (
    SELECT u.id 
    FROM "User" u 
    WHERE u.password IS NULL 
      AND u.id IN (SELECT DISTINCT "userId" FROM "Account")
);

DELETE FROM "Account" 
WHERE "userId" IN (
    SELECT u.id 
    FROM "User" u 
    WHERE u.password IS NULL 
      AND u.id IN (SELECT DISTINCT "userId" FROM "Account")
);

DELETE FROM "User" 
WHERE password IS NULL 
  AND id IN (SELECT DISTINCT "userId" FROM "Account");
```

## Verification Commands

### **Check What Was Removed:**
```sql
-- Count remaining users
SELECT 
    'Total Users' as type,
    COUNT(*) as count
FROM "User"
UNION ALL
SELECT 
    'OAuth Accounts' as type,
    COUNT(*) as count
FROM "Account"
UNION ALL
SELECT 
    'Users with Passwords' as type,
    COUNT(*) as count
FROM "User"
WHERE password IS NOT NULL;
```

### **Verify OAuth Users Are Gone:**
```sql
-- Should return 0 rows
SELECT COUNT(*) as oauth_users_remaining
FROM "User" u
WHERE u.password IS NULL 
  AND u.id IN (SELECT DISTINCT "userId" FROM "Account");
```

## Safety Features

### **Preview Before Deletion:**
The Node.js script shows you exactly which users will be deleted before proceeding.

### **5-Second Delay:**
The script waits 5 seconds before deletion, giving you time to cancel with Ctrl+C.

### **Detailed Logging:**
Shows exactly what's being deleted and any errors that occur.

## Environment Setup

Make sure your PostgreSQL connection is configured:

```bash
# In your .env file
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `node scripts/clear-oauth-users.js` | **Main OAuth cleanup command** |
| `psql -U user -d db -f scripts/clear-oauth-users.sql` | Direct SQL execution |
| `pm2 restart jobportal` | Restart application |

## Troubleshooting

### **If Script Fails:**
```bash
# Check database connection
node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.\$connect().then(() => {
  console.log('Database connected');
  prisma.\$disconnect();
}).catch(err => console.error('Connection failed:', err));
"
```

### **Manual Cleanup:**
```sql
-- If scripts fail, run these SQL commands manually
-- (Copy and paste into psql)
```

---

**⚠️ WARNING**: This will delete OAuth users and all their data. Make sure to backup important data first.

**✅ SAFE**: Only removes OAuth users, preserves credential-based users.
