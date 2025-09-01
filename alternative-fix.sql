-- Alternative Fix Without Superuser Privileges
-- This approach tries to work with existing permissions

-- First, let's see what we can do with current user
SELECT current_user, session_user;

-- Try to grant privileges if we have them
-- Note: This will only work if current user has GRANT privileges

-- Grant table privileges to current user (if possible)
GRANT ALL PRIVILEGES ON TABLE "JobBookmark" TO current_user;
GRANT ALL PRIVILEGES ON TABLE "Job" TO current_user;
GRANT ALL PRIVILEGES ON TABLE "User" TO current_user;
GRANT ALL PRIVILEGES ON TABLE "Account" TO current_user;
GRANT ALL PRIVILEGES ON TABLE "Session" TO current_user;
GRANT ALL PRIVILEGES ON TABLE "VerificationToken" TO current_user;
GRANT ALL PRIVILEGES ON TABLE "Company" TO current_user;
GRANT ALL PRIVILEGES ON TABLE "Resume" TO current_user;
GRANT ALL PRIVILEGES ON TABLE "Application" TO current_user;
GRANT ALL PRIVILEGES ON TABLE "Message" TO current_user;
GRANT ALL PRIVILEGES ON TABLE "Category" TO current_user;
GRANT ALL PRIVILEGES ON TABLE "Settings" TO current_user;
GRANT ALL PRIVILEGES ON TABLE "StaticContent" TO current_user;

-- Grant schema privileges
GRANT ALL PRIVILEGES ON SCHEMA public TO current_user;

-- Grant sequence privileges
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO current_user;

-- If the above fails, we'll need to use a different approach
