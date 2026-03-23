interface CacheEntry<T> {
  value: T;
  expires: number;
}

class TTLCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private cleanupIntervalMs: number = 60000) {
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

    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttlMs,
    });
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
