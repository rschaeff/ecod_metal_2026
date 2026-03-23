import { NextResponse } from 'next/server';
import { domainCache, CACHE_TTL, HTTP_CACHE_MAX_AGE, cachedQuery } from '@/lib/cache';
import { getDomainDetail, getDomainClassifications, getDomainEvidence } from '@/lib/queries';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ domainId: string }> }
) {
  const { domainId } = await params;

  try {
    const domainInfo = await cachedQuery(
      domainCache,
      `domain-info-${domainId}`,
      CACHE_TTL.DOMAIN,
      () => getDomainDetail(domainId)
    );

    if (!domainInfo) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: `Domain ${domainId} not found` } },
        { status: 404 }
      );
    }

    const [classifications, evidence] = await Promise.all([
      cachedQuery(domainCache, `domain-class-${domainInfo.id}`, CACHE_TTL.DOMAIN,
        () => getDomainClassifications(domainInfo.id)),
      cachedQuery(domainCache, `domain-evidence-${domainInfo.id}`, CACHE_TTL.DOMAIN,
        () => getDomainEvidence(domainInfo.id)),
    ]);

    return NextResponse.json(
      { success: true, data: { domain: domainInfo, classifications, evidence } },
      {
        headers: {
          'Cache-Control': `public, max-age=${HTTP_CACHE_MAX_AGE.DOMAIN}, stale-while-revalidate=60`,
        },
      }
    );
  } catch (error) {
    console.error('Error fetching domain:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DOMAIN_ERROR', message: 'Failed to fetch domain data' } },
      { status: 500 }
    );
  }
}
