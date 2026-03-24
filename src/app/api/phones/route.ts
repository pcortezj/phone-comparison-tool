import { NextResponse } from 'next/server';
import { phoneAPIClient } from '@/lib/phone-api-client';

export async function GET() {
  try {
    const brands = await phoneAPIClient.getBrands();
    console.log(brands);
    return NextResponse.json({ 
      brands: brands.map(brand => ({
        id: brand.brandValue,
        name: brand.brandValue,
        devices: 0 // We don't have device count from this endpoint
      })),
      message: 'Brands from RapidAPI Mobile Phone Specs Database'
    });
  } catch (error) {
    console.error('Error in brands API:', error.stack);
    
    return NextResponse.json({ 
      error: 'Failed to fetch brands', 
      details: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Check your RapidAPI key configuration'
    }, { status: 500 });
  }
} 