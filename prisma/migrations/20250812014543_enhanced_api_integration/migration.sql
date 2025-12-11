-- DropIndex
DROP INDEX "public"."Job_createdAt_idx";

-- AlterTable
ALTER TABLE "public"."Job" ADD COLUMN     "applications" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "companyLogo" TEXT,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "experienceLevel" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isHybrid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRemote" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isUrgent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jobType" TEXT,
ADD COLUMN     "salaryCurrency" TEXT,
ADD COLUMN     "salaryMax" INTEGER,
ADD COLUMN     "salaryMin" INTEGER,
ADD COLUMN     "sector" TEXT,
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "source" SET DEFAULT 'manual',
ALTER COLUMN "country" SET DEFAULT 'IN',
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable (only if User table doesn't already exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'User') THEN
    CREATE TABLE "public"."User" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "firstName" TEXT NOT NULL,
        "lastName" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'jobseeker',
        "phone" TEXT,
        "location" TEXT,
        "bio" TEXT,
        "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "experience" TEXT,
        "education" TEXT,
        "profilePicture" TEXT,
        "isVerified" BOOLEAN NOT NULL DEFAULT false,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
    );
    CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");
  END IF;
END $$;

-- CreateTable (JobBookmark - only if table doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'JobBookmark') THEN
    CREATE TABLE "public"."JobBookmark" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "jobId" TEXT NOT NULL,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "JobBookmark_pkey" PRIMARY KEY ("id")
    );
    CREATE INDEX "JobBookmark_userId_idx" ON "public"."JobBookmark"("userId");
    CREATE INDEX "JobBookmark_jobId_idx" ON "public"."JobBookmark"("jobId");
    CREATE UNIQUE INDEX "JobBookmark_userId_jobId_key" ON "public"."JobBookmark"("userId", "jobId");
  END IF;
END $$;

-- CreateIndex (only if User table exists and index doesn't exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'User') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'User_email_key') THEN
      CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");
    END IF;
  END IF;
END $$;

-- CreateIndex
CREATE INDEX "Job_createdAt_idx" ON "public"."Job"("createdAt");

-- CreateIndex
CREATE INDEX "Job_country_location_idx" ON "public"."Job"("country", "location");

-- CreateIndex
CREATE INDEX "Job_salaryMin_salaryMax_idx" ON "public"."Job"("salaryMin", "salaryMax");

-- CreateIndex
CREATE INDEX "Job_jobType_idx" ON "public"."Job"("jobType");

-- CreateIndex
CREATE INDEX "Job_experienceLevel_idx" ON "public"."Job"("experienceLevel");

-- CreateIndex
CREATE INDEX "Job_isRemote_idx" ON "public"."Job"("isRemote");

-- CreateIndex
CREATE INDEX "Job_sector_idx" ON "public"."Job"("sector");

-- CreateIndex
CREATE INDEX "Job_isActive_idx" ON "public"."Job"("isActive");

-- AddForeignKey
ALTER TABLE "public"."Job" ADD CONSTRAINT "Job_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobBookmark" ADD CONSTRAINT "JobBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobBookmark" ADD CONSTRAINT "JobBookmark_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
