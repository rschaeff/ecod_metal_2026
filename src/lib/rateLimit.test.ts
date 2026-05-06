import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rateLimit, rateLimitHeaders, RATE_LIMIT_CONFIG } from './rateLimit';

// Use a stable monotonic clock to remove flakiness from window-rollover tests.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
});
afterEach(() => {
  vi.useRealTimers();
});

// Each test uses a fresh key so module-level state can't bleed across tests.
let nextKey = 0;
function freshKey(): string {
  return `test-${nextKey++}-${Date.now()}`;
}

describe('rateLimit', () => {
  it('allows the first request and reports remaining = limit - 1', () => {
    const result = rateLimit(freshKey());
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(RATE_LIMIT_CONFIG.limit);
    expect(result.remaining).toBe(RATE_LIMIT_CONFIG.limit - 1);
    expect(result.resetMs).toBe(RATE_LIMIT_CONFIG.windowMs);
    expect(result.retryAfterSec).toBeUndefined();
  });

  it('decrements remaining on each subsequent allowed call within the window', () => {
    const key = freshKey();
    rateLimit(key); // remaining = limit-1
    const result = rateLimit(key);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(RATE_LIMIT_CONFIG.limit - 2);
  });

  it('blocks the request immediately past the limit and reports retry-after', () => {
    const key = freshKey();
    let last = rateLimit(key);
    for (let i = 1; i < RATE_LIMIT_CONFIG.limit; i++) {
      last = rateLimit(key);
    }
    expect(last.allowed).toBe(true);
    expect(last.remaining).toBe(0);

    const blocked = rateLimit(key);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
    expect(blocked.retryAfterSec).toBeLessThanOrEqual(
      Math.ceil(RATE_LIMIT_CONFIG.windowMs / 1000),
    );
  });

  it('resets the bucket after the window rolls over', () => {
    const key = freshKey();
    for (let i = 0; i < RATE_LIMIT_CONFIG.limit; i++) rateLimit(key);
    expect(rateLimit(key).allowed).toBe(false);

    vi.advanceTimersByTime(RATE_LIMIT_CONFIG.windowMs + 1);
    const fresh = rateLimit(key);
    expect(fresh.allowed).toBe(true);
    expect(fresh.remaining).toBe(RATE_LIMIT_CONFIG.limit - 1);
  });

  it('treats distinct keys as independent buckets', () => {
    const a = freshKey();
    const b = freshKey();
    for (let i = 0; i < RATE_LIMIT_CONFIG.limit; i++) rateLimit(a);
    expect(rateLimit(a).allowed).toBe(false);
    expect(rateLimit(b).allowed).toBe(true);
  });
});

describe('rateLimitHeaders', () => {
  it('emits standard rate-limit headers when allowed', () => {
    const headers = rateLimitHeaders({
      allowed: true,
      limit: 100,
      remaining: 42,
      resetMs: 30_000,
    });
    expect(headers['X-RateLimit-Limit']).toBe('100');
    expect(headers['X-RateLimit-Remaining']).toBe('42');
    expect(headers['X-RateLimit-Reset']).toBe('30');
    expect(headers['Retry-After']).toBeUndefined();
  });

  it('adds Retry-After when blocked', () => {
    const headers = rateLimitHeaders({
      allowed: false,
      limit: 100,
      remaining: 0,
      resetMs: 12_000,
      retryAfterSec: 12,
    });
    expect(headers['Retry-After']).toBe('12');
  });
});
