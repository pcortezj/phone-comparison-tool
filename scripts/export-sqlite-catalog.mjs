import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

// One-time migration utility: dumps the existing local SQLite catalog
// (source of truth) to portable JSON so it can be loaded into a fresh
// Postgres database via scripts/import-catalog-dump.mjs. Must be run
// while prisma/schema.prisma's datasource is still "sqlite", since the
// generated Prisma Client is provider-specific.

const SQLITE_PATH = path.join(process.cwd(), 'prisma', 'dev.db');
const OUTPUT_PATH = process.argv[2] || path.join(process.cwd(), 'data', 'exports', 'catalog-dump.json');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${SQLITE_PATH}`,
    },
  },
});

const run = async () => {
  const brands = await prisma.brand.findMany({
    include: { devices: true },
    orderBy: { id: 'asc' },
  });

  const deviceCount = brands.reduce((sum, brand) => sum + brand.devices.length, 0);

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify({ brands }));

  console.log(`Exported ${brands.length} brands and ${deviceCount} devices to ${OUTPUT_PATH}`);
};

run()
  .catch((error) => {
    console.error('Export failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
