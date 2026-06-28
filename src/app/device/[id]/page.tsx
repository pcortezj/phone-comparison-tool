'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface DeviceDetail {
  name: string;
  img: string;
  quickSpec: Array<{ name: string; value: string }>;
  detailSpec: Array<{
    category: string;
    specifications: Array<{ name: string; value: string }>;
  }>;
}

export default function DeviceDetailPage() {
  const params = useParams<{ id: string }>();
  const deviceId = useMemo(() => {
    if (typeof params.id !== 'string') {
      return '';
    }

    try {
      return decodeURIComponent(params.id);
    } catch {
      return params.id;
    }
  }, [params.id]);
  const [device, setDevice] = useState<DeviceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deviceId) {
      return;
    }

    let cancelled = false;

    const loadDevice = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/phones/device/${encodeURIComponent(deviceId)}`);
        const payload = await response.json();

        if (!response.ok || payload.error) {
          throw new Error(payload.details || payload.error || 'Failed to load the device.');
        }

        if (!cancelled) {
          setDevice(payload.device);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load the device.');
          setDevice(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDevice();

    return () => {
      cancelled = true;
    };
  }, [deviceId]);

  const headlineSpec = useMemo(() => {
    if (!device) {
      return null;
    }

    return device.quickSpec.slice(0, 4);
  }, [device]);

  if (loading) {
    return (
      <main className="device-shell">
        <div className="compare-status-card">
          <div className="spinner"></div>
          <p>Loading this device profile...</p>
        </div>
      </main>
    );
  }

  if (error || !device) {
    return (
      <main className="device-shell">
        <div className="compare-status-card error">
          <h1>Device unavailable</h1>
          <p>{error || 'This device could not be loaded from the catalog.'}</p>
          <Link href="/" className="primary-button link-button">
            Back to catalog
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="device-shell">
      <section className="device-hero">
        <div className="device-hero-copy">
          <span className="eyebrow">Device profile</span>
          <h1>{device.name}</h1>
          <p>
            Browse the quick highlights first, then scroll for the full category-by-category spec sheet.
          </p>
          <div className="device-hero-actions">
            <Link href="/" className="ghost-link">
              Back to search
            </Link>
          </div>
        </div>

        <article className="device-spotlight-card">
          <div className="device-spotlight-image">
            <img src={device.img} alt={device.name} />
          </div>

          <div className="quick-spec-list">
            {headlineSpec?.map((spec) => (
              <div key={spec.name} className="quick-spec-row">
                <span>{spec.name}</span>
                <strong>{spec.value}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="device-spec-grid">
        {device.detailSpec.map((category) => (
          <article key={category.category} className="comparison-section">
            <div className="comparison-section-header">
              <span className="eyebrow">{category.category}</span>
              <h2>{category.category}</h2>
            </div>

            <div className="device-spec-list">
              {category.specifications.map((spec) => (
                <div key={`${category.category}-${spec.name}`} className="device-spec-row">
                  <span>{spec.name}</span>
                  <strong>{spec.value}</strong>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
