-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "videoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "subscribersGained" INTEGER NOT NULL DEFAULT 0,
    "subscribersLost" INTEGER NOT NULL DEFAULT 0,
    "averageViewDuration" INTEGER NOT NULL DEFAULT 0,
    "ctr" REAL NOT NULL DEFAULT 0,
    "retention30s" REAL,
    "category" TEXT,
    "categoryConfidence" REAL,
    "categoryManual" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" DATETIME
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "videoCount" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "channelId" TEXT,
    "channelName" TEXT,
    "syncInterval" INTEGER NOT NULL DEFAULT 24,
    "lastSyncAt" DATETIME,
    "anthropicKey" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Video_videoId_key" ON "Video"("videoId");

-- CreateIndex
CREATE INDEX "Video_publishedAt_idx" ON "Video"("publishedAt");

-- CreateIndex
CREATE INDEX "Video_category_idx" ON "Video"("category");
