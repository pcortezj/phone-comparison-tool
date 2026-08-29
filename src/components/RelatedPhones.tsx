import Link from 'next/link';
import type { RelatedDevice } from '@/lib/related-phones';

export default function RelatedPhones({ devices }: { devices: RelatedDevice[] }) {
  if (devices.length === 0) {
    return null;
  }

  return (
    <section className="comparison-section related-phones-section">
      <div className="comparison-section-header">
        <span className="eyebrow">You may also like</span>
        <h2>Related phones</h2>
      </div>

      <div className="results-grid">
        {devices.map((device) => (
          <Link
            key={device.id}
            href={`/phones/${device.brandSlug}/${device.deviceSlug}`}
            className="device-card related-phone-card"
          >
            <div className="device-card-top">
              <img src={device.img} alt={device.name} width={104} height={104} loading="lazy" decoding="async" />
              <div>
                <p className="device-brand">{device.releaseYear || 'Catalog device'}</p>
                <h3>{device.name}</h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
