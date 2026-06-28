'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Brand {
  id: string;
  name: string;
  deviceCount: number;
}

interface ImportFile {
  fileName: string;
  byteSize: number;
  updatedAt: string;
}

interface CatalogStats {
  brandCount: number;
  deviceCount: number;
  importFileCount: number;
}

interface ImportResult {
  success: boolean;
  message: string;
  importedCount?: number;
  skippedCount?: number;
  files?: Array<{
    fileName: string;
    imported: number;
    skipped: number;
  }>;
}

export default function AdminPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [importFiles, setImportFiles] = useState<ImportFile[]>([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [stats, setStats] = useState<CatalogStats | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const response = await fetch('/api/phones/download');
      const data = await response.json();

      if (data.brands) {
        setBrands(data.brands);
        setImportFiles(data.importFiles || []);
        setStats(data.stats || null);
      } else {
        console.error('Failed to fetch admin data:', data.error);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runImport = async (body: Record<string, unknown>) => {
    setImporting(true);
    setResult(null);

    try {
      const response = await fetch('/api/phones/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const payload = await response.json();
      setResult(payload);
      await fetchAdminData();
    } catch (error) {
      console.error('Import error:', error);
      setResult({
        success: false,
        message: 'Import failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      });
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <main className="admin-shell">
        <div className="compare-status-card">
          <div className="spinner"></div>
          <p>Loading catalog admin...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <section className="admin-hero">
        <div className="admin-hero-copy">
          <span className="admin-kicker">Catalog control room</span>
          <h1>Import and maintain your local phone dataset.</h1>
          <p>Bring scraped or open-source phone JSON into the SQLite catalog, review incoming files, and keep your searchable inventory current.</p>
        </div>

        <div className="admin-action-row">
          <Link href="/" className="ghost-link">
            Back to main app
          </Link>
        </div>

        <div className="admin-note">
          <h2>Workflow</h2>
          <ol>
            <li>Drop raw JSON arrays into <code>data/imports</code>.</li>
            <li>Import one file or every available file from this page.</li>
            <li>The app upserts brands and devices into the local Prisma SQLite database.</li>
          </ol>
        </div>
      </section>

      {stats && (
        <section className="admin-stats">
          <article className="admin-stat">
            <span>Brands</span>
            <strong>{stats.brandCount}</strong>
          </article>
          <article className="admin-stat">
            <span>Devices</span>
            <strong>{stats.deviceCount}</strong>
          </article>
          <article className="admin-stat">
            <span>Import Files</span>
            <strong>{stats.importFileCount}</strong>
          </article>
        </section>
      )}

      <section className="admin-grid">
        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <p className="panel-kicker">Single file</p>
              <h2>Import selected file</h2>
            </div>
            <span className="admin-tag">Targeted refresh</span>
          </div>

          <div className="admin-panel-body">
            <label className="admin-field">
              <span>Select file</span>
              <select value={selectedFile} onChange={(event) => setSelectedFile(event.target.value)}>
                <option value="">Choose a JSON file...</option>
                {importFiles.map((file) => (
                  <option key={file.fileName} value={file.fileName}>
                    {file.fileName}
                  </option>
                ))}
              </select>
            </label>

            <button
              onClick={() => void runImport({ fileName: selectedFile })}
              disabled={!selectedFile || importing}
              className="primary-button"
            >
              {importing ? 'Importing...' : 'Import Selected File'}
            </button>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <p className="panel-kicker">Bulk update</p>
              <h2>Import all files</h2>
            </div>
            <span className="admin-tag">Full sync</span>
          </div>

          <div className="admin-panel-body">
            <p>Import every JSON file currently present in <code>data/imports</code>. Existing devices are updated in place.</p>
            <button
              onClick={() => void runImport({ importAll: true })}
              disabled={importing}
              className="secondary-button"
            >
              {importing ? 'Importing...' : 'Import All Files'}
            </button>
          </div>
        </article>
      </section>

      {result && (
        <section className={result.success ? 'admin-result-card success' : 'admin-result-card error'}>
          <p className="panel-kicker">{result.success ? 'Import successful' : 'Import failed'}</p>
          <h2>{result.message}</h2>
          {result.success && result.importedCount !== undefined && (
            <p>Imported {result.importedCount} phones and skipped {result.skippedCount || 0}.</p>
          )}
          {result.files && result.files.length > 0 && (
            <div className="admin-result-files">
              {result.files.map((file) => (
                <p key={file.fileName}>
                  {file.fileName}: imported {file.imported}, skipped {file.skipped}
                </p>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="admin-section">
        <div className="admin-panel-header">
          <div>
            <p className="panel-kicker">Input queue</p>
            <h2>Detected import files</h2>
          </div>
        </div>

        <div className="admin-file-grid">
          {importFiles.length === 0 && (
            <div className="empty-card">
              <p>No JSON files found in <code>data/imports</code>.</p>
            </div>
          )}
          {importFiles.map((file) => (
            <article key={file.fileName} className="admin-file-card">
              <p className="admin-micro">Source file</p>
              <h3>{file.fileName}</h3>
              <p>{Math.round(file.byteSize / 1024)} KB</p>
              <p>Updated {new Date(file.updatedAt).toLocaleString()}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-panel-header">
          <div>
            <p className="panel-kicker">Catalog map</p>
            <h2>Catalog brands</h2>
          </div>
        </div>

        <div className="admin-brand-grid">
          {brands.map((brand) => (
            <article key={brand.id} className="admin-brand-card">
              <p className="admin-micro">Brand</p>
              <h3>{brand.name}</h3>
              <p>{brand.deviceCount} devices</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
