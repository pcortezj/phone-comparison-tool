'use client';

import { useState, useEffect } from 'react';

interface Brand {
  id: string;
  name: string;
  deviceCount: number;
}

interface DownloadResult {
  success: boolean;
  message: string;
  filename?: string;
  phoneCount?: number;
}

export default function AdminPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const [downloadResult, setDownloadResult] = useState<DownloadResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/phones/download');
      const data = await response.json();
      
      if (data.brands) {
        setBrands(data.brands);
      } else {
        console.error('Failed to fetch brands:', data.error);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadBrandPhones = async () => {
    if (!selectedBrand) return;

    setDownloading(true);
    setDownloadResult(null);

    try {
      const response = await fetch('/api/phones/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ brandId: selectedBrand }),
      });

      const result = await response.json();
      setDownloadResult(result);
    } catch (error) {
      console.error('Download error:', error);
      setDownloadResult({
        success: false,
        message: 'Download failed: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
    } finally {
      setDownloading(false);
    }
  };

  const downloadAllPhones = async () => {
    setDownloading(true);
    setDownloadResult(null);

    try {
      const response = await fetch('/api/phones/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ downloadAll: true }),
      });

      const result = await response.json();
      setDownloadResult(result);
    } catch (error) {
      console.error('Download error:', error);
      setDownloadResult({
        success: false,
        message: 'Download failed: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-800">Loading brands...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Phone Data Download</h1>
            <p className="text-gray-700">Download phone specifications from RapidAPI Mobile Phone Specs Database</p>
            <a href="/" className="text-blue-600 hover:underline">← Back to main app</a>
          </div>

          {/* Setup Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Setup Required</h2>
            <p className="text-blue-800 mb-2">
              To use this feature, you need to:
            </p>
            <ol className="text-blue-800 list-decimal list-inside space-y-1">
              <li>Get a RapidAPI key from <a href="https://rapidapi.com/makingdatameaningful/api/mobile-phone-specs-database" target="_blank" rel="noopener noreferrer" className="underline">Mobile Phone Specs Database</a></li>
              <li>Add <code className="bg-blue-100 px-1 rounded">RAPIDAPI_KEY=your_api_key_here</code> to your <code className="bg-blue-100 px-1 rounded">.env.local</code> file</li>
              <li>Restart your development server</li>
            </ol>
          </div>

          {/* Download Options */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Download by Brand */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Download by Brand</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Brand
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a brand...</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name} ({brand.deviceCount} devices)
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={downloadBrandPhones}
                disabled={!selectedBrand || downloading}
                className={`w-full px-4 py-2 rounded-lg font-medium ${
                  !selectedBrand || downloading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {downloading ? 'Downloading...' : 'Download Brand Phones'}
              </button>
            </div>

            {/* Download All */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Download All Phones</h2>
              <p className="text-gray-700 mb-4">
                Download all available phones from the database. This may take a while and use many API calls.
              </p>

              <button
                onClick={downloadAllPhones}
                disabled={downloading}
                className={`w-full px-4 py-2 rounded-lg font-medium ${
                  downloading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {downloading ? 'Downloading...' : 'Download All Phones'}
              </button>
            </div>
          </div>

          {/* Download Result */}
          {downloadResult && (
            <div className={`mt-8 p-4 rounded-lg ${
              downloadResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <h3 className={`font-semibold mb-2 ${
                downloadResult.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {downloadResult.success ? 'Download Successful' : 'Download Failed'}
              </h3>
              <p className={downloadResult.success ? 'text-green-800' : 'text-red-800'}>
                {downloadResult.message}
              </p>
              {downloadResult.success && downloadResult.phoneCount && (
                <p className="text-green-800 mt-2">
                  Downloaded {downloadResult.phoneCount} phones to {downloadResult.filename}
                </p>
              )}
            </div>
          )}

          {/* Available Brands List */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Brands</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {brands.map((brand) => (
                <div key={brand.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="font-medium text-gray-900">{brand.name}</div>
                  <div className="text-sm text-gray-600">{brand.deviceCount} devices</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 