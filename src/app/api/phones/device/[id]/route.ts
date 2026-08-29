import { NextResponse } from 'next/server';
import { getDeviceByBrandModel, getDeviceByEncodedId } from '@/lib/phone-catalog';
import { buildDeviceDetail } from '@/lib/device-detail';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }>}
) {
  let id = 'unknown';
  try {
    const rawId = (await params).id;
    try {
      id = decodeURIComponent(rawId);
    } catch {
      id = rawId;
    }

    const url = new URL(request.url);
    const brandParam = url.searchParams.get('brand');
    const modelParam = url.searchParams.get('model');

    let phone;

    if (brandParam && modelParam) {
      phone = await getDeviceByBrandModel(brandParam, modelParam);
    } else if (id.includes('/')) {
      const [brand, model] = id.split('/');
      phone = await getDeviceByBrandModel(brand, model);
    } else {
      phone = await getDeviceByEncodedId(id);
    }

    if (!phone) {
      return NextResponse.json({
        error: 'Device not found',
        details: `No catalog device matches "${id}"`,
      }, { status: 404 });
    }

    return NextResponse.json({
      device: buildDeviceDetail(phone),
      message: 'Device details from the local catalog'
    });
  } catch (error) {
    console.error(`Error in device detail API for device ${(await params).id}:`, error);

    return NextResponse.json({
      error: 'Failed to fetch device details',
      details: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Import a JSON dataset into the local catalog first'
    }, { status: 500 });
  }
}
