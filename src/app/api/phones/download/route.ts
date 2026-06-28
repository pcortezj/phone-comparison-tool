import { NextResponse } from 'next/server';
import { getBrands, getCatalogStats, importPhoneData, listImportFiles } from '@/lib/phone-catalog';

export async function POST(request: Request) {
  try {
    const { fileName, importAll } = await request.json();
    const report = await importPhoneData(importAll ? undefined : fileName);
    const stats = await getCatalogStats();

    return NextResponse.json({
      success: true,
      message: report.files.length === 0 ? 'No import files found' : 'Import completed successfully',
      importedCount: report.imported,
      skippedCount: report.skipped,
      files: report.files,
      stats
    });

  } catch (error) {
    console.error('Error in download API:', error);
    
    return NextResponse.json({ 
      error: 'Import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const [brands, importFiles, stats] = await Promise.all([
      getBrands(),
      listImportFiles(),
      getCatalogStats()
    ]);
    
    return NextResponse.json({
      brands: brands.map((brand) => ({
        id: brand.id,
        name: brand.name,
        deviceCount: brand.devices
      })),
      importFiles,
      stats,
      message: 'Local phone catalog admin'
    });
  } catch (error) {
    console.error('Error fetching catalog admin data:', error);
    
    return NextResponse.json({ 
      error: 'Failed to fetch catalog admin data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
