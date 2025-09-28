-- CreateTable
CREATE TABLE "NormalizedJob" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "salary_currency" TEXT NOT NULL DEFAULT 'USD',
    "salary_display" TEXT,
    "category" TEXT NOT NULL DEFAULT 'General',
    "subcategories" TEXT[],
    "posted_date" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "apply_url" TEXT,
    "source_url" TEXT,
    "is_remote" BOOLEAN NOT NULL DEFAULT false,
    "is_hybrid" BOOLEAN NOT NULL DEFAULT false,
    "experience_level" TEXT NOT NULL DEFAULT 'Mid Level',
    "skills" TEXT[],
    "sector" TEXT NOT NULL DEFAULT 'General',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_urgent" BOOLEAN NOT NULL DEFAULT false,
    "country" TEXT NOT NULL DEFAULT 'IN',
    "raw_data" JSONB,
    "relevance_score" DOUBLE PRECISION,
    "ranking_breakdown" JSONB,
    "category_confidence" DOUBLE PRECISION,
    "matched_keywords" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NormalizedJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NormalizedJob_title_idx" ON "NormalizedJob"("title");

-- CreateIndex
CREATE INDEX "NormalizedJob_company_idx" ON "NormalizedJob"("company");

-- CreateIndex
CREATE INDEX "NormalizedJob_location_idx" ON "NormalizedJob"("location");

-- CreateIndex
CREATE INDEX "NormalizedJob_category_idx" ON "NormalizedJob"("category");

-- CreateIndex
CREATE INDEX "NormalizedJob_sector_idx" ON "NormalizedJob"("sector");

-- CreateIndex
CREATE INDEX "NormalizedJob_source_idx" ON "NormalizedJob"("source");

-- CreateIndex
CREATE INDEX "NormalizedJob_posted_date_idx" ON "NormalizedJob"("posted_date");

-- CreateIndex
CREATE INDEX "NormalizedJob_relevance_score_idx" ON "NormalizedJob"("relevance_score");

-- CreateIndex
CREATE INDEX "NormalizedJob_is_remote_idx" ON "NormalizedJob"("is_remote");

-- CreateIndex
CREATE INDEX "NormalizedJob_is_hybrid_idx" ON "NormalizedJob"("is_hybrid");

-- CreateIndex
CREATE INDEX "NormalizedJob_experience_level_idx" ON "NormalizedJob"("experience_level");

-- CreateIndex
CREATE INDEX "NormalizedJob_country_idx" ON "NormalizedJob"("country");

-- CreateIndex
CREATE INDEX "NormalizedJob_source_source_id_idx" ON "NormalizedJob"("source", "source_id");

-- CreateIndex
CREATE INDEX "NormalizedJob_category_sector_idx" ON "NormalizedJob"("category", "sector");

-- CreateIndex
CREATE INDEX "NormalizedJob_location_country_idx" ON "NormalizedJob"("location", "country");

-- CreateIndex
CREATE INDEX "NormalizedJob_salary_range_idx" ON "NormalizedJob"("salary_min", "salary_max");

-- CreateIndex
CREATE INDEX "NormalizedJob_created_at_idx" ON "NormalizedJob"("created_at");
