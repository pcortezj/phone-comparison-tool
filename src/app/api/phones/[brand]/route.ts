import { NextResponse } from 'next/server';
import { getDevicesByBrand } from '@/lib/phone-catalog';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ brand: string }> }
) {
  let brand = 'unknown';
  try {
    brand = (await params).brand;
    const devices = await getDevicesByBrand(brand);

    return NextResponse.json({
      devices,
      total: devices.length,
      page: 1,
      message: `Devices for brand ${brand}`
    });
  } catch (error) {
    console.error(`Error in devices API for brand ${brand}:`, error);

    return NextResponse.json({
      error: 'Failed to fetch devices',
      details: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Import a JSON dataset into the local catalog first'
    }, { status: 500 });
  }
}
