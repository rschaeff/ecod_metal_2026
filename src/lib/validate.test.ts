import { describe, expect, it } from 'vitest';
import { isReasonableId, MAX_ID_LEN, MAX_QUERY_LEN } from './validate';

describe('isReasonableId', () => {
  it('accepts realistic ECOD/UniProt/PDB-shaped strings', () => {
    expect(isReasonableId('e3h35A1')).toBe(true);
    expect(isReasonableId('3380.1')).toBe(true);
    expect(isReasonableId('K0F0N5_F1_nD1')).toBe(true);
    expect(isReasonableId('4hhb')).toBe(true);
  });

  it('rejects empty / whitespace-only / non-string input', () => {
    expect(isReasonableId('')).toBe(false);
    expect(isReasonableId(undefined)).toBe(false);
    expect(isReasonableId(null)).toBe(false);
    expect(isReasonableId(42)).toBe(false);
    expect(isReasonableId(['x'])).toBe(false);
  });

  it('rejects strings longer than the configured cap', () => {
    expect(isReasonableId('a'.repeat(MAX_ID_LEN))).toBe(true);
    expect(isReasonableId('a'.repeat(MAX_ID_LEN + 1))).toBe(false);
  });

  it('honors a custom cap', () => {
    expect(isReasonableId('hello', 5)).toBe(true);
    expect(isReasonableId('hello!', 5)).toBe(false);
  });

  it('exposes a sensible default for query length', () => {
    expect(MAX_QUERY_LEN).toBeGreaterThan(0);
    expect(MAX_QUERY_LEN).toBeLessThanOrEqual(1000);
  });
});
