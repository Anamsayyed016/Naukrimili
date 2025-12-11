-- AlterTable: Make role nullable (only if User table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'User') THEN
    -- Check if column exists and is NOT NULL before altering
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'User' AND column_name = 'role' AND is_nullable = 'NO'
    ) THEN
      ALTER TABLE "User" ALTER COLUMN "role" DROP NOT NULL;
    END IF;
  END IF;
END $$;
