import { NextResponse } from 'next/server';
import { getBrands, getCatalogStats, importPhoneData, listImportFiles } from '@/lib/phone-catalog';

const ADMIN_IMPORT_TOKEN = process.env.ADMIN_IMPORT_TOKEN;
const isProduction = process.env.NODE_ENV === 'production';

const getAdminAccessError = (request: Request) => {
  if (!ADMIN_IMPORT_TOKEN) {
    return isProduction
      ? NextResponse.json(
          {
            error: 'Admin imports are disabled',
            details: 'Set ADMIN_IMPORT_TOKEN on the server to enable protected catalog maintenance.',
          },
          { status: 503 }
        )
      : null;
  }

  const token = request.headers.get('x-admin-token') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (token !== ADMIN_IMPORT_TOKEN) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        details: 'A valid admin token is required to manage catalog imports.',
      },
      { status: 401 }
    );
  }

  return null;
};

export async function POST(request: Request) {
  const adminAccessError = getAdminAccessError(request);
  if (adminAccessError) {
    return adminAccessError;
  }

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

export async function GET(request: Request) {
  const adminAccessError = getAdminAccessError(request);
  if (adminAccessError) {
    return adminAccessError;
  }

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
