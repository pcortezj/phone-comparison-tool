'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ComparisonChat from '@/components/ComparisonChat';
import BuyOptions from '@/components/BuyOptions';
import type { RetailerLink } from '@/lib/affiliate-links';

interface DeviceDetail {
  name: string;
  img: string;
  quickSpec: Array<{ name: string; value: string }>;
  detailSpec: Array<{
    category: string;
    specifications: Array<{ name: string; value: string }>;
  }>;
  retailers: RetailerLink[];
  isDiscontinued: boolean;
}

const phonePageHref = (deviceId: string) => {
  const [brandSlug, deviceSlug] = deviceId.split('::');
  return brandSlug && deviceSlug ? `/phones/${brandSlug}/${deviceSlug}` : null;
};

const sectionIdFor = (category: string) =>
  `section-${category
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}`;

export default function ComparePage() {
  const searchParams = useSearchParams();
  const [deviceDetails, setDeviceDetails] = useState<Record<string, DeviceDetail>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [sectionMenuOpen, setSectionMenuOpen] = useState(false);

  const deviceIds = searchParams.get('devices')?.split(',').filter(Boolean) || [];
  const deviceIdsKey = deviceIds.join(',');

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 480);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!sectionMenuOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSectionMenuOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sectionMenuOpen]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setSectionMenuOpen(false);
  };

  useEffect(() => {
    const ids = deviceIdsKey ? deviceIdsKey.split(',').filter(Boolean) : [];

    if (ids.length === 0) {
      setError('No devices selected for comparison.');
      setLoading(false);
      return;
    }

    void loadDeviceDetails(ids);
  }, [deviceIdsKey]);

  const loadDeviceDetails = async (ids: string[]) => {
    setLoading(true);
    setError(null);

    try {
      const responses = await Promise.all(
        ids.map(async (deviceId) => {
          const response = await fetch(`/api/phones/device/${deviceId}`);
          const payload = await response.json();

          if (!response.ok || payload.error) {
            throw new Error(payload.details || payload.error || `Failed to fetch ${deviceId}`);
          }

          return [deviceId, payload.device] as const;
        })
      );

      setDeviceDetails(Object.fromEntries(responses));
    } catch (loadError) {
      console.error('Error loading comparison:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Failed to load device comparison.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="compare-shell">
        <div className="compare-status-card">
          <div className="spinner"></div>
          <p>Building your comparison view...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="compare-shell">
        <div className="compare-status-card error">
          <h1>Comparison unavailable</h1>
          <p>{error}</p>
          <Link href="/" className="primary-button link-button">
            Back to search
          </Link>
        </div>
      </main>
    );
  }

  const firstDevice = deviceDetails[deviceIds[0]];
  const sections = firstDevice?.detailSpec.map((category) => ({
    id: sectionIdFor(category.category),
    label: category.category,
  })) || [];

  return (
    <main className="compare-shell">
      <section className="compare-hero">
        <div>
          <span className="eyebrow">Spec comparison</span>
          <h1>Side-by-side device breakdown</h1>
          <p>Review the core specs first, then scroll through the deeper category-by-category comparison.</p>
        </div>
        <div className="compare-actions">
          <Link href="/" className="ghost-link">
            Back to search
          </Link>
        </div>
      </section>

      <section className="compare-summary-grid">
        {deviceIds.map((deviceId) => {
          const detail = deviceDetails[deviceId];
          if (!detail) return null;

          return (
            <article key={deviceId} className="compare-device-card">
              <div className="compare-device-image">
                <img src={detail.img} alt={detail.name} />
              </div>
              <h2>
                {phonePageHref(deviceId) ? (
                  <Link href={phonePageHref(deviceId)!} className="device-name-link">
                    {detail.name}
                  </Link>
                ) : (
                  detail.name
                )}
              </h2>
              <div className="quick-spec-list">
                {detail.quickSpec.map((spec) => (
                  <div key={`${deviceId}-${spec.name}`} className="quick-spec-row">
                    <span>{spec.name}</span>
                    <strong>{spec.value}</strong>
                  </div>
                ))}
              </div>
              <BuyOptions
                deviceId={deviceId}
                retailers={detail.retailers || []}
                isDiscontinued={detail.isDiscontinued}
              />
            </article>
          );
        })}
      </section>

      <ComparisonChat deviceIds={deviceIds} />

      <section className="compare-detail-sections">
        {firstDevice?.detailSpec.map((category, categoryIndex) => (
          <article key={category.category} id={sectionIdFor(category.category)} className="comparison-section">
            <div className="comparison-section-header">
              <span className="eyebrow">{category.category}</span>
              <h2>{category.category} comparison</h2>
            </div>

            <div className="comparison-table-wrap">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Spec</th>
                    {deviceIds.map((deviceId) => (
                      <th key={`${category.category}-${deviceId}`}>{deviceDetails[deviceId]?.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {category.specifications.map((spec, specIndex) => (
                    <tr key={`${category.category}-${spec.name}`}>
                      <td>{spec.name}</td>
                      {deviceIds.map((deviceId) => {
                        const value =
                          deviceDetails[deviceId]?.detailSpec[categoryIndex]?.specifications[specIndex]?.value || 'N/A';

                        return <td key={`${deviceId}-${spec.name}`}>{value}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </section>

      {sections.length > 0 && (
        <div className="section-jump">
          {sectionMenuOpen && (
            <div className="section-jump-menu" id="section-jump-menu" role="menu">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  role="menuitem"
                  className="brand-pill section-jump-item"
                  onClick={() => scrollToSection(section.id)}
                >
                  {section.label}
                </button>
              ))}
            </div>
          )}

          {sectionMenuOpen && (
            <button
              type="button"
              className="section-jump-scrim"
              aria-label="Close section menu"
              onClick={() => setSectionMenuOpen(false)}
            />
          )}

          <button
            type="button"
            className="ghost-button section-jump-toggle"
            onClick={() => setSectionMenuOpen((open) => !open)}
            aria-haspopup="true"
            aria-expanded={sectionMenuOpen}
            aria-controls="section-jump-menu"
          >
            {sectionMenuOpen ? 'Close' : 'Jump to section'}
          </button>
        </div>
      )}

      <button
        type="button"
        className={`back-to-top${showBackToTop ? ' visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Back to top"
        aria-hidden={!showBackToTop}
        tabIndex={showBackToTop ? 0 : -1}
      >
        ↑
      </button>
    </main>
  );
}
