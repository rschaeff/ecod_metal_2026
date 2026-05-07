import { NextResponse } from 'next/server';
import { summaryCache, CACHE_TTL, HTTP_CACHE_MAX_AGE, cachedQuery } from '@/lib/cache';
import { getHGroupDetail } from '@/lib/queries';
import { isReasonableId } from '@/lib/validate';

// Public read-only API per TRICYP_SPEC §11. Mirrors the family route's
// envelope shape: { success, data, error }.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ hGroupId: string }> },
) {
  const { hGroupId: raw } = await params;
  const hGroupId = decodeURIComponent(raw);

  if (!isReasonableId(hGroupId)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_ID', message: 'Invalid H-group ID' } },
      { status: 400 },
    );
  }

  try {
    const detail = await cachedQuery(
      summaryCache,
      `hgroup-detail-${hGroupId}`,
      CACHE_TTL.FAMILY,
      () => getHGroupDetail(hGroupId),
    );

    if (!detail) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: `H-group ${hGroupId} not found` } },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, data: detail },
      {
        headers: {
          'Cache-Control': `public, max-age=${HTTP_CACHE_MAX_AGE.FAMILY}, stale-while-revalidate=60`,
        },
      },
    );
  } catch (error) {
    console.error('Error fetching H-group:', error);
    return NextResponse.json(
      { success: false, error: { code: 'HGROUP_ERROR', message: 'Failed to fetch H-group data' } },
      { status: 500 },
    );
  }
}
