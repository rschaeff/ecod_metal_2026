interface CacheEntry<T> {
  value: T;
  expires: number;
}

const DEFAULT_MAX_ENTRIES = 5000;

/**
 * In-memory LRU cache with per-entry TTL. Map iteration order is insertion
 * order in JS, so the oldest key is `cache.keys().next().value`. `get` and
 * `set` re-insert to bump entries to the MRU end; `set` evicts the LRU when
 * the entry count exceeds `maxEntries`.
 *
 * The size cap is a DoS defense: every public route that takes a
 * user-controlled string (search q, domain id, h-group id, …) feeds it into
 * a cache key. Without a cap, an attacker can issue requests with distinct
 * IDs to grow the cache without bound.
 */
class TTLCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    private cleanupIntervalMs: number = 60000,
    private maxEntries: number = DEFAULT_MAX_ENTRIES,
  ) {
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
    }
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }

    // Bump to MRU end. Map iteration order is insertion order, so re-inserting
    // moves this key to the back of the LRU list.
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    // Re-inserting an existing key would otherwise keep it in its old LRU
    // slot; delete-then-set bumps it to the MRU end.
    if (this.cache.has(key)) this.cache.delete(key);
    this.cache.set(key, { value, expires: Date.now() + ttlMs });

    while (this.cache.size > this.maxEntries) {
      const oldest = this.cache.keys().next().value;
      if (oldest === undefined) break;
      this.cache.delete(oldest);
    }
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  /** Current entry count — exposed for tests and observability, not for caller use. */
  size(): number {
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

export { TTLCache };

export const CACHE_TTL = {
  SUMMARY: 10 * 60 * 1000,
  FAMILY: 30 * 60 * 1000,
  DOMAIN: 60 * 60 * 1000,
  SEARCH: 5 * 60 * 1000,
} as const;

export const HTTP_CACHE_MAX_AGE = {
  SUMMARY: 600,
  FAMILY: 1800,
  DOMAIN: 3600,
  SEARCH: 300,
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const summaryCache = new TTLCache<any>(10 * 60 * 1000);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const familyCache = new TTLCache<any>(30 * 60 * 1000);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const domainCache = new TTLCache<any>(60 * 60 * 1000);

export async function cachedQuery<T>(
  cache: TTLCache<T>,
  key: string,
  ttlMs: number,
  queryFn: () => Promise<T>
): Promise<T> {
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const result = await queryFn();
  cache.set(key, result, ttlMs);
  return result;
}
