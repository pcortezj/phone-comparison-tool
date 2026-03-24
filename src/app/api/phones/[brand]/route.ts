import { NextResponse } from 'next/server';
import { phoneAPIClient } from '@/lib/phone-api-client';

export async function GET(
  request: Request,
  { params }: { params: { brand: string } | Promise<{ brand: string }> }
) {
  let brand = 'unknown';
  try {
    // Await params before using its properties (required by Next.js)
    brand = (await params).brand;
    // Fetch models for the selected brand (array of { modelValue: string })
    const models = await phoneAPIClient.getPhonesByBrand(brand);
    console.log(`Models for brand ${brand}:`, models);

    // Transform for frontend (e.g., for a select box)
    // Use modelValue as name and a deterministic id (you can change id generation if needed)
    const devices = models.map((model) => ({
      id: `${encodeURIComponent(brand)}::${encodeURIComponent(model.modelValue)}`,
      name: model.modelValue,
      img: 'https://via.placeholder.com/300x400?text=Phone+Image',
      description: model.modelValue
    }));

    return NextResponse.json({
      devices,
      total: devices.length,
      page: 1,
      message: `Models for brand ${brand} from RapidAPI Mobile Phone Specs Database`
    });
  } catch (error) {
    console.error(`Error in devices API for brand ${brand}:`, error);

    return NextResponse.json({
      error: 'Failed to fetch devices',
      details: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Check your RapidAPI key configuration'
    }, { status: 500 });
  }
}