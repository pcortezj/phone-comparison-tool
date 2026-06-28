import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/db';
import phoneNormalization from '@/lib/phone-normalization.js';

const IMPORT_DIR = path.join(process.cwd(), 'data', 'imports');

type SpecSections = Record<string, Record<string, string>>;

interface RawImportFile {
  fileName: string;
  imported: number;
  skipped: number;
}

interface ImportFileSummary {
  fileName: string;
  byteSize: number;
  updatedAt: string;
}

interface ImportReport {
  files: RawImportFile[];
  imported: number;
  skipped: number;
}

interface NormalizedPhoneRecord {
  brandName: string;
  brandSlug: string;
  modelName: string;
  deviceSlug: string;
  name: string;
  imageUrl: string;
  specBlob: string;
  rawPayload: string;
  releaseDate: string | null;
  displaySizeInches: number | null;
  displayResolution: string | null;
  displayRefreshRate: number | null;
  displayType: string | null;
  performanceChipset: string | null;
  performanceChipsetNodeNm: number | null;
  performanceRamOptions: string | null;
  storageOptions: string | null;
  cameraMainMp: number | null;
  cameraFrontMp: number | null;
  batteryCapacityMah: number | null;
  batteryWiredChargingW: number | null;
  weightG: number | null;
  lastScrapedAt: string | null;
  isDiscontinued: boolean;
}

const encodeDeviceId = (brandSlug: string, deviceSlug: string) => `${brandSlug}::${deviceSlug}`;

const decodeDeviceId = (value: string) => {
  const [brandSlug, deviceSlug] = value.split('::');
  if (!brandSlug || !deviceSlug) {
    return null;
  }

  return { brandSlug, deviceSlug };
};

const {
  DEFAULT_IMAGE,
  normalizePhoneRecord,
  parseSpecBlob,
  slugify,
} = phoneNormalization as {
  DEFAULT_IMAGE: string;
  normalizePhoneRecord: (rawPhone: unknown) => NormalizedPhoneRecord | null;
  parseSpecBlob: (specBlob: string | null) => SpecSections;
  slugify: (value: string) => string;
};

const buildNormalizedDeviceWrite = (normalizedPhone: NormalizedPhoneRecord, sourceFile: string) => ({
  model: normalizedPhone.modelName,
  name: normalizedPhone.name,
  imageUrl: normalizedPhone.imageUrl,
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
});

const getImportFilePaths = async () => {
  const entries = await fs.readdir(IMPORT_DIR, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(IMPORT_DIR, entry.name));
};

export const getCatalogStats = async () => {
  const [brandCount, deviceCount, importFiles] = await Promise.all([
    prisma.brand.count(),
    prisma.device.count(),
    listImportFiles(),
  ]);

  return {
    brandCount,
    deviceCount,
    importFileCount: importFiles.length,
  };
};

export const listImportFiles = async (): Promise<ImportFileSummary[]> => {
  const filePaths = await getImportFilePaths();

  const files = await Promise.all(
    filePaths.map(async (filePath) => {
      const stats = await fs.stat(filePath);
      return {
        fileName: path.basename(filePath),
        byteSize: stats.size,
        updatedAt: stats.mtime.toISOString(),
      };
    })
  );

  return files.sort((a, b) => a.fileName.localeCompare(b.fileName));
};

export const importPhoneData = async (fileName?: string): Promise<ImportReport> => {
  const selectedPaths = fileName
    ? [path.join(IMPORT_DIR, fileName)]
    : await getImportFilePaths();

  if (selectedPaths.length === 0) {
    return { files: [], imported: 0, skipped: 0 };
  }

  const report: ImportReport = {
    files: [],
    imported: 0,
    skipped: 0,
  };

  for (const filePath of selectedPaths) {
    let parsed: unknown;
    try {
      const payload = await fs.readFile(filePath, 'utf8');
      parsed = JSON.parse(payload) as unknown;
    } catch {
      report.files.push({ fileName: path.basename(filePath), imported: 0, skipped: 1 });
      report.skipped += 1;
      continue;
    }

    if (!Array.isArray(parsed)) {
      report.files.push({ fileName: path.basename(filePath), imported: 0, skipped: 1 });
      report.skipped += 1;
      continue;
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
        update: buildNormalizedDeviceWrite(normalizedPhone, path.basename(filePath)),
        create: {
          brandId: brand.id,
          slug: normalizedPhone.deviceSlug,
          ...buildNormalizedDeviceWrite(normalizedPhone, path.basename(filePath)),
        },
      });

      imported += 1;
    }

    report.files.push({ fileName: path.basename(filePath), imported, skipped });
    report.imported += imported;
    report.skipped += skipped;
  }

  return report;
};

