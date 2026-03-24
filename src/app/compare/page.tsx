'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface Device {
  id: string;
  name: string;
  img: string;
  description: string;
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

export default function ComparePage() {
  const searchParams = useSearchParams();
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceDetails, setDeviceDetails] = useState<{ [key: string]: DeviceDetail }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const deviceIds = searchParams.get('devices')?.split(',') || [];
    if (deviceIds.length === 0) {
      setError('No devices selected for comparison');
      setLoading(false);
      return;
    }

    // For now, we'll use the fallback device data since we don't have detailed specs
    // In a real app, you'd fetch detailed specs from the API
    loadDeviceDetails(deviceIds);
  }, [searchParams]);

  const loadDeviceDetails = async (deviceIds: string[]) => {
    try {
      const details: { [key: string]: DeviceDetail } = {};
      
      // Fetch real device details from the API
      for (const deviceId of deviceIds) {
        try {
          const response = await fetch(`/api/phones/device/${deviceId}`);
          const data = await response.json();
          
          if (data.error) {
            console.error(`Failed to fetch device ${deviceId}:`, data.error);
            // Use fallback mock data if API fails
            details[deviceId] = createMockDeviceDetail(deviceId);
          } else {
            details[deviceId] = data.device;
          }
        } catch (error) {
          console.error(`Error fetching device ${deviceId}:`, error);
          // Use fallback mock data if API fails
          details[deviceId] = createMockDeviceDetail(deviceId);
        }
      }

      setDeviceDetails(details);
      setLoading(false);
    } catch (error) {
      console.error('Error loading device details:', error);
      setError('Failed to load device details');
      setLoading(false);
    }
  };

  const createMockDeviceDetail = (deviceId: string): DeviceDetail => {
    // Create realistic mock data based on device type
    const isApple = deviceId.includes('apple');
    const isSamsung = deviceId.includes('samsung');
    const isXiaomi = deviceId.includes('xiaomi');
    const isGoogle = deviceId.includes('google');
    const isOnePlus = deviceId.includes('oneplus');

    const baseSpecs = {
      'Display': isApple ? '6.7" OLED' : isSamsung ? '6.8" Dynamic AMOLED' : '6.7" AMOLED',
      'Processor': isApple ? 'Apple A17 Pro' : isSamsung ? 'Snapdragon 8 Gen 3' : 'Snapdragon 8 Gen 3',
      'RAM': isApple ? '8GB' : isSamsung ? '12GB' : '16GB',
      'Storage': '256GB',
      'Battery': isApple ? '4441mAh' : isSamsung ? '5000mAh' : '4880mAh',
      'Camera': isApple ? '48MP + 12MP + 12MP' : isSamsung ? '200MP + 12MP + 50MP + 10MP' : '50MP + 50MP + 50MP',
      'OS': isApple ? 'iOS 17' : isSamsung ? 'Android 14' : 'Android 14',
      'Charging': isApple ? '20W wired, 15W MagSafe' : isSamsung ? '45W wired, 15W wireless' : '120W wired, 50W wireless',
      'Water Resistance': isApple ? 'IP68' : isSamsung ? 'IP68' : 'IP68',
      'Weight': isApple ? '221g' : isSamsung ? '232g' : '223g'
    };

    return {
      name: getDeviceName(deviceId),
      img: getDeviceImage(deviceId),
      quickSpec: [
        { name: 'Display', value: baseSpecs['Display'] },
        { name: 'Processor', value: baseSpecs['Processor'] },
        { name: 'RAM', value: baseSpecs['RAM'] },
        { name: 'Storage', value: baseSpecs['Storage'] },
        { name: 'Battery', value: baseSpecs['Battery'] }
      ],
      detailSpec: [
        {
          category: 'Display',
          specifications: [
            { name: 'Type', value: baseSpecs['Display'] },
            { name: 'Resolution', value: '1440 x 3088 pixels' },
            { name: 'Refresh Rate', value: '120Hz' },
            { name: 'Protection', value: isApple ? 'Ceramic Shield' : 'Gorilla Glass Victus 2' }
          ]
        },
        {
          category: 'Performance',
          specifications: [
            { name: 'Chipset', value: baseSpecs['Processor'] },
            { name: 'RAM', value: baseSpecs['RAM'] },
            { name: 'Storage', value: baseSpecs['Storage'] },
            { name: 'GPU', value: isApple ? 'Apple GPU' : 'Adreno 750' }
          ]
        },
        {
          category: 'Camera',
          specifications: [
            { name: 'Main Camera', value: baseSpecs['Camera'] },
            { name: 'Front Camera', value: '12MP' },
            { name: 'Video', value: '4K@60fps' },
            { name: 'Features', value: 'OIS, HDR, Night mode' }
          ]
        },
        {
          category: 'Battery & Charging',
          specifications: [
            { name: 'Capacity', value: baseSpecs['Battery'] },
            { name: 'Wired Charging', value: baseSpecs['Charging'].split(',')[0] },
            { name: 'Wireless Charging', value: baseSpecs['Charging'].includes('wireless') ? 'Yes' : 'No' },
            { name: 'Reverse Charging', value: isSamsung ? 'Yes' : 'No' }
          ]
        },
        {
          category: 'Design & Build',
          specifications: [
            { name: 'Dimensions', value: '159.9 x 76.7 x 8.3 mm' },
            { name: 'Weight', value: baseSpecs['Weight'] },
            { name: 'Water Resistance', value: baseSpecs['Water Resistance'] },
            { name: 'Materials', value: isApple ? 'Titanium, Glass' : 'Aluminum, Glass' }
          ]
        }
      ]
    };
  };

  const getDeviceName = (deviceId: string): string => {
    const deviceNames: { [key: string]: string } = {
      'apple_iphone_15_pro_max-12345': 'iPhone 15 Pro Max',
      'apple_iphone_15_pro-12346': 'iPhone 15 Pro',
      'apple_iphone_15-12347': 'iPhone 15',
      'apple_iphone_14_pro_max-12348': 'iPhone 14 Pro Max',
      'samsung_galaxy_s24_ultra-12349': 'Samsung Galaxy S24 Ultra',
      'samsung_galaxy_s24_plus-12350': 'Samsung Galaxy S24+',
      'samsung_galaxy_s24-12351': 'Samsung Galaxy S24',
      'samsung_galaxy_z_fold5-12352': 'Samsung Galaxy Z Fold5',
      'xiaomi_14_pro-12353': 'Xiaomi 14 Pro',
      'xiaomi_14-12354': 'Xiaomi 14',
      'xiaomi_13_ultra-12355': 'Xiaomi 13 Ultra',
      'google_pixel_8_pro-12356': 'Google Pixel 8 Pro',
      'google_pixel_8-12357': 'Google Pixel 8',
      'google_pixel_7a-12358': 'Google Pixel 7a',
      'oneplus_12-12359': 'OnePlus 12',
      'oneplus_11-12360': 'OnePlus 11',
      'oneplus_nord_3-12361': 'OnePlus Nord 3'
    };
    return deviceNames[deviceId] || 'Unknown Device';
  };

  const getDeviceImage = (deviceId: string): string => {
    const deviceImages: { [key: string]: string } = {
      'apple_iphone_15_pro_max-12345': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro-max.jpg',
      'apple_iphone_15_pro-12346': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro.jpg',
      'apple_iphone_15-12347': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15.jpg',
      'apple_iphone_14_pro_max-12348': 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14-pro-max.jpg',
      'samsung_galaxy_s24_ultra-12349': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra.jpg',
      'samsung_galaxy_s24_plus-12350': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-plus.jpg',
      'samsung_galaxy_s24-12351': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24.jpg',
      'samsung_galaxy_z_fold5-12352': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold5.jpg',
      'xiaomi_14_pro-12353': 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14-pro.jpg',
      'xiaomi_14-12354': 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14.jpg',
      'xiaomi_13_ultra-12355': 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-13-ultra.jpg',
      'google_pixel_8_pro-12356': 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-8-pro.jpg',
      'google_pixel_8-12357': 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-8.jpg',
      'google_pixel_7a-12358': 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-7a.jpg',
      'oneplus_12-12359': 'https://fdn2.gsmarena.com/vv/bigpic/oneplus-12.jpg',
      'oneplus_11-12360': 'https://fdn2.gsmarena.com/vv/bigpic/oneplus-11.jpg',
      'oneplus_nord_3-12361': 'https://fdn2.gsmarena.com/vv/bigpic/oneplus-nord-3.jpg'
    };
    return deviceImages[deviceId] || 'https://via.placeholder.com/300x400?text=Device+Image';
  };

  const deviceIds = searchParams.get('devices')?.split(',') || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-800">Loading comparison...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <a href="/" className="text-blue-500 hover:underline">Back to device selection</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Device Comparison</h1>
            <a href="/" className="text-blue-500 hover:underline">← Back to selection</a>
          </div>
          <p className="text-gray-800">Comparing {deviceIds.length} devices</p>
        </div>

        {/* Device Headers */}
        <div className={`grid gap-4 mb-8 ${deviceIds.length === 2 ? 'grid-cols-2' : deviceIds.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
          {deviceIds.map((deviceId) => {
            const detail = deviceDetails[deviceId];
            if (!detail) return null;
            
            return (
              <div key={deviceId} className="bg-white rounded-lg shadow-md p-4 text-center">
                <img 
                  src={detail.img} 
                  alt={detail.name} 
                  className="w-32 h-32 object-cover mx-auto mb-4 rounded-lg"
                />
                <h2 className="font-semibold text-lg mb-2 text-gray-900">{detail.name}</h2>
                <div className="space-y-2 text-sm">
                  {detail.quickSpec.map((spec, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-900">{spec.name}:</span>
                      <span className="font-medium text-gray-900">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Comparison Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                {deviceDetails[deviceIds[0]]?.detailSpec.map((category, categoryIndex) => (
                  <React.Fragment key={categoryIndex}>
                    {/* Category Header */}
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                        {category.category}
                      </th>
                      {deviceIds.map((deviceId) => (
                        <th key={deviceId} className="px-6 py-3 text-center text-sm font-semibold text-gray-700 border-b">
                          {deviceDetails[deviceId]?.name}
                        </th>
                      ))}
                    </tr>
                    
                    {/* Specifications */}
                    {category.specifications.map((spec, specIndex) => (
                      <tr key={specIndex} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-gray-700 border-r">
                          {spec.name}
                        </td>
                        {deviceIds.map((deviceId) => {
                          const deviceSpec = deviceDetails[deviceId]?.detailSpec[categoryIndex]?.specifications[specIndex];
                          return (
                            <td key={deviceId} className="px-6 py-3 text-sm text-center text-gray-800">
                              {deviceSpec?.value || 'N/A'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Get Best Price
          </button>
          <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Share Comparison
          </button>
        </div>
      </div>
    </div>
  );
} 