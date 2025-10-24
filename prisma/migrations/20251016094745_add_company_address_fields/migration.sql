-- Add address fields to Company table for Google JobPosting schema compliance
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "streetAddress" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "postalCode" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "country" TEXT NOT NULL DEFAULT 'IN';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS "Company_city_idx" ON "Company"("city");
CREATE INDEX IF NOT EXISTS "Company_country_idx" ON "Company"("country");
