import { NextResponse } from 'next/server';
import { searchDevices } from '@/lib/phone-catalog';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const brand = url.searchParams.get('brand') || undefined;
    const yearParam = url.searchParams.get('year');
    const releaseYear = yearParam ? Number.parseInt(yearParam, 10) : undefined;

    const devices = await searchDevices(
      query,
      brand,
      typeof releaseYear === 'number' && Number.isFinite(releaseYear) ? releaseYear : undefined
    );

    return NextResponse.json({
      devices,
      total: devices.length,
      message: 'Search results from the local catalog',
    });
  } catch (error) {
    console.error('Error searching devices:', error);

    return NextResponse.json(
      {
        error: 'Failed to search devices',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
