import { prisma } from '@/lib/db';
import phoneNormalization from '@/lib/phone-normalization.js';
import type { DeviceWithBrand } from '@/lib/device-detail';

const { DEFAULT_IMAGE } = phoneNormalization as { DEFAULT_IMAGE: string };

export type RelatedDevice = {
  id: string;
  brandSlug: string;
  deviceSlug: string;
  name: string;
  img: string;
  releaseYear: number | null;
};

const toRelated = (device: DeviceWithBrand): RelatedDevice => ({
  id: `${device.brand.slug}::${device.slug}`,
  brandSlug: device.brand.slug,
  deviceSlug: device.slug,
  name: device.name,
  img: device.imageUrl || DEFAULT_IMAGE,
  releaseYear: device.releaseDate ? device.releaseDate.getUTCFullYear() : null,
});

const yearDistance = (a: number | null, b: number | null) => {
  if (a === null || b === null) return 50;
  return Math.abs(a - b);
};

const sizeDistance = (a: number | null, b: number | null) => {
  if (a === null || b === null) return 10;
  return Math.abs(a - b);
};

/**
 * Simple, explainable related-devices lookup: same brand first (closest release
 * year wins), then backfilled with cross-brand devices close in display size
 * and release year. No price/category signal exists in the schema, so none is
 * used or invented.
 */
export const getRelatedDevices = async (phone: DeviceWithBrand, limit = 4): Promise<RelatedDevice[]> => {
  const sameBrand = await prisma.device.findMany({
    where: {
      brandId: phone.brandId,
      id: { not: phone.id },
    },
    include: { brand: true },
    take: 40,
  });

  const referenceYear = phone.releaseDate ? phone.releaseDate.getUTCFullYear() : null;

  const rankedSameBrand = sameBrand
    .map((device) => ({
      device,
      distance: yearDistance(referenceYear, device.releaseDate ? device.releaseDate.getUTCFullYear() : null),
    }))
    .sort((a, b) => a.distance - b.distance)
    .map((entry) => entry.device);

  const picked: DeviceWithBrand[] = rankedSameBrand.slice(0, limit);

  if (picked.length < limit && phone.displaySizeInches !== null) {
    const sizeMin = phone.displaySizeInches - 0.6;
    const sizeMax = phone.displaySizeInches + 0.6;

    const candidates = await prisma.device.findMany({
      where: {
        id: { notIn: [phone.id, ...picked.map((device) => device.id)] },
        displaySizeInches: { gte: sizeMin, lte: sizeMax },
      },
      include: { brand: true },
      take: 60,
    });

    const rankedCandidates = candidates
      .map((device) => ({
        device,
        distance:
          sizeDistance(phone.displaySizeInches, device.displaySizeInches) * 4 +
          yearDistance(referenceYear, device.releaseDate ? device.releaseDate.getUTCFullYear() : null),
      }))
      .sort((a, b) => a.distance - b.distance)
      .map((entry) => entry.device);

    for (const candidate of rankedCandidates) {
      if (picked.length >= limit) break;
      if (!picked.some((existing) => existing.id === candidate.id)) {
        picked.push(candidate);
      }
    }
  }

  return picked.slice(0, limit).map(toRelated);
};
