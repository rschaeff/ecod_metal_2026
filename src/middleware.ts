import { NextResponse, type NextRequest } from 'next/server';
import { rateLimit, rateLimitHeaders } from '@/lib/rateLimit';

export const config = {
  // Rate-limit the public REST API plus the dynamic page routes that hit the
  // same DB-backed query / cache layer. Static pages (/, /about, /benchmark,
  // /downloads, /paper, etc.) don't take user-controlled IDs, so they're
  // exempt. Without page coverage an attacker could flood /h-group/<rand>
  // and bypass the API-only limit.
  matcher: [
    '/api/:path*',
    '/h-group/:path*',
    '/family/:path*',
    '/x-group/:path*',
    '/domain/:path*',
  ],
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
