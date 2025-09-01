-- Fix Database Permissions Script
-- Run this as PostgreSQL superuser (postgres)

-- Replace 'your_db_user' with the actual username from your DATABASE_URL
-- Example: If DATABASE_URL="postgresql://jobportal_user:password@localhost:5432/jobportal"
-- Then replace 'your_db_user' with 'jobportal_user'

-- Grant ownership of all tables to your database user
ALTER TABLE "JobBookmark" OWNER TO your_db_user;
ALTER TABLE "Job" OWNER TO your_db_user;
ALTER TABLE "User" OWNER TO your_db_user;
ALTER TABLE "Account" OWNER TO your_db_user;
ALTER TABLE "Session" OWNER TO your_db_user;
ALTER TABLE "VerificationToken" OWNER TO your_db_user;
ALTER TABLE "Company" OWNER TO your_db_user;
ALTER TABLE "Resume" OWNER TO your_db_user;
ALTER TABLE "Application" OWNER TO your_db_user;
ALTER TABLE "Message" OWNER TO your_db_user;
ALTER TABLE "Category" OWNER TO your_db_user;
ALTER TABLE "Settings" OWNER TO your_db_user;
ALTER TABLE "StaticContent" OWNER TO your_db_user;

-- Grant all privileges on the database
GRANT ALL PRIVILEGES ON DATABASE jobportal TO your_db_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO your_db_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_db_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_db_user;

-- Make sure the user can create tables
ALTER USER your_db_user CREATEDB;
