import { NextResponse } from 'next/server';
import { summaryCache, CACHE_TTL, HTTP_CACHE_MAX_AGE, cachedQuery } from '@/lib/cache';
import { getDashboardSummary, getXGroupBreakdown } from '@/lib/queries';
import type { DashboardSummary, XGroupBreakdown } from '@/types/cysteine';

export const revalidate = 600;

export async function GET() {
  try {
    const [summary, xGroups] = await Promise.all([
      cachedQuery<DashboardSummary>(summaryCache, 'dashboard-summary', CACHE_TTL.SUMMARY, getDashboardSummary),
      cachedQuery<XGroupBreakdown[]>(summaryCache, 'xgroup-breakdown', CACHE_TTL.SUMMARY, getXGroupBreakdown),
    ]);

    return NextResponse.json(
      { success: true, data: { summary, xGroups } },
      {
        headers: {
          'Cache-Control': `public, max-age=${HTTP_CACHE_MAX_AGE.SUMMARY}, stale-while-revalidate=60`,
        },
      }
    );
  } catch (error) {
    console.error('Error fetching summary:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SUMMARY_ERROR', message: 'Failed to fetch summary statistics' } },
      { status: 500 }
    );
  }
}