export const getBrands = async () => {
  const brands = await prisma.brand.findMany({
    include: {
      _count: {
        select: { devices: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return brands.map((brand) => ({
    id: brand.slug,
    name: brand.name,
    brand: brand.slug,
    devices: brand._count.devices,
  }));
};

export const getReleaseYears = async () => {
  const devices = await prisma.device.findMany({
    where: {
      releaseDate: { not: null },
    },
    select: {
      releaseDate: true,
    },
  });

  return Array.from(
    new Set(
      devices
        .map((device) => device.releaseDate?.getUTCFullYear())
        .filter((year): year is number => typeof year === 'number' && Number.isFinite(year))
    )
  ).sort((a, b) => b - a);
};

export const getDevicesByBrand = async (brandSlug: string) => {
  const brand = await prisma.brand.findUnique({
    where: { slug: brandSlug },
    include: {
      devices: {
        orderBy: { name: 'asc' },
      },
    },
  });

  if (!brand) {
    return [];
  }

  return brand.devices.map((device) => ({
    id: encodeDeviceId(brand.slug, device.slug),
    name: device.name,
    img: device.imageUrl || DEFAULT_IMAGE,
    description: device.model,
    brand: brand.name,
  }));
};

export const searchDevices = async (query: string, brandSlug?: string, releaseYear?: number) => {
  const normalizedQuery = query.trim();
  const hasReleaseYear = typeof releaseYear === 'number' && Number.isFinite(releaseYear);

  const devices = await prisma.device.findMany({
    where: {
      AND: [
        brandSlug
          ? {
              brand: {
                slug: brandSlug,
              },
            }
          : {},
        hasReleaseYear
          ? {
              releaseDate: {
                gte: new Date(Date.UTC(releaseYear, 0, 1)),
                lt: new Date(Date.UTC(releaseYear + 1, 0, 1)),
              },
            }
          : {},
        normalizedQuery
          ? {
              OR: [
                { name: { contains: normalizedQuery } },
                { model: { contains: normalizedQuery } },
                {
                  brand: {
                    name: { contains: normalizedQuery },
                  },
                },
              ],
            }
          : {},
      ],
    },
    include: {
      brand: true,
    },
    orderBy: [
      { brand: { name: 'asc' } },
      { name: 'asc' },
    ],
    take: 60,
  });

  return devices.map((device) => ({
    id: encodeDeviceId(device.brand.slug, device.slug),
    name: device.name,
    img: device.imageUrl || DEFAULT_IMAGE,
    description: `${device.brand.name} ${device.model}`.trim(),
    brand: device.brand.name,
  }));
};

export const getDeviceByEncodedId = async (encodedId: string) => {
  const decoded = decodeDeviceId(encodedId);
  if (!decoded) {
    return null;
  }

  return prisma.device.findFirst({
    where: {
      slug: decoded.deviceSlug,
      brand: {
        slug: decoded.brandSlug,
      },
    },
    include: {
      brand: true,
    },
  });
};

export const getDeviceByBrandModel = async (brandNameOrSlug: string, modelNameOrSlug: string) => {
  const brandSlug = slugify(brandNameOrSlug);
  const deviceSlug = slugify(modelNameOrSlug);

  return prisma.device.findFirst({
    where: {
      slug: deviceSlug,
      brand: {
        slug: brandSlug,
      },
    },
    include: {
      brand: true,
    },
  });
};

export const getSpecsForDevice = (specBlob: string | null) => parseSpecBlob(specBlob);
