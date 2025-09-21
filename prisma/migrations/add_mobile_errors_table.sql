-- CreateTable
CREATE TABLE "MobileError" (
    "id" TEXT NOT NULL,
    "errorId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "componentStack" TEXT,
    "isMobile" BOOLEAN NOT NULL DEFAULT false,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "url" TEXT,
    "screenSize" TEXT,
    "viewport" TEXT,
    "devicePixelRatio" DOUBLE PRECISION,
    "touchSupport" BOOLEAN NOT NULL DEFAULT false,
    "protocol" TEXT,
    "hostname" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobileError_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MobileError_errorId_key" ON "MobileError"("errorId");

-- CreateIndex
CREATE INDEX "MobileError_timestamp_idx" ON "MobileError"("timestamp");

-- CreateIndex
CREATE INDEX "MobileError_isMobile_idx" ON "MobileError"("isMobile");

-- CreateIndex
CREATE INDEX "MobileError_hostname_idx" ON "MobileError"("hostname");
