-- CreateTable
CREATE TABLE "BulkImportJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedByType" TEXT NOT NULL,
    "collegeId" TEXT,
    "status" TEXT NOT NULL,
    "totalRows" INTEGER,
    "successRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "errorReportUrl" TEXT,
    "options" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BulkImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkImportRecord" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BulkImportRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BulkImportJob_status_createdAt_idx" ON "BulkImportJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "BulkImportJob_uploadedBy_idx" ON "BulkImportJob"("uploadedBy");

-- CreateIndex
CREATE INDEX "BulkImportRecord_jobId_idx" ON "BulkImportRecord"("jobId");

-- CreateIndex
CREATE INDEX "BulkImportRecord_recordId_recordType_idx" ON "BulkImportRecord"("recordId", "recordType");
