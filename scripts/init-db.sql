PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "Brand" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "Brand_slug_key" ON "Brand"("slug");

CREATE TABLE IF NOT EXISTS "Device" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "brandId" INTEGER NOT NULL,
  "slug" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "imageUrl" TEXT,
  "specBlob" TEXT,
  "rawPayload" TEXT,
  "sourceFile" TEXT,
  "releaseDate" DATETIME,
  "displaySizeInches" REAL,
  "displayResolution" TEXT,
  "displayRefreshRate" INTEGER,
  "displayType" TEXT,
  "performanceChipset" TEXT,
  "performanceChipsetNodeNm" REAL,
  "performanceRamOptions" TEXT,
  "storageOptions" TEXT,
  "cameraMainMp" REAL,
  "cameraFrontMp" REAL,
  "batteryCapacityMah" INTEGER,
  "batteryWiredChargingW" REAL,
  "weightG" REAL,
  "lastScrapedAt" DATETIME,
  "isDiscontinued" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Device_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Device_brandId_slug_key" ON "Device"("brandId", "slug");
CREATE INDEX IF NOT EXISTS "Device_brandId_name_idx" ON "Device"("brandId", "name");
