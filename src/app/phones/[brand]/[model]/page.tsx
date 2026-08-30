import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDeviceByBrandModel, encodeDeviceId } from '@/lib/phone-catalog';
import { buildDeviceDetail } from '@/lib/device-detail';
import { getRelatedDevices } from '@/lib/related-phones';
import { getRetailerLinks } from '@/lib/affiliate-links';
import Breadcrumbs from '@/components/Breadcrumbs';
import SpecSection from '@/components/SpecSection';
import BuyOptions from '@/components/BuyOptions';
import RelatedPhones from '@/components/RelatedPhones';
import ComparisonChat from '@/components/ComparisonChat';
import PhoneViewTracker from '@/components/PhoneViewTracker';
import CompareCtaButton from '@/components/CompareCtaButton';

type PageParams = { brand: string; model: string };

// Memoized per-request so generateMetadata and the page body share one DB lookup.
const getCachedDevice = cache((brand: string, model: string) => getDeviceByBrandModel(brand, model));

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { brand, model } = await params;
  const phone = await getCachedDevice(brand, model);

  if (!phone) {
    return { title: 'Phone not found | DifferenceAI' };
  }

  const detail = buildDeviceDetail(phone);
  const path = `/phones/${phone.brand.slug}/${phone.slug}`;
  const specBits = detail.quickSpec
    .filter((spec) => spec.value !== 'N/A' && spec.name !== 'Released')
    .map((spec) => spec.value);

  const title = `${detail.name} Specs, Price & Comparison | DifferenceAI`;
  const description =
    specBits.length > 0
      ? `Compare ${detail.name} specs, including ${specBits.join(', ')}. See current buying options and compare it with other phones.`
      : `See full specs for the ${detail.name}, current buying options, and how it compares with other phones.`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      images: [{ url: detail.img }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [detail.img],
    },
  };
}

export default async function PhonePage({ params }: { params: Promise<PageParams> }) {
  const { brand, model } = await params;
  const phone = await getCachedDevice(brand, model);

  if (!phone) {
    notFound();
  }

  const detail = buildDeviceDetail(phone);
  const deviceId = encodeDeviceId(phone.brand.slug, phone.slug);
  const releaseYear = phone.releaseDate ? phone.releaseDate.getUTCFullYear() : null;
  const relatedDevices = await getRelatedDevices(phone, 4);

  const compareHref = `/?devices=${deviceId}`;
  const relatedComparisons = relatedDevices.slice(0, 3).map((related) => ({
    label: `${detail.name} vs ${related.name}`,
    href: `/compare?devices=${deviceId},${related.id}`,
  }));

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: detail.name,
    image: detail.img,
    brand: { '@type': 'Brand', name: phone.brand.name },
    ...(phone.releaseDate ? { releaseDate: phone.releaseDate.toISOString().slice(0, 10) } : {}),
  };

  return (
    <main className="device-shell">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Phones', href: '/' },
          { label: phone.brand.name, href: `/phones/${phone.brand.slug}` },
          { label: detail.name },
        ]}
      />

      <PhoneViewTracker deviceId={deviceId} />

      <section className="device-hero">
        <article className="device-spotlight-card">
          <div className="device-spotlight-image">
            <img src={detail.img} alt={detail.name} decoding="async" />
          </div>

          <div className="quick-spec-list">
            {detail.quickSpec.map((spec) => (
              <div key={spec.name} className="quick-spec-row">
                <span>{spec.name}</span>
                <strong>{spec.value}</strong>
              </div>
            ))}
          </div>
        </article>

        <div className="device-hero-copy">
          <span className="eyebrow">
            {phone.brand.name}
            {releaseYear ? ` · ${releaseYear}` : ''}
          </span>
          <h1>{detail.name}</h1>
          <p>Full specs, buying options, and an AI assistant that can answer questions about this phone.</p>
          <div className="device-hero-actions">
            <CompareCtaButton deviceId={deviceId} href={compareHref} className="primary-button">
              Compare this phone
            </CompareCtaButton>
            <Link href={`/phones/${phone.brand.slug}`} className="ghost-link">
              More {phone.brand.name} phones
            </Link>
          </div>

          <BuyOptions
            deviceId={deviceId}
            retailers={getRetailerLinks(detail.name)}
            isDiscontinued={phone.isDiscontinued}
          />
        </div>
      </section>

      {relatedComparisons.length > 0 && (
        <section className="comparison-section related-comparisons-section">
          <div className="comparison-section-header">
            <span className="eyebrow">Popular comparisons</span>
            <h2>See how it stacks up</h2>
          </div>
          <div className="related-comparison-links">
            {relatedComparisons.map((item) => (
              <Link key={item.href} href={item.href} className="brand-pill">
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      <ComparisonChat
        deviceIds={[deviceId]}
        eyebrow="AI Assistant"
        heading={`Ask about the ${detail.name}`}
        description="Get quick answers grounded in this phone's actual specs — weaknesses, who it's for, or how it stacks up."
        starterPrompts={[
          'What are the biggest weaknesses of this phone?',
          'How does it compare to the previous model?',
          'Who should buy this phone?',
          'What are the best alternatives?',
        ]}
        placeholder={`Is the ${detail.name} good for gaming, battery life, and everyday use?`}
        phoneAiRequestDeviceId={deviceId}
      />

      <section className="device-spec-grid spec-details-grid">
        {detail.detailSpec.map((category, index) => (
          <SpecSection key={category.category} category={category} open={index === 0} />
        ))}
      </section>

      <RelatedPhones devices={relatedDevices} />

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
    </main>
  );
}
