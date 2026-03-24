'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Brand {
  id: string;
  name: string;
  devices: number;
}

interface Device {
  id: string;
  name: string;
  img: string;
  description: string;
}

export default function Home() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<Device[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      fetchDevices(selectedBrand);
    } else {
      setDevices([]);
    }
  }, [selectedBrand]);

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/phones');
      const data = await response.json();
      
      if (data.error) {
        console.error('Failed to fetch brands:', data.error);
        setBrands([]);
      } else {
        setBrands(data.brands || []);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      setBrands([]);
    }
  };

  const fetchDevices = async (brandId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/phones/${brandId}`);
      const data = await response.json();
      
      if (data.error) {
        console.error('Failed to fetch devices:', data.error);
        setDevices([]);
      } else {
        setDevices(data.devices || []);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      setDevices([]);
    } finally { 
      setLoading(false);
    }
  };

  const addToComparison = (device: Device) => {
    if (selectedDevices.length < 4 && !selectedDevices.find(d => d.id === device.id)) {
      setSelectedDevices([...selectedDevices, device]);
      setSearchTerm('');
      setShowDeviceDropdown(false);
    }
  };

  const removeFromComparison = (deviceId: string) => {
    setSelectedDevices(selectedDevices.filter(d => d.id !== deviceId));
  };

  const handleCompareDevices = () => {
    if (selectedDevices.length >= 2) {
      const deviceIds = selectedDevices.map(device => device.id).join(',');
      router.push(`/compare?devices=${deviceIds}`);
    }
  };

  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedBrandName = brands.find((b) => b.id === selectedBrand)?.name || '';
  console.log('Selected Brand:', selectedBrandName);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Smartphone Comparison Tool
        </h1>

        {/* Selected Devices for Comparison */}
        {selectedDevices.length > 0 && (
          <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Selected for Comparison ({selectedDevices.length}/4)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {selectedDevices.map((device) => (
                <div key={device.id} className="flex flex-col p-4 border rounded-lg">
                  <img src={device.img} alt={device.name} className="w-full h-32 object-cover rounded mb-3" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-2">{device.name}</h3>
                    <p className="text-xs text-gray-800 mb-3">{device.description.substring(0, 80)}...</p>
                  </div>
                  <button
                    onClick={() => removeFromComparison(device.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            {selectedDevices.length >= 2 && (
              <button 
                onClick={handleCompareDevices}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Compare Devices
              </button>
            )}
          </div>
        )}

        {/* Brand and Device Selection */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-6">Add Devices to Compare</h2>
          
          {/* Brand Dropdown */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Brand
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setSearchTerm('');
                setShowDeviceDropdown(false);
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a brand...</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          {/* Device Search */}
          {selectedBrand && (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search {selectedBrandName} Devices
              </label>
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDeviceDropdown(true);
                  }}
                  onFocus={() => setShowDeviceDropdown(true)}
                  placeholder={`Search ${selectedBrandName} devices...`}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    // show all devices
                    setSearchTerm('');
                    setShowDeviceDropdown(true);
                  }}
                  className="px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm hover:bg-gray-200"
                >
                  View all
                </button>
                {loading && (
                  <div className="ml-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>

              {/* Device Dropdown: show all or filtered devices when dropdown is open */}
              {showDeviceDropdown && filteredDevices.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredDevices.map((device) => (
                    <button
                      key={device.id}
                      onClick={() => addToComparison(device)}
                      disabled={selectedDevices.length >= 4 || selectedDevices.some(d => d.id === device.id)}
                      className={`w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                        selectedDevices.some(d => d.id === device.id)
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center">
                        <img src={device.img} alt={device.name} className="w-12 h-12 object-cover rounded mr-3" />
                        <div>
                          <div className="font-medium">{device.name}</div>
                          <div className="text-sm text-gray-800">{device.description.substring(0, 60)}...</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {showDeviceDropdown && !loading && filteredDevices.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-gray-800">
                  No devices found matching "{searchTerm}"
                </div>
              )}
            </div>
          )}

          {/* Click outside to close dropdown */}
          {showDeviceDropdown && (
            <div
              className="fixed inset-0 z-0"
              onClick={() => setShowDeviceDropdown(false)}
            />
          )}
        </div>

        {/* Instructions */}
        <div className="text-center text-gray-800">
          <p>Select a brand and search for devices to add up to 4 items for comparison.</p>
        </div>
      </div>
    </div>
  );
}