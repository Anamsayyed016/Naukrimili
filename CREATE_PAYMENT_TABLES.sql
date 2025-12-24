-- Razorpay Payment Integration Tables
-- Run this script on your PostgreSQL database to create the payment tables

-- Create Payment table
CREATE TABLE IF NOT EXISTS "public"."Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "razorpayOrderId" TEXT NOT NULL UNIQUE,
    "razorpayPaymentId" TEXT UNIQUE,
    "razorpaySignature" TEXT,
    "planType" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT,
    "failureReason" TEXT,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Payment_userId_idx" ON "public"."Payment"("userId");
CREATE INDEX IF NOT EXISTS "Payment_razorpayOrderId_idx" ON "public"."Payment"("razorpayOrderId");
CREATE INDEX IF NOT EXISTS "Payment_razorpayPaymentId_idx" ON "public"."Payment"("razorpayPaymentId");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "public"."Payment"("status");
CREATE INDEX IF NOT EXISTS "Payment_createdAt_idx" ON "public"."Payment"("createdAt");

-- Create Subscription table
CREATE TABLE IF NOT EXISTS "public"."Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "paymentId" TEXT NOT NULL UNIQUE,
    "razorpaySubscriptionId" TEXT NOT NULL UNIQUE,
    "razorpayPlanId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "currentStart" TIMESTAMP(3) NOT NULL,
    "currentEnd" TIMESTAMP(3) NOT NULL,
    "billingCycle" TEXT NOT NULL,
    "totalCredits" INTEGER NOT NULL DEFAULT 0,
    "usedCredits" INTEGER NOT NULL DEFAULT 0,
    "remainingCredits" INTEGER NOT NULL DEFAULT 0,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "cancelledAt" TIMESTAMP(3),
    "cancelledReason" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE,
    CONSTRAINT "Subscription_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Subscription_userId_idx" ON "public"."Subscription"("userId");
CREATE INDEX IF NOT EXISTS "Subscription_razorpaySubscriptionId_idx" ON "public"."Subscription"("razorpaySubscriptionId");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "public"."Subscription"("status");
CREATE INDEX IF NOT EXISTS "Subscription_expiresAt_idx" ON "public"."Subscription"("expiresAt");

-- Create UserCredits table
CREATE TABLE IF NOT EXISTS "public"."UserCredits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "resumeDownloads" INTEGER NOT NULL DEFAULT 0,
    "resumeDownloadsLimit" INTEGER NOT NULL DEFAULT 0,
    "aiResumeUsage" INTEGER NOT NULL DEFAULT 0,
    "aiResumeLimit" INTEGER NOT NULL DEFAULT 0,
    "aiCoverLetterUsage" INTEGER NOT NULL DEFAULT 0,
    "aiCoverLetterLimit" INTEGER NOT NULL DEFAULT 0,
    "templateAccess" TEXT NOT NULL DEFAULT 'free',
    "atsOptimization" BOOLEAN NOT NULL DEFAULT false,
    "pdfDownloads" INTEGER NOT NULL DEFAULT 0,
    "pdfDownloadsLimit" INTEGER NOT NULL DEFAULT 0,
    "docxDownloads" INTEGER NOT NULL DEFAULT 0,
    "docxDownloadsLimit" INTEGER NOT NULL DEFAULT 0,
    "validUntil" TIMESTAMP(3),
    "planType" TEXT,
    "planName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserCredits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "UserCredits_userId_idx" ON "public"."UserCredits"("userId");
CREATE INDEX IF NOT EXISTS "UserCredits_validUntil_idx" ON "public"."UserCredits"("validUntil");
CREATE INDEX IF NOT EXISTS "UserCredits_isActive_idx" ON "public"."UserCredits"("isActive");

-- Create CreditTransaction table
CREATE TABLE IF NOT EXISTS "public"."CreditTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditTransaction_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."Subscription"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "CreditTransaction_userId_idx" ON "public"."CreditTransaction"("userId");
CREATE INDEX IF NOT EXISTS "CreditTransaction_subscriptionId_idx" ON "public"."CreditTransaction"("subscriptionId");
CREATE INDEX IF NOT EXISTS "CreditTransaction_type_idx" ON "public"."CreditTransaction"("type");
CREATE INDEX IF NOT EXISTS "CreditTransaction_createdAt_idx" ON "public"."CreditTransaction"("createdAt");

-- Grant permissions if needed (uncomment and adjust for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."Payment" TO jobportal_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."Subscription" TO jobportal_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."UserCredits" TO jobportal_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."CreditTransaction" TO jobportal_user;

