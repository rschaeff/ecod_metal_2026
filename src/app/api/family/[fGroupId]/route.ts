import { NextRequest, NextResponse } from 'next/server';
import { familyCache, CACHE_TTL, HTTP_CACHE_MAX_AGE, cachedQuery } from '@/lib/cache';
import { getFamilyInfo, getFamilyDomains } from '@/lib/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fGroupId: string }> }
) {
  const { fGroupId } = await params;

  if (!fGroupId) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_ID', message: 'Invalid family group ID' } },
      { status: 400 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const sortBy = searchParams.get('sortBy') || 'domain_id';
  const sortDir = (searchParams.get('sortDir') || 'asc') as 'asc' | 'desc';

  try {
    const [familyInfo, domains] = await Promise.all([
      cachedQuery(familyCache, `family-info-${fGroupId}`, CACHE_TTL.FAMILY, () => getFamilyInfo(fGroupId)),
      cachedQuery(familyCache, `family-domains-${fGroupId}-${page}-${limit}-${sortBy}-${sortDir}`, CACHE_TTL.FAMILY,
        () => getFamilyDomains(fGroupId, page, limit, sortBy, sortDir)),
    ]);

    if (!familyInfo) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: `Family group ${fGroupId} not found` } },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          family: familyInfo,
          domains: domains.items,
          pagination: {
            total: domains.total,
            page,
            limit,
            totalPages: Math.ceil(domains.total / limit),
          },
        },
      },
      {
        headers: {
          'Cache-Control': `public, max-age=${HTTP_CACHE_MAX_AGE.FAMILY}, stale-while-revalidate=60`,
        },
      }
    );
  } catch (error) {
    console.error('Error fetching family:', error);
    return NextResponse.json(
      { success: false, error: { code: 'FAMILY_ERROR', message: 'Failed to fetch family data' } },
      { status: 500 }
    );
  }
}
