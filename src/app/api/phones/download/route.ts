import { NextResponse } from 'next/server';
import { phoneAPIClient } from '@/lib/phone-api-client';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { brandId, downloadAll } = await request.json();
    
    let phones;
    let filename;

    if (downloadAll) {
      console.log('Starting download of all phones...');
      phones = await phoneAPIClient.downloadAllPhones();
      filename = 'all-phones.json';
    } else if (brandId) {
      console.log(`Starting download of ${brandId} phones...`);
      phones = await phoneAPIClient.downloadBrandPhones(brandId);
      filename = `${brandId}-phones.json`;
    } else {
      return NextResponse.json({ 
        error: 'Missing parameters. Provide either brandId or downloadAll: true' 
      }, { status: 400 });
    }

    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });

    // Save to file
    const filePath = path.join(dataDir, filename);
    await fs.writeFile(filePath, JSON.stringify(phones, null, 2));

    console.log(`Data saved to ${filePath}`);

    return NextResponse.json({
      success: true,
      message: `Downloaded ${phones.length} phones`,
      filename,
      filePath,
      phoneCount: phones.length
    });

  } catch (error) {
    console.error('Error in download API:', error);
    
    return NextResponse.json({ 
      error: 'Download failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get available brands
    const brands = await phoneAPIClient.getBrands();
    
    return NextResponse.json({
      brands,
      message: 'Available brands for download'
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    
    return NextResponse.json({ 
      error: 'Failed to fetch brands',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 