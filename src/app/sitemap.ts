import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [devices, brands] = await Promise.all([
    prisma.device.findMany({
      select: {
        slug: true,
        updatedAt: true,
        brand: { select: { slug: true } },
      },
    }),
    prisma.brand.findMany({ select: { slug: true } }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/compare`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/contact`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.1 },
  ];

  const brandEntries: MetadataRoute.Sitemap = brands.map((brand) => ({
    url: `${SITE_URL}/phones/${brand.slug}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const deviceEntries: MetadataRoute.Sitemap = devices.map((device) => ({
    url: `${SITE_URL}/phones/${device.brand.slug}/${device.slug}`,
    lastModified: device.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticEntries, ...brandEntries, ...deviceEntries];
}
