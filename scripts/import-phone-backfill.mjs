import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import phoneNormalization from '../src/lib/phone-normalization.js';

const prisma = new PrismaClient();

const { normalizePhoneRecord } = phoneNormalization;

const readJsonArray = async (filePath) => {
  const payload = await fs.readFile(filePath, 'utf8');
  const parsed = JSON.parse(payload);

  if (!Array.isArray(parsed)) {
    throw new Error(`${path.basename(filePath)} must contain a JSON array`);
  }

  return parsed;
};

const insertDevice = async (rawPhone, normalizedPhone, sourceFile) => {
  const brand = await prisma.brand.upsert({
    where: { slug: normalizedPhone.brandSlug },
    update: { name: normalizedPhone.brandName },
    create: {
      slug: normalizedPhone.brandSlug,
      name: normalizedPhone.brandName,
    },
  });

  await prisma.device.create({
    data: {
      brandId: brand.id,
      slug: normalizedPhone.deviceSlug,
      model: normalizedPhone.modelName,
      name: normalizedPhone.name,
      imageUrl: normalizedPhone.imageUrl || null,
      specBlob: normalizedPhone.specBlob,
      rawPayload: normalizedPhone.rawPayload,
      sourceFile,
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

  return rawPhone;
};

const main = async () => {
  const fileArg = process.argv[2];
  if (!fileArg) {
    throw new Error('Usage: node scripts/import-phone-backfill.mjs <json-file>');
  }

  const filePath = path.isAbsolute(fileArg) ? fileArg : path.join(process.cwd(), fileArg);
  const rawPhones = await readJsonArray(filePath);
  const sourceFile = path.basename(filePath);
  const seenKeys = new Set();
  const report = {
    found: rawPhones.length,
    alreadyHad: 0,
    added: 0,
    failed: 0,
    failures: [],
  };

  for (const rawPhone of rawPhones) {
    try {
      const normalizedPhone = normalizePhoneRecord(rawPhone);

      if (!normalizedPhone) {
        report.failed += 1;
        report.failures.push({
          model: rawPhone?.name || rawPhone?.model || 'Unknown model',
          reason: 'Could not normalize phone record',
        });
        continue;
      }

      const brand = await prisma.brand.findUnique({
        where: { slug: normalizedPhone.brandSlug },
        select: { id: true },
      });
      const key = `${normalizedPhone.brandSlug}/${normalizedPhone.deviceSlug}`;

      if (seenKeys.has(key)) {
        report.alreadyHad += 1;
        continue;
      }

      seenKeys.add(key);

      const existingDevice = brand
        ? await prisma.device.findUnique({
            where: {
              brandId_slug: {
                brandId: brand.id,
                slug: normalizedPhone.deviceSlug,
              },
            },
            select: { id: true },
          })
        : null;

      if (existingDevice) {
        report.alreadyHad += 1;
        continue;
      }

      await insertDevice(rawPhone, normalizedPhone, sourceFile);
      report.added += 1;
    } catch (error) {
      report.failed += 1;
      report.failures.push({
        model: rawPhone?.name || rawPhone?.model || 'Unknown model',
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log(`Found:       ${report.found}`);
  console.log(`Already had: ${report.alreadyHad}`);
  console.log(`Added:       ${report.added}`);
  console.log(`Failed:      ${report.failed}`);

  if (report.failures.length > 0) {
    console.log('Failures:');
    report.failures.forEach((failure) => {
      console.log(`- ${failure.model}: ${failure.reason}`);
    });
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
