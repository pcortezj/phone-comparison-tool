import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

// Loads a JSON dump produced by scripts/export-sqlite-catalog.mjs into
// whichever Postgres database DATABASE_URL points to. Writes every stored
// column directly (no re-normalization), so this reproduces the source
// data exactly. Safe to re-run: brands and devices are upserted by their
// unique slugs.

const prisma = new PrismaClient();
const DUMP_PATH = process.argv[2] || path.join(process.cwd(), 'data', 'exports', 'catalog-dump.json');

const toDeviceWrite = (device) => ({
  slug: device.slug,
  model: device.model,
  name: device.name,
  imageUrl: device.imageUrl,
  specBlob: device.specBlob,
  rawPayload: device.rawPayload,
  sourceFile: device.sourceFile,
  releaseDate: device.releaseDate,
  displaySizeInches: device.displaySizeInches,
  displayResolution: device.displayResolution,
  displayRefreshRate: device.displayRefreshRate,
  displayType: device.displayType,
  performanceChipset: device.performanceChipset,
  performanceChipsetNodeNm: device.performanceChipsetNodeNm,
  performanceRamOptions: device.performanceRamOptions,
  storageOptions: device.storageOptions,
  cameraMainMp: device.cameraMainMp,
  cameraFrontMp: device.cameraFrontMp,
  batteryCapacityMah: device.batteryCapacityMah,
  batteryWiredChargingW: device.batteryWiredChargingW,
  weightG: device.weightG,
  lastScrapedAt: device.lastScrapedAt,
  isDiscontinued: device.isDiscontinued,
});

const main = async () => {
  const payload = JSON.parse(await fs.readFile(DUMP_PATH, 'utf8'));
  const brands = payload.brands;

  if (!Array.isArray(brands)) {
    throw new Error(`${DUMP_PATH} is missing a "brands" array`);
  }

  let importedBrands = 0;
  let importedDevices = 0;

  for (const brandRecord of brands) {
    const brand = await prisma.brand.upsert({
      where: { slug: brandRecord.slug },
      update: { name: brandRecord.name },
      create: { slug: brandRecord.slug, name: brandRecord.name },
    });
    importedBrands += 1;

    for (const device of brandRecord.devices) {
      await prisma.device.upsert({
        where: { brandId_slug: { brandId: brand.id, slug: device.slug } },
        update: toDeviceWrite(device),
        create: { brandId: brand.id, ...toDeviceWrite(device) },
      });
      importedDevices += 1;
    }
  }

  console.log(`Imported ${importedBrands} brands and ${importedDevices} devices from ${DUMP_PATH}`);
};

main()
  .catch((error) => {
    console.error('Import failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
