import { NextResponse, type NextRequest } from 'next/server';
import { rateLimit, rateLimitHeaders } from '@/lib/rateLimit';

export const config = {
  // Apply only to /api/* (REST surface). Static asset routes and the rest of
  // the app are unaffected.
  matcher: ['/api/:path*'],
};

function clientIp(req: NextRequest): string {
  // Behind a reverse proxy, x-forwarded-for is the canonical source. Take the
  // leftmost entry (originating client). Fall back to x-real-ip, then 'local'
  // for direct dev requests where neither is set.
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const xrip = req.headers.get('x-real-ip');
  if (xrip) return xrip.trim();
  return 'local';
}

export function middleware(req: NextRequest) {
  const ip = clientIp(req);
  const result = rateLimit(`api:${ip}`);
  const headers = rateLimitHeaders(result);

  if (!result.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: `Too many requests. Retry after ${result.retryAfterSec ?? 60} seconds.`,
        },
      },
      { status: 429, headers },
    );
  }

  const res = NextResponse.next();
  for (const [k, v] of Object.entries(headers)) res.headers.set(k, v);
  return res;
}
