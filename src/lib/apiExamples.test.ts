import { describe, expect, it } from 'vitest';
import { API_ENDPOINTS, API_COMMON_ERROR_CODES } from './apiExamples';

describe('API_ENDPOINTS', () => {
  it('lists each endpoint path exactly once', () => {
    const paths = API_ENDPOINTS.map((ep) => ep.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('all paths start with /api/', () => {
    for (const ep of API_ENDPOINTS) {
      expect(ep.path.startsWith('/api/')).toBe(true);
    }
  });

  it('exampleRequest URL is consistent with path placeholders', () => {
    for (const ep of API_ENDPOINTS) {
      // Replace path placeholders with a regex pattern, then check the example
      // request matches up to query-string boundary.
      const pattern = ep.path.replace(/\{[^}]+\}/g, '[^/?]+');
      const re = new RegExp(`^${pattern}(\\?|$)`);
      expect(re.test(ep.exampleRequest)).toBe(true);
    }
  });

  it('exampleResponse is a non-empty string per endpoint', () => {
    for (const ep of API_ENDPOINTS) {
      expect(typeof ep.exampleResponse).toBe('string');
      expect(ep.exampleResponse.length).toBeGreaterThan(20);
      expect(ep.exampleResponse).toContain('"success"');
    }
  });

  it('errorCodes (when present) reference codes from API_COMMON_ERROR_CODES', () => {
    const known = new Set(API_COMMON_ERROR_CODES.map((e) => e.code));
    for (const ep of API_ENDPOINTS) {
      if (!ep.errorCodes) continue;
      for (const code of ep.errorCodes) {
        expect(known.has(code)).toBe(true);
      }
    }
  });
});

describe('API_COMMON_ERROR_CODES', () => {
  it('uses unique codes', () => {
    const codes = API_COMMON_ERROR_CODES.map((e) => e.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('uses valid HTTP status codes', () => {
    for (const e of API_COMMON_ERROR_CODES) {
      expect(e.status).toBeGreaterThanOrEqual(400);
      expect(e.status).toBeLessThan(600);
    }
  });

  it('includes the rate-limit and not-found codes referenced from middleware/routes', () => {
    const codes = new Set(API_COMMON_ERROR_CODES.map((e) => e.code));
    expect(codes.has('RATE_LIMITED')).toBe(true);
    expect(codes.has('NOT_FOUND')).toBe(true);
  });
});
