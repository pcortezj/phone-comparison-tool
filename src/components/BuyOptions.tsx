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
  if (retailers.length === 0 && !isDiscontinued) {
    return null;
  }

  return (
    <section className="comparison-section buy-options-section">
      <div className="comparison-section-header">
        <span className="eyebrow">Buying options</span>
        <h2>Where to buy</h2>
      </div>

      {isDiscontinued && (
        <p className="discontinued-notice">
          This phone is no longer sold new, but you may still find it on the secondhand market.
        </p>
      )}

      {retailers.length > 0 && (
        <>
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
                {retailer.label}
                <span aria-hidden="true">&rarr;</span>
              </a>
            ))}
          </div>

          <p className="affiliate-disclosure">
            DifferenceAI may earn a commission from qualifying purchases made through these links, at no extra cost to you.
          </p>
        </>
      )}
    </section>
  );
}
