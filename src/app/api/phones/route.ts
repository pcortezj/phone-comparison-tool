import { NextResponse } from 'next/server';
import { getBrands, getReleaseYears } from '@/lib/phone-catalog';

export async function GET() {
  try {
    const [brands, releaseYears] = await Promise.all([getBrands(), getReleaseYears()]);

    return NextResponse.json({ 
      brands,
      releaseYears,
      message: 'Phone brands from the local catalog'
    });
  } catch (error) {
    console.error('Error in brands API:', error);
    
    return NextResponse.json({ 
      error: 'Failed to fetch brands', 
      details: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Import a JSON dataset into the local catalog first'
    }, { status: 500 });
  }
} 
