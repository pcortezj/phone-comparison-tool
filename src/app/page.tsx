'use client';

import { useEffect, useMemo, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';

interface Brand {
  id: string;
  name: string;
  devices: number;
  brand: string;
}

interface Device {
  id: string;
  name: string;
  img: string;
  description: string;
  brand?: string;
}

interface DeviceDetail {
  name: string;
  img: string;
  quickSpec: Array<{ name: string; value: string }>;
  detailSpec: Array<{
    category: string;
    specifications: Array<{ name: string; value: string }>;
  }>;
}

const MAX_COMPARE = 4;
const PHONE_IMAGE_FALLBACK = '/phone-placeholder.svg';

export default function Home() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [releaseYears, setReleaseYears] = useState<number[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedReleaseYear, setSelectedReleaseYear] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Device[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<Device[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [activeDevice, setActiveDevice] = useState<Device | null>(null);
  const [activeDeviceDetail, setActiveDeviceDetail] = useState<DeviceDetail | null>(null);
  const [deviceModalLoading, setDeviceModalLoading] = useState(false);
  const [deviceModalError, setDeviceModalError] = useState<string | null>(null);
  const hasActiveSearch = searchTerm.trim().length > 0 || selectedBrand.length > 0 || selectedReleaseYear.length > 0;

  useEffect(() => {
    void fetchBrands();
  }, []);

  useEffect(() => {
    if (!hasActiveSearch) {
      setResults([]);
      setLoadingResults(false);
      return;
    }

    const timeout = setTimeout(() => {
      void searchDevices(searchTerm, selectedBrand, selectedReleaseYear);
    }, 200);

    return () => clearTimeout(timeout);
  }, [searchTerm, selectedBrand, selectedReleaseYear, hasActiveSearch]);

  useEffect(() => {
    if (!activeDevice) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDeviceModal();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeDevice]);

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/phones');
      const data = await response.json();
      setBrands(data.brands || []);
      setReleaseYears(data.releaseYears || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
      setBrands([]);
      setReleaseYears([]);
    } finally {
      setLoadingBrands(false);
    }
  };

  const searchDevices = async (query: string, brand: string, releaseYear: string) => {
    setLoadingResults(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (brand) params.set('brand', brand);
      if (releaseYear) params.set('year', releaseYear);

      const response = await fetch(`/api/phones/search?${params.toString()}`);
      const data = await response.json();
      setResults(data.devices || []);
    } catch (error) {
      console.error('Error searching devices:', error);
      setResults([]);
    } finally {
      setLoadingResults(false);
    }
  };

  const addToComparison = (device: Device) => {
    setSelectedDevices((current) => {
      if (current.some((item) => item.id === device.id) || current.length >= MAX_COMPARE) {
        return current;
      }

      return [...current, device];
    });
  };

  const handleDeviceImageError = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    if (image.src.endsWith(PHONE_IMAGE_FALLBACK)) {
      return;
    }

    image.src = PHONE_IMAGE_FALLBACK;
  };

  const removeFromComparison = (deviceId: string) => {
    setSelectedDevices((current) => current.filter((device) => device.id !== deviceId));
  };

  const openDeviceModal = async (device: Device) => {
    setActiveDevice(device);
    setActiveDeviceDetail(null);
    setDeviceModalError(null);
    setDeviceModalLoading(true);

    try {
      const response = await fetch(`/api/phones/device/${encodeURIComponent(device.id)}`);
      const payload = await response.json();

      if (!response.ok || payload.error) {
        throw new Error(payload.details || payload.error || 'Failed to load the device.');
      }

      setActiveDeviceDetail(payload.device || null);
    } catch (error) {
      setDeviceModalError(error instanceof Error ? error.message : 'Failed to load the device.');
    } finally {
      setDeviceModalLoading(false);
    }
  };

  const closeDeviceModal = () => {
    setActiveDevice(null);
    setActiveDeviceDetail(null);
    setDeviceModalError(null);
    setDeviceModalLoading(false);
  };

  const submitComparison = () => {
    if (selectedDevices.length < 2) {
      return;
    }

    const ids = selectedDevices.map((device) => device.id).join(',');
    router.push(`/compare?devices=${ids}`);
  };

  const activeBrandName = brands.find((brand) => brand.id === selectedBrand)?.name || 'All brands';
  const activeReleaseYearLabel = selectedReleaseYear ? `Released in ${selectedReleaseYear}` : 'Any release year';
  const totalDevices = brands.reduce((sum, brand) => sum + brand.devices, 0);
  const headlineSpec = useMemo(() => activeDeviceDetail?.quickSpec.slice(0, 4) || [], [activeDeviceDetail]);

  return (
    <main className="catalog-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <div className="brand-mark">
            difference<span className="brand-mark-accent">AI</span>
          </div>
          <span className="eyebrow">The AI-powered smartphone comparison engine.</span>
          <h1>Compare phones. Know the difference.</h1>
          <p>
            Put the specs side by side and see which phone comes out ahead.
          </p>
          <div className="hero-stats">
            <div>
              <strong>{brands.length}</strong>
              <span>Brands indexed</span>
            </div>
            <div>
              <strong>{totalDevices}</strong>
              <span>Devices searchable</span>
            </div>
            <div>
              <strong>{selectedDevices.length}/{MAX_COMPARE}</strong>
              <span>Chosen to compare</span>
            </div>
          </div>
        </div>

        <div className="selection-panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Comparison workspace</p>
              <h2>Build a side-by-side comparison set</h2>
            </div>
            <button
              type="button"
              className="ghost-button"
              onClick={() => setSelectedDevices([])}
              disabled={selectedDevices.length === 0}
            >
              Clear
            </button>
          </div>

          <div className="selected-grid">
            {selectedDevices.length === 0 && (
              <div className="empty-card">
                Pick at least two devices to unlock the comparison button.
              </div>
            )}

            {selectedDevices.map((device) => (
              <article key={device.id} className="selected-card">
                <img
                  src={device.img || PHONE_IMAGE_FALLBACK}
                  alt={device.name}
                  width={88}
                  height={88}
                  loading="lazy"
                  decoding="async"
                  onError={handleDeviceImageError}
                />
                <div>
                  <p className="device-brand">{device.brand || 'Catalog device'}</p>
                  <h3>{device.name}</h3>
                  <p>{device.description}</p>
                  <button type="button" className="device-inline-link" onClick={() => void openDeviceModal(device)}>
                    View full specs
                  </button>
                </div>
                <button type="button" className="remove-button" onClick={() => removeFromComparison(device.id)}>
                  Remove
                </button>
              </article>
            ))}
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={submitComparison}
            disabled={selectedDevices.length < 2}
          >
            Compare selected devices
          </button>
        </div>
      </section>

      <section className="search-panel">
        <div className="panel-header search-header">
          <div>
            <p className="panel-kicker">Search everything</p>
            <h2>Find any phone in the catalog</h2>
          </div>
        </div>

        <div className="search-controls">
          <label className="search-input">
            <span>Search by model, phone name, or brand</span>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Try iPhone 17, Pixel 11, Galaxy Z Fold8, BlackBerry..."
            />
          </label>

          <label className="brand-select">
            <span>Brand filter</span>
            <select value={selectedBrand} onChange={(event) => setSelectedBrand(event.target.value)}>
              <option value="">All brands</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name} ({brand.devices})
                </option>
              ))}
            </select>
          </label>

          <label className="brand-select">
            <span>Release year</span>
            <select value={selectedReleaseYear} onChange={(event) => setSelectedReleaseYear(event.target.value)}>
              <option value="">Any year</option>
              {releaseYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="results-meta">
          <div>
            <strong>{activeBrandName}</strong>
            <span>
              {loadingBrands
                ? 'Loading filters...'
                : hasActiveSearch
                  ? `${activeReleaseYearLabel} · ${results.length} searchable result${results.length === 1 ? '' : 's'}`
                  : 'Select a brand, release year, or search term to see devices'}
            </span>
          </div>
          {loadingResults && <span className="loading-chip">Updating results...</span>}
        </div>

        <div className="results-grid">
          {!loadingResults && !hasActiveSearch && (
            <div className="empty-results">
              <h3>Start with a filter</h3>
              <p>Select a brand, choose a release year, or search for a model to load matching phones.</p>
            </div>
          )}

          {!loadingResults && hasActiveSearch && results.length === 0 && (
            <div className="empty-results">
              <h3>No devices matched</h3>
              <p>Try a broader search or clear one of the filters.</p>
            </div>
          )}

          {results.map((device) => {
            const isSelected = selectedDevices.some((item) => item.id === device.id);
            const isDisabled = !isSelected && selectedDevices.length >= MAX_COMPARE;

            return (
              <article key={device.id} className="device-card">
                <div className="device-card-top">
                  <img
                    src={device.img || PHONE_IMAGE_FALLBACK}
                    alt={device.name}
                    width={104}
                    height={104}
                    loading="lazy"
                    decoding="async"
                    onError={handleDeviceImageError}
                  />
                  <div>
                    <p className="device-brand">{device.brand || 'Catalog device'}</p>
                    <h3>{device.name}</h3>
                    <p>{device.description}</p>
                  </div>
                </div>

                <div className="device-card-actions">
                  <span className="result-tag">{isSelected ? 'Selected' : 'Ready'}</span>
                  <div className="device-card-buttons">
                    <button type="button" className="ghost-link" onClick={() => void openDeviceModal(device)}>
                      View specs
                    </button>
                    <button
                      type="button"
                      className={isSelected ? 'secondary-button' : 'primary-button compact'}
                      disabled={isDisabled || isSelected}
                      onClick={() => addToComparison(device)}
                    >
                      {isSelected ? 'Added to compare' : 'Add to comparison'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {activeDevice && (
        <div className="device-modal-backdrop" onClick={closeDeviceModal} role="presentation">
          <section
            className="device-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="device-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="device-modal-header">
              <div>
                <span className="eyebrow">Device profile</span>
                <h2 id="device-modal-title">{activeDeviceDetail?.name || activeDevice.name}</h2>
              </div>
              <button type="button" className="ghost-button" onClick={closeDeviceModal}>
                Close
              </button>
            </div>

            {deviceModalLoading && (
              <div className="device-modal-state">
                <div className="spinner"></div>
                <p>Loading this device profile...</p>
              </div>
            )}

            {!deviceModalLoading && deviceModalError && (
              <div className="device-modal-state error">
                <h3>Device unavailable</h3>
                <p>{deviceModalError}</p>
              </div>
            )}

            {!deviceModalLoading && !deviceModalError && activeDeviceDetail && (
              <div className="device-modal-body">
                <div className="device-modal-overview">
                  <div className="device-modal-image">
                    <img
                      src={activeDeviceDetail.img || PHONE_IMAGE_FALLBACK}
                      alt={activeDeviceDetail.name}
                      width={240}
                      height={320}
                      loading="lazy"
                      decoding="async"
                      onError={handleDeviceImageError}
                    />
                  </div>

                  <div className="quick-spec-list">
                    {headlineSpec.map((spec) => (
                      <div key={spec.name} className="quick-spec-row">
                        <span>{spec.name}</span>
                        <strong>{spec.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="device-modal-spec-grid">
                  {activeDeviceDetail.detailSpec.map((category) => (
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
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
