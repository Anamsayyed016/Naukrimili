-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT,
    "user_role" TEXT,
    "event_type" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_event_id_idx" ON "AnalyticsEvent"("event_id");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_user_id_idx" ON "AnalyticsEvent"("user_id");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_user_role_idx" ON "AnalyticsEvent"("user_role");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_event_type_idx" ON "AnalyticsEvent"("event_type");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_entity_type_idx" ON "AnalyticsEvent"("entity_type");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_entity_id_idx" ON "AnalyticsEvent"("entity_id");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_created_at_idx" ON "AnalyticsEvent"("created_at");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_session_id_idx" ON "AnalyticsEvent"("session_id");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_user_id_created_at_idx" ON "AnalyticsEvent"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_event_type_created_at_idx" ON "AnalyticsEvent"("event_type", "created_at");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_entity_type_entity_id_idx" ON "AnalyticsEvent"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_metadata_idx" ON "AnalyticsEvent" USING GIN ("metadata");

-- CreateTable
CREATE TABLE "AnalyticsAggregation" (
    "id" TEXT NOT NULL,
    "aggregation_type" TEXT NOT NULL,
    "time_period" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "metrics" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsAggregation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsAggregation_aggregation_type_idx" ON "AnalyticsAggregation"("aggregation_type");

-- CreateIndex
CREATE INDEX "AnalyticsAggregation_time_period_idx" ON "AnalyticsAggregation"("time_period");

-- CreateIndex
CREATE INDEX "AnalyticsAggregation_start_time_idx" ON "AnalyticsAggregation"("start_time");

-- CreateIndex
CREATE INDEX "AnalyticsAggregation_end_time_idx" ON "AnalyticsAggregation"("end_time");

-- CreateIndex
CREATE INDEX "AnalyticsAggregation_created_at_idx" ON "AnalyticsAggregation"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsAggregation_aggregation_type_time_period_start_time_key" ON "AnalyticsAggregation"("aggregation_type", "time_period", "start_time");
