-- Align Job.companyId FK with Prisma onDelete: Cascade.
-- Ensures company deletion removes only jobs owned by that company at the DB level.
-- Application / JobBookmark / JobView already cascade from Job.

ALTER TABLE "Job" DROP CONSTRAINT IF EXISTS "Job_companyId_fkey";

ALTER TABLE "Job"
  ADD CONSTRAINT "Job_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
