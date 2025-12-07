-- CreateTable (only if User table exists and Notification doesn't exist)
DO $$
BEGIN
  -- Check if User table exists first
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'User') THEN
    -- Create Notification table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Notification') THEN
      CREATE TABLE "Notification" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "isRead" BOOLEAN NOT NULL DEFAULT false,
          "data" JSONB,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
      );

      -- CreateIndex (only if they don't exist)
      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Notification_userId_idx') THEN
        CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Notification_type_idx') THEN
        CREATE INDEX "Notification_type_idx" ON "Notification"("type");
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Notification_isRead_idx') THEN
        CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Notification_createdAt_idx') THEN
        CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
      END IF;

      -- AddForeignKey (only if constraint doesn't exist)
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Notification_userId_fkey') THEN
        ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    ELSE
      RAISE NOTICE 'Notification table already exists. Skipping creation.';
      -- Still try to add foreign key if table exists but constraint doesn't
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Notification_userId_fkey') THEN
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'User') THEN
          ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END IF;
    END IF;
  ELSE
    RAISE NOTICE 'User table does not exist. Notification table creation skipped. This is expected if schema was already synced via db push.';
  END IF;
END $$;
