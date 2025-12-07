-- CreateTable (idempotent)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'SearchHistory') THEN
        CREATE TABLE "SearchHistory" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "query" TEXT NOT NULL,
            "location" TEXT,
            "filters" JSONB,
            "resultCount" INTEGER NOT NULL DEFAULT 0,
            "searchType" TEXT NOT NULL DEFAULT 'job',
            "source" TEXT NOT NULL DEFAULT 'web',
            "userAgent" TEXT,
            "ipAddress" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "SearchHistory_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "SearchHistory_userId_idx" ON "SearchHistory"("userId");

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "SearchHistory_query_idx" ON "SearchHistory"("query");

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "SearchHistory_createdAt_idx" ON "SearchHistory"("createdAt");

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "SearchHistory_searchType_idx" ON "SearchHistory"("searchType");

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "SearchHistory_userId_createdAt_idx" ON "SearchHistory"("userId", "createdAt");

-- AddForeignKey (idempotent)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'SearchHistory_userId_fkey'
    ) THEN
        ALTER TABLE "SearchHistory" 
        ADD CONSTRAINT "SearchHistory_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
