'use client';

import type { RetailerLink } from '@/lib/affiliate-links';
import { trackAffiliateClick } from '@/lib/analytics';

export default function BuyOptions({
  deviceId,
  retailers,
  isDiscontinued,
}: {
  deviceId: string;
  retailers: RetailerLink[];
  isDiscontinued: boolean;
}) {
  if (isDiscontinued) {
    return (
      <section className="comparison-section buy-options-section">
        <div className="comparison-section-header">
          <span className="eyebrow">Buying options</span>
          <h2>Where to buy</h2>
        </div>
        <p className="discontinued-notice">
          This phone is discontinued. Compare it with newer models to find a current alternative.
        </p>
      </section>
    );
  }

  if (retailers.length === 0) {
    return null;
  }

  return (
    <section className="comparison-section buy-options-section">
      <div className="comparison-section-header">
        <span className="eyebrow">Buying options</span>
        <h2>Where to buy</h2>
      </div>

      <div className="buy-options-grid">
        {retailers.map((retailer) => (
          <a
            key={retailer.key}
            href={retailer.url}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="retailer-button"
            onClick={() => trackAffiliateClick(deviceId, retailer.key)}
          >
            Check {retailer.label}
          </a>
        ))}
      </div>

      <p className="affiliate-disclosure">
        DifferenceAI may earn a commission from qualifying purchases made through these links, at no extra cost to you.
      </p>
    </section>
  );
}
