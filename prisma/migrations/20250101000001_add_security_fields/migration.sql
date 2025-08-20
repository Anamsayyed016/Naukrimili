-- Add enhanced security fields for OAuth users and overall security
-- Migration: 20250101000001_add_security_fields

-- Add security fields to User table
ALTER TABLE "User" ADD COLUMN "securityPin" TEXT;
ALTER TABLE "User" ADD COLUMN "twoFactorEnabled" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN "twoFactorSecret" TEXT;
ALTER TABLE "User" ADD COLUMN "backupCodes" TEXT[] DEFAULT '{}';
ALTER TABLE "User" ADD COLUMN "loginAttempts" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lastLoginAttempt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "accountLocked" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN "lockoutUntil" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "passwordChangedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "lastPasswordReset" TIMESTAMP(3);

-- Create PasswordResetToken table
CREATE TABLE "PasswordResetToken" (
    "id" SERIAL PRIMARY KEY,
    "token" TEXT NOT NULL UNIQUE,
    "userId" INTEGER NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create SecurityLog table
CREATE TABLE "SecurityLog" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE INDEX "PasswordResetToken_expires_idx" ON "PasswordResetToken"("expires");

CREATE INDEX "SecurityLog_userId_idx" ON "SecurityLog"("userId");
CREATE INDEX "SecurityLog_action_idx" ON "SecurityLog"("action");
CREATE INDEX "SecurityLog_createdAt_idx" ON "SecurityLog"("createdAt");
CREATE INDEX "SecurityLog_success_idx" ON "SecurityLog"("success");

-- Add foreign key constraints
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SecurityLog" ADD CONSTRAINT "SecurityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add indexes for User security fields
CREATE INDEX "User_securityPin_idx" ON "User"("securityPin");
CREATE INDEX "User_twoFactorEnabled_idx" ON "User"("twoFactorEnabled");
CREATE INDEX "User_loginAttempts_idx" ON "User"("loginAttempts");
CREATE INDEX "User_accountLocked_idx" ON "User"("accountLocked");
CREATE INDEX "User_lockoutUntil_idx" ON "User"("lockoutUntil");
