import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import phoneNormalization from '../src/lib/phone-normalization.js';

const prisma = new PrismaClient();
const IMPORT_DIR = path.join(process.cwd(), 'data', 'imports');
const { normalizePhoneRecord } = phoneNormalization;

const importFile = async (filePath) => {
  const payload = await fs.readFile(filePath, 'utf8');
  const parsed = JSON.parse(payload);

  if (!Array.isArray(parsed)) {
    throw new Error(`${path.basename(filePath)} must contain a JSON array`);
  }

  let imported = 0;
  let skipped = 0;

  for (const rawPhone of parsed) {
    const normalizedPhone = normalizePhoneRecord(rawPhone);

    if (!normalizedPhone) {
      skipped += 1;
      continue;
    }

    const brand = await prisma.brand.upsert({
      where: { slug: normalizedPhone.brandSlug },
      update: { name: normalizedPhone.brandName },
      create: {
        slug: normalizedPhone.brandSlug,
        name: normalizedPhone.brandName,
      },
    });

    await prisma.device.upsert({
      where: {
        brandId_slug: {
          brandId: brand.id,
          slug: normalizedPhone.deviceSlug,
        },
      },
      update: {
        model: normalizedPhone.modelName,
        name: normalizedPhone.name,
        imageUrl: normalizedPhone.imageUrl || null,
        specBlob: normalizedPhone.specBlob,
        rawPayload: normalizedPhone.rawPayload,
        sourceFile: path.basename(filePath),
        releaseDate: normalizedPhone.releaseDate ? new Date(normalizedPhone.releaseDate) : null,
        displaySizeInches: normalizedPhone.displaySizeInches,
        displayResolution: normalizedPhone.displayResolution,
        displayRefreshRate: normalizedPhone.displayRefreshRate,
        displayType: normalizedPhone.displayType,
        performanceChipset: normalizedPhone.performanceChipset,
        performanceChipsetNodeNm: normalizedPhone.performanceChipsetNodeNm,
        performanceRamOptions: normalizedPhone.performanceRamOptions,
        storageOptions: normalizedPhone.storageOptions,
        cameraMainMp: normalizedPhone.cameraMainMp,
        cameraFrontMp: normalizedPhone.cameraFrontMp,
        batteryCapacityMah: normalizedPhone.batteryCapacityMah,
        batteryWiredChargingW: normalizedPhone.batteryWiredChargingW,
        weightG: normalizedPhone.weightG,
        lastScrapedAt: normalizedPhone.lastScrapedAt ? new Date(normalizedPhone.lastScrapedAt) : null,
        isDiscontinued: normalizedPhone.isDiscontinued,
      },
      create: {
        brandId: brand.id,
        slug: normalizedPhone.deviceSlug,
        model: normalizedPhone.modelName,
        name: normalizedPhone.name,
        imageUrl: normalizedPhone.imageUrl || null,
        specBlob: normalizedPhone.specBlob,
        rawPayload: normalizedPhone.rawPayload,
        sourceFile: path.basename(filePath),
        releaseDate: normalizedPhone.releaseDate ? new Date(normalizedPhone.releaseDate) : null,
        displaySizeInches: normalizedPhone.displaySizeInches,
        displayResolution: normalizedPhone.displayResolution,
        displayRefreshRate: normalizedPhone.displayRefreshRate,
        displayType: normalizedPhone.displayType,
        performanceChipset: normalizedPhone.performanceChipset,
        performanceChipsetNodeNm: normalizedPhone.performanceChipsetNodeNm,
        performanceRamOptions: normalizedPhone.performanceRamOptions,
        storageOptions: normalizedPhone.storageOptions,
        cameraMainMp: normalizedPhone.cameraMainMp,
        cameraFrontMp: normalizedPhone.cameraFrontMp,
        batteryCapacityMah: normalizedPhone.batteryCapacityMah,
        batteryWiredChargingW: normalizedPhone.batteryWiredChargingW,
        weightG: normalizedPhone.weightG,
        lastScrapedAt: normalizedPhone.lastScrapedAt ? new Date(normalizedPhone.lastScrapedAt) : null,
        isDiscontinued: normalizedPhone.isDiscontinued,
      },
    });

    imported += 1;
  }

  return { imported, skipped };
};

const main = async () => {
  const targetFile = process.argv[2];
  const filePaths = targetFile
    ? [path.join(IMPORT_DIR, targetFile)]
    : (await fs.readdir(IMPORT_DIR))
        .filter((fileName) => fileName.endsWith('.json'))
        .map((fileName) => path.join(IMPORT_DIR, fileName));

  if (filePaths.length === 0) {
    console.log('No import files found in data/imports');
    return;
  }

  for (const filePath of filePaths) {
    const result = await importFile(filePath);
    console.log(`${path.basename(filePath)}: imported ${result.imported}, skipped ${result.skipped}`);
  }
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
