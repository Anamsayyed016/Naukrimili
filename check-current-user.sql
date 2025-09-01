-- Check Current User and Permissions
-- Run this with your current DATABASE_URL

-- Check current user
SELECT current_user, session_user;

-- Check if current user is superuser
SELECT current_setting('is_superuser');

-- Check database ownership
SELECT datname, datdba::regrole as owner 
FROM pg_database 
WHERE datname = current_database();

-- Check table ownership for problematic tables
SELECT schemaname, tablename, tableowner 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('JobBookmark', 'Job', 'User', 'Account', 'Session', 'VerificationToken', 'Company', 'Resume', 'Application', 'Message', 'Category', 'Settings', 'StaticContent')
ORDER BY tablename;

-- Check current user's privileges
SELECT 
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE grantee = current_user 
  AND table_schema = 'public'
  AND table_name IN ('JobBookmark', 'Job', 'User')
ORDER BY table_name, privilege_type;
