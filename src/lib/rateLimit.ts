// Fixed-window per-IP rate limiter for the public REST API. In-memory only —
// a single Next.js server process is the assumed deployment shape; behind a
// load balancer with multiple replicas, swap this for a shared store
// (Redis/Upstash) so the window is consistent across instances.
//
// Defaults: 1500 requests per 60-second window. Tunable via env:
//   TRICYP_API_RATE_LIMIT     integer requests per window (default 1500)
//   TRICYP_API_RATE_WINDOW_MS milliseconds in the window (default 60_000)
//
// Sized to absorb Next.js viewport-prefetch fan-out: a single page render on
// /family or the H-group browser auto-issues an RSC prefetch for every
// visible <Link> (50+ requests), and the prefetch-exemption signal we tried
// (next-router-prefetch / next-router-segment-prefetch headers) doesn't
// reliably reach edge middleware on Next 16. With prefetches counted, an
// active researcher would burn through 300 in a few clicks. 1500/min is
// roomy for legitimate use but still well below sustained-abuse levels —
// the LRU cache cap and per-route input length checks remain the
// load-bearing protections.

const DEFAULT_LIMIT = 1500;
const DEFAULT_WINDOW_MS = 60_000;
const CLEANUP_THRESHOLD = 10_000; // prune buckets when the map gets this big

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const v = parseInt(raw, 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

const LIMIT = envInt('TRICYP_API_RATE_LIMIT', DEFAULT_LIMIT);
const WINDOW_MS = envInt('TRICYP_API_RATE_WINDOW_MS', DEFAULT_WINDOW_MS);

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;       // milliseconds until the current window ends
  retryAfterSec?: number; // populated only when blocked
}

/**
 * Record a hit for the given key (typically client IP) and decide whether the
 * request is allowed. Counts increment within a single window; when the
 * window rolls over, the count resets.
 */
export function rateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    if (buckets.size > CLEANUP_THRESHOLD) pruneStaleBuckets(now);
    return {
      allowed: true,
      limit: LIMIT,
      remaining: LIMIT - 1,
      resetMs: WINDOW_MS,
    };
  }

  bucket.count += 1;
  const resetMs = WINDOW_MS - (now - bucket.windowStart);

  if (bucket.count > LIMIT) {
    return {
      allowed: false,
      limit: LIMIT,
      remaining: 0,
      resetMs,
      retryAfterSec: Math.max(1, Math.ceil(resetMs / 1000)),
    };
  }

  return {
    allowed: true,
    limit: LIMIT,
    remaining: LIMIT - bucket.count,
    resetMs,
  };
}

function pruneStaleBuckets(now: number): void {
  for (const [k, b] of buckets) {
    if (now - b.windowStart >= WINDOW_MS) buckets.delete(k);
  }
}

/** Build the standard rate-limit headers from a result. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetMs / 1000)),
  };
  if (result.retryAfterSec !== undefined) {
    headers['Retry-After'] = String(result.retryAfterSec);
  }
  return headers;
}

export const RATE_LIMIT_CONFIG = { limit: LIMIT, windowMs: WINDOW_MS } as const;
