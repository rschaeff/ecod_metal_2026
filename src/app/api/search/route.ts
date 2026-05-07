import { NextRequest, NextResponse } from 'next/server';
import { summaryCache, CACHE_TTL, HTTP_CACHE_MAX_AGE, cachedQuery } from '@/lib/cache';
import { searchQuery } from '@/lib/queries';
import { MAX_QUERY_LEN } from '@/lib/validate';
import type { SearchResult } from '@/types/cysteine';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';
  const trimmed = q.trim();

  if (trimmed.length < 2) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_QUERY', message: 'Query must be at least 2 characters' } },
      { status: 400 }
    );
  }
  if (trimmed.length > MAX_QUERY_LEN) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_QUERY', message: `Query must be at most ${MAX_QUERY_LEN} characters` } },
      { status: 400 }
    );
  }

  try {
    const results = await cachedQuery<SearchResult[]>(
      summaryCache,
      `search-${q.trim().toLowerCase()}`,
      CACHE_TTL.SEARCH,
      () => searchQuery(q)
    );

    return NextResponse.json(
      { success: true, data: results },
      {
        headers: {
          'Cache-Control': `public, max-age=${HTTP_CACHE_MAX_AGE.SEARCH}, stale-while-revalidate=30`,
        },
      }
    );
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SEARCH_ERROR', message: 'Search failed' } },
      { status: 500 }
    );
  }
}
