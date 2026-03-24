import { NextResponse } from 'next/server';
import { phoneAPIClient } from '@/lib/phone-api-client';

export async function GET(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }>}
) {
  let id = 'unknown';
  try {
    id = (await params).id;

    const url = new URL(request.url);
    const brandParam = url.searchParams.get('brand');
    const modelParam = url.searchParams.get('model');

    let phone;

    if (brandParam && modelParam) {
      phone = await phoneAPIClient.getPhoneDetailsByBrandModel(brandParam, modelParam);
    } else if (id.includes('/')) {
      const [brand, model] = id.split('/');
      phone = await phoneAPIClient.getPhoneDetailsByBrandModel(brand, model);
    } else if (id.includes('-')) {
      const segments = id.split('-');
      const brand = segments[0];
      const model = segments.slice(1).join('-');
      if (model.length > 0) {
        phone = await phoneAPIClient.getPhoneDetailsByBrandModel(brand, model);
      } else {
        phone = await phoneAPIClient.getPhoneDetails(id);
      }
    } else if (id.includes('_')) {
      const segments = id.split('_');
      const brand = segments[0];
      const model = segments.slice(1).join('_');
      if (model.length > 0) {
        phone = await phoneAPIClient.getPhoneDetailsByBrandModel(brand, model);
      } else {
        phone = await phoneAPIClient.getPhoneDetails(id);
      }
    } else {
      phone = await phoneAPIClient.getPhoneDetails(id);
    }

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

    const rawSpecifications = (phone as unknown as { specifications?: unknown }).specifications;
    if (!phone.specs && Array.isArray(rawSpecifications)) {
      rawSpecifications.forEach((section) => {
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

    const getSpec = (path: string[], fallback?: string) => {
      let cur: unknown = normalizedSpecs;
      for (const p of path) {
        if (!cur || typeof cur !== 'object') {
          cur = undefined;
          break;
        }
        cur = (cur as Record<string, unknown>)[p];
      }
      if (cur === undefined || cur === null || cur === '') {
        return fallback ?? 'N/A';
      }
      return String(cur);
    };

    // Transform the data to match the expected format
    const deviceDetail = {
      name: phone.name,
      img: phone.image || 'https://via.placeholder.com/300x400?text=Phone+Image',
      rawSpecs: (phone as unknown as { specs?: unknown; specifications?: unknown }).specs || (phone as unknown as { specs?: unknown; specifications?: unknown }).specifications || null,
      quickSpec: [
        { name: 'Display', value: getSpec(['display','size']) },
        { name: 'Processor', value: getSpec(['performance','processor']) },
        { name: 'RAM', value: getSpec(['performance','ram']) },
        { name: 'Storage', value: getSpec(['performance','storage']) },
        { name: 'Battery', value: getSpec(['battery','capacity']) }
      ],
      detailSpec: [
        {
          category: 'Display',
          specifications: [
            { name: 'Size', value: getSpec(['display','size']) },
            { name: 'Resolution', value: getSpec(['display','resolution']) },
            { name: 'Type', value: getSpec(['display','type']) },
            { name: 'Refresh Rate', value: getSpec(['display','refresh_rate']) }
          ]
        },
        {
          category: 'Performance',
          specifications: [
            { name: 'Processor', value: getSpec(['performance','processor']) },
            { name: 'RAM', value: getSpec(['performance','ram']) },
            { name: 'Storage', value: getSpec(['performance','storage']) },
            { name: 'GPU', value: getSpec(['performance','gpu']) }
          ]
        },
        {
          category: 'Camera',
          specifications: [
            { name: 'Main Camera', value: getSpec(['camera','main']) },
            { name: 'Front Camera', value: getSpec(['camera','front']) },
            { name: 'Video', value: getSpec(['camera','video']) }
          ]
        },
        {
          category: 'Battery & Charging',
          specifications: [
            { name: 'Capacity', value: getSpec(['battery','capacity']) },
            { name: 'Wired Charging', value: getSpec(['battery','charging']) },
            { name: 'Wireless Charging', value: getSpec(['battery','wireless']) }
          ]
        },
        {
          category: 'Design & Build',
          specifications: [
            { name: 'Dimensions', value: getSpec(['design','dimensions']) },
            { name: 'Weight', value: getSpec(['design','weight']) },
            { name: 'Materials', value: getSpec(['design','materials']) },
            { name: 'Colors', value: getSpec(['design','colors']) || 'N/A' }
          ]
        },
        {
          category: 'Connectivity',
          specifications: [
            { name: 'Network', value: getSpec(['connectivity','network']) },
            { name: 'WiFi', value: getSpec(['connectivity','wifi']) },
            { name: 'Bluetooth', value: getSpec(['connectivity','bluetooth']) },
            { name: 'GPS', value: getSpec(['connectivity','gps']) }
          ]
        },
        {
          category: 'Software',
          specifications: [
            { name: 'OS', value: getSpec(['software','os']) },
            { name: 'UI', value: getSpec(['software','ui']) }
          ]
        }
      ]
    };
    
    return NextResponse.json({ 
      device: deviceDetail,
      message: 'Device details from RapidAPI Mobile Phone Specs Database'
    });
  } catch (error) {
    console.error(`Error in device detail API for device ${(await params).id}:`, error);
    
    return NextResponse.json({ 
      error: 'Failed to fetch device details', 
      details: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Check your RapidAPI key configuration'
    }, { status: 500 });
  }
} 