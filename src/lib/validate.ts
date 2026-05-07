// Input validation helpers for the public API surface.
//
// All real ECOD/UniProt/PDB identifiers are short — domain IDs ≤ ~20 chars,
// H/X/F-group IDs are dotted decimals (≤ ~20 chars), search queries are
// likewise short. Anything materially longer is either a bug or an attempt
// to inflate cache keys / DB work, both of which we want to reject at the
// route boundary before any query or cache write happens.

export const MAX_ID_LEN = 200;
export const MAX_QUERY_LEN = 200;

/**
 * Returns true when `raw` is a non-empty string within `[1, max]` characters.
 * Use as a type guard at API/page entry to reject empty or oversized inputs
 * before they reach the cache or the database.
 */
export function isReasonableId(raw: unknown, max: number = MAX_ID_LEN): raw is string {
  return typeof raw === 'string' && raw.length > 0 && raw.length <= max;
}
