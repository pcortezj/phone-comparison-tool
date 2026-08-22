-- CreateTable
CREATE TABLE "Brand" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" SERIAL NOT NULL,
    "brandId" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "specBlob" TEXT,
    "rawPayload" TEXT,
    "sourceFile" TEXT,
    "releaseDate" TIMESTAMP(3),
    "displaySizeInches" DOUBLE PRECISION,
    "displayResolution" TEXT,
    "displayRefreshRate" INTEGER,
    "displayType" TEXT,
    "performanceChipset" TEXT,
    "performanceChipsetNodeNm" DOUBLE PRECISION,
    "performanceRamOptions" TEXT,
    "storageOptions" TEXT,
    "cameraMainMp" DOUBLE PRECISION,
    "cameraFrontMp" DOUBLE PRECISION,
    "batteryCapacityMah" INTEGER,
    "batteryWiredChargingW" DOUBLE PRECISION,
    "weightG" DOUBLE PRECISION,
    "lastScrapedAt" TIMESTAMP(3),
    "isDiscontinued" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE INDEX "Device_brandId_name_idx" ON "Device"("brandId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Device_brandId_slug_key" ON "Device"("brandId", "slug");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
