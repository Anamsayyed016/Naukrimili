-- Add enhanced security fields for OAuth users and overall security
-- Migration: 20250101000001_add_security_fields

-- Check if User table exists before adding columns
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'User') THEN
    -- Add security fields to User table (only if table exists)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'securityPin') THEN
      ALTER TABLE "User" ADD COLUMN "securityPin" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'twoFactorEnabled') THEN
      ALTER TABLE "User" ADD COLUMN "twoFactorEnabled" BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'twoFactorSecret') THEN
      ALTER TABLE "User" ADD COLUMN "twoFactorSecret" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'backupCodes') THEN
      ALTER TABLE "User" ADD COLUMN "backupCodes" TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'loginAttempts') THEN
      ALTER TABLE "User" ADD COLUMN "loginAttempts" INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'lastLoginAttempt') THEN
      ALTER TABLE "User" ADD COLUMN "lastLoginAttempt" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'accountLocked') THEN
      ALTER TABLE "User" ADD COLUMN "accountLocked" BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'lockoutUntil') THEN
      ALTER TABLE "User" ADD COLUMN "lockoutUntil" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'passwordChangedAt') THEN
      ALTER TABLE "User" ADD COLUMN "passwordChangedAt" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'lastPasswordReset') THEN
      ALTER TABLE "User" ADD COLUMN "lastPasswordReset" TIMESTAMP(3);
    END IF;
  ELSE
    RAISE NOTICE 'User table does not exist. Skipping security fields addition.';
  END IF;
END $$;

-- Create PasswordResetToken table (only if it doesn't exist and User table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'User') THEN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'PasswordResetToken') THEN
      CREATE TABLE "PasswordResetToken" (
          "id" TEXT PRIMARY KEY,
          "token" TEXT NOT NULL UNIQUE,
          "userId" TEXT NOT NULL,
          "expires" TIMESTAMP(3) NOT NULL,
          "used" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Add indexes for performance
      CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");
      CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
      CREATE INDEX "PasswordResetToken_expires_idx" ON "PasswordResetToken"("expires");
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'SecurityLog') THEN
      CREATE TABLE "SecurityLog" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "action" TEXT NOT NULL,
          "ipAddress" TEXT,
          "userAgent" TEXT,
          "success" BOOLEAN NOT NULL,
          "details" JSONB,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX "SecurityLog_userId_idx" ON "SecurityLog"("userId");
      CREATE INDEX "SecurityLog_action_idx" ON "SecurityLog"("action");
      CREATE INDEX "SecurityLog_createdAt_idx" ON "SecurityLog"("createdAt");
      CREATE INDEX "SecurityLog_success_idx" ON "SecurityLog"("success");
    END IF;
  END IF;
END $$;

-- Add foreign key constraints (only if User table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'User') THEN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'PasswordResetToken') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PasswordResetToken_userId_fkey') THEN
        ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'SecurityLog') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SecurityLog_userId_fkey') THEN
        ALTER TABLE "SecurityLog" ADD CONSTRAINT "SecurityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END IF;
  END IF;
END $$;

-- Add indexes for User security fields (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'User') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'User_securityPin_idx') THEN
      CREATE INDEX "User_securityPin_idx" ON "User"("securityPin");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'User_twoFactorEnabled_idx') THEN
      CREATE INDEX "User_twoFactorEnabled_idx" ON "User"("twoFactorEnabled");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'User_loginAttempts_idx') THEN
      CREATE INDEX "User_loginAttempts_idx" ON "User"("loginAttempts");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'User_accountLocked_idx') THEN
      CREATE INDEX "User_accountLocked_idx" ON "User"("accountLocked");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'User_lockoutUntil_idx') THEN
      CREATE INDEX "User_lockoutUntil_idx" ON "User"("lockoutUntil");
    END IF;
  END IF;
END $$;
