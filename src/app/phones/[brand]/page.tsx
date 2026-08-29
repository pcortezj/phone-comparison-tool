import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getDevicesByBrand } from '@/lib/phone-catalog';
import Breadcrumbs from '@/components/Breadcrumbs';

type PageParams = { brand: string };

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { brand: brandSlug } = await params;
  const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });

  if (!brand) {
    return { title: 'Brand not found | DifferenceAI' };
  }

  const title = `${brand.name} Phones — Specs & Comparison | DifferenceAI`;
  const description = `Browse every ${brand.name} phone in the DifferenceAI catalog. View full specs and compare them side by side.`;
  const path = `/phones/${brand.slug}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: 'website' },
  };
}

export default async function BrandPage({ params }: { params: Promise<PageParams> }) {
  const { brand: brandSlug } = await params;
  const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });

  if (!brand) {
    notFound();
  }

  const devices = await getDevicesByBrand(brand.slug);

  return (
    <main className="catalog-shell">
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'Phones', href: '/' }, { label: brand.name }]}
      />

      <section className="hero-panel brand-index-hero">
        <div className="hero-copy">
          <span className="eyebrow">Brand catalog</span>
          <h1>{brand.name} phones</h1>
          <p>
            {devices.length} {brand.name} device{devices.length === 1 ? '' : 's'} in the DifferenceAI catalog.
          </p>
        </div>
      </section>

      <section className="search-panel">
        <div className="results-grid">
          {devices.map((device) => {
            const deviceSlug = device.id.split('::')[1];

            return (
              <Link key={device.id} href={`/phones/${brand.slug}/${deviceSlug}`} className="device-card">
                <div className="device-card-top">
                  <img src={device.img} alt={device.name} width={104} height={104} loading="lazy" decoding="async" />
                  <div>
                    <p className="device-brand">{device.brand || brand.name}</p>
                    <h3>{device.name}</h3>
                    <p>{device.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
