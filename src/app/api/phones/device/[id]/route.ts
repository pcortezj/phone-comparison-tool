import { NextResponse } from 'next/server';
import { phoneAPIClient } from '@/lib/phone-api-client';

function extractBrandModel(id: string, searchParams: URLSearchParams) {
  const brandParam = searchParams.get('brand');
  const modelParam = searchParams.get('model');

  if (brandParam && modelParam) {
    return {
      brand: decodeURIComponent(brandParam),
      model: decodeURIComponent(modelParam)
    };
  }

  const decodedId = decodeURIComponent(id);

  if (decodedId.includes('::')) {
    const [brand, model] = decodedId.split('::');
    if (brand && model) {
      return { brand, model };
    }
  }

  if (decodedId.includes('_')) {
    const [brand, ...modelParts] = decodedId.split('_');
    if (brand && modelParts.length > 0) {
      return { brand, model: modelParts.join('_') };
    }
  }

  if (decodedId.includes('-')) {
    const [brand, ...modelParts] = decodedId.split('-');
    if (brand && modelParts.length > 0) {
      return { brand, model: modelParts.join('-') };
    }
  }

  return null;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);

    const parsed = extractBrandModel(id, url.searchParams);

    if (!parsed) {
      return NextResponse.json(
        {
          error: 'Invalid device identifier. Expected brand/model information.',
          details: 'Use the id format "brand::model" or provide ?brand=<brand>&model=<model>.'
        },
        { status: 400 }
      );
    }

    const phone = await phoneAPIClient.getPhoneDetailsByBrandModel(parsed.brand, parsed.model);

    const normalizedSpecs: Record<string, Record<string, string>> = {};

    if (phone.specs && typeof phone.specs === 'object') {
      Object.entries(phone.specs as Record<string, unknown>).forEach(([key, value]) => {
        if (value && typeof value === 'object') {
          normalizedSpecs[key] = Object.entries(value as Record<string, unknown>).reduce(
            (acc, [k, v]) => ({ ...acc, [k.toLowerCase()]: String(v ?? '') }),
            {}
          );
        }
      });
    }

    if (Array.isArray(phone.specifications) && !phone.specs) {
      phone.specifications.forEach((section) => {
        if (!section || typeof section !== 'object') return;
        const sectionObj = section as Record<string, unknown>;
        const title = sectionObj.title;

        if (!title || typeof title !== 'string') return;

        const key = title.toLowerCase();
        normalizedSpecs[key] = normalizedSpecs[key] || {};

        const rows = Array.isArray(sectionObj.specs)
          ? sectionObj.specs
          : Array.isArray(sectionObj.data)
            ? sectionObj.data
            : [];

        rows.forEach((row) => {
          if (!row || typeof row !== 'object') return;
          const rowObj = row as Record<string, unknown>;
          const name = rowObj.key || rowObj.name;
          const value = rowObj.value || rowObj.spec || rowObj.content;

          if (name && typeof name === 'string' && value !== undefined) {
            normalizedSpecs[key][name.toLowerCase().replace(/\s+/g, '_')] = String(value);
          }
        });
      });
    }

    const getSpec = (path: string[], fallback = 'N/A') => {
      let cur: unknown = normalizedSpecs;

      for (const p of path) {
        if (!cur || typeof cur !== 'object') {
          return fallback;
        }
        cur = (cur as Record<string, unknown>)[p];
      }

      if (cur === undefined || cur === null || cur === '') {
        return fallback;
      }

      return String(cur);
    };

    const deviceDetail = {
      name: phone.name || `${parsed.brand} ${parsed.model}`,
      img: phone.image || 'https://via.placeholder.com/300x400?text=Phone+Image',
      rawSpecs: phone.specs || phone.specifications || null,
      quickSpec: [
        { name: 'Display', value: getSpec(['display', 'size']) },
        { name: 'Processor', value: getSpec(['performance', 'processor']) },
        { name: 'RAM', value: getSpec(['performance', 'ram']) },
        { name: 'Storage', value: getSpec(['performance', 'storage']) },
        { name: 'Battery', value: getSpec(['battery', 'capacity']) }
      ],
      detailSpec: [
        {
          category: 'Display',
          specifications: [
            { name: 'Size', value: getSpec(['display', 'size']) },
            { name: 'Resolution', value: getSpec(['display', 'resolution']) },
            { name: 'Type', value: getSpec(['display', 'type']) },
            { name: 'Refresh Rate', value: getSpec(['display', 'refresh_rate']) }
          ]
        },
        {
          category: 'Performance',
          specifications: [
            { name: 'Processor', value: getSpec(['performance', 'processor']) },
            { name: 'RAM', value: getSpec(['performance', 'ram']) },
            { name: 'Storage', value: getSpec(['performance', 'storage']) },
            { name: 'GPU', value: getSpec(['performance', 'gpu']) }
          ]
        },
        {
          category: 'Camera',
          specifications: [
            { name: 'Main Camera', value: getSpec(['camera', 'main']) },
            { name: 'Front Camera', value: getSpec(['camera', 'front']) },
            { name: 'Video', value: getSpec(['camera', 'video']) }
          ]
        },
        {
          category: 'Battery & Charging',
          specifications: [
            { name: 'Capacity', value: getSpec(['battery', 'capacity']) },
            { name: 'Wired Charging', value: getSpec(['battery', 'charging']) },
            { name: 'Wireless Charging', value: getSpec(['battery', 'wireless']) }
          ]
        },
        {
          category: 'Design & Build',
          specifications: [
            { name: 'Dimensions', value: getSpec(['design', 'dimensions']) },
            { name: 'Weight', value: getSpec(['design', 'weight']) },
            { name: 'Materials', value: getSpec(['design', 'materials']) },
            { name: 'Colors', value: getSpec(['design', 'colors']) }
          ]
        },
        {
          category: 'Connectivity',
          specifications: [
            { name: 'Network', value: getSpec(['connectivity', 'network']) },
            { name: 'WiFi', value: getSpec(['connectivity', 'wifi']) },
            { name: 'Bluetooth', value: getSpec(['connectivity', 'bluetooth']) },
            { name: 'GPS', value: getSpec(['connectivity', 'gps']) }
          ]
        },
        {
          category: 'Software',
          specifications: [
            { name: 'OS', value: getSpec(['software', 'os']) },
            { name: 'UI', value: getSpec(['software', 'ui']) }
          ]
        }
      ]
    };

    return NextResponse.json({
      device: deviceDetail,
      message: 'Device details from RapidAPI Mobile Phone Specs Database'
    });
  } catch (error) {
    console.error('Error in device detail API:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch device details',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Check your RapidAPI key configuration and verify brand/model values.'
      },
      { status: 500 }
    );
  }
}
