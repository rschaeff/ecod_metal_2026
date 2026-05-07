import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { TTLCache } from './cache';

// Override the TTLCache constructor's setInterval-based sweeper for the
// duration of these tests; we don't want stray timers leaking between cases.
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('TTLCache LRU eviction', () => {
  it('evicts the least-recently-used entry when over capacity', () => {
    const cache = new TTLCache<number>(60_000, /* maxEntries */ 3);
    cache.set('a', 1, 60_000);
    cache.set('b', 2, 60_000);
    cache.set('c', 3, 60_000);
    expect(cache.size()).toBe(3);

    // Adding a 4th entry evicts the LRU ('a' is the oldest, untouched).
    cache.set('d', 4, 60_000);
    expect(cache.size()).toBe(3);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
    expect(cache.get('d')).toBe(4);
  });

  it('get bumps an entry to MRU so it survives subsequent eviction', () => {
    const cache = new TTLCache<number>(60_000, 3);
    cache.set('a', 1, 60_000);
    cache.set('b', 2, 60_000);
    cache.set('c', 3, 60_000);

    // Touch 'a' so it becomes MRU; 'b' is now the oldest.
    expect(cache.get('a')).toBe(1);

    cache.set('d', 4, 60_000);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(1);
    expect(cache.get('c')).toBe(3);
    expect(cache.get('d')).toBe(4);
  });

  it('updating an existing key bumps it to MRU', () => {
    const cache = new TTLCache<number>(60_000, 3);
    cache.set('a', 1, 60_000);
    cache.set('b', 2, 60_000);
    cache.set('c', 3, 60_000);

    // Re-set 'a' with a new value — should bump to MRU and not grow size.
    cache.set('a', 99, 60_000);
    expect(cache.size()).toBe(3);

    cache.set('d', 4, 60_000);
    // 'b' (oldest after 'a' bump) should be evicted, not 'a'.
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(99);
  });

  it('bounds memory under flooding with distinct keys', () => {
    // Simulate the DoS scenario: an attacker issues 10x the cap of distinct
    // requests. The cache must stay at the cap.
    const cache = new TTLCache<number>(60_000, 100);
    for (let i = 0; i < 1000; i++) {
      cache.set(`flood-${i}`, i, 60_000);
    }
    expect(cache.size()).toBe(100);
    // The oldest 900 keys are gone; the most recent 100 survive.
    expect(cache.get('flood-0')).toBeUndefined();
    expect(cache.get('flood-899')).toBeUndefined();
    expect(cache.get('flood-900')).toBe(900);
    expect(cache.get('flood-999')).toBe(999);
  });
});

describe('TTLCache TTL expiry (preserved behaviour)', () => {
  it('returns undefined for expired entries and removes them on read', () => {
    const cache = new TTLCache<string>(60_000, 100);
    cache.set('k', 'v', 1_000);
    expect(cache.get('k')).toBe('v');

    vi.advanceTimersByTime(2_000);
    expect(cache.get('k')).toBeUndefined();
    expect(cache.size()).toBe(0);
  });
});
