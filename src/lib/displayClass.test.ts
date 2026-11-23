import { describe, expect, it } from 'vitest';
import { displayClass, DISPLAY_LABELS } from './displayClass';

describe('displayClass', () => {
  it('returns the model call when the cysteine is not flagged', () => {
    expect(displayClass({ classification: 'METAL_BINDING', hemeThioether: null })).toBe('METAL_BINDING');
    expect(displayClass({ classification: 'UNCLASSIFIED', hemeThioether: null })).toBe('UNCLASSIFIED');
  });

  it('returns HEME_THIOETHER for a flagged cysteine, whatever the model call', () => {
    for (const c of ['DISULFIDE', 'METAL_BINDING', 'UNCLASSIFIED'] as const) {
      expect(displayClass({ classification: c, hemeThioether: 'CX2CH' })).toBe('HEME_THIOETHER');
    }
  });

  it('has a label for every display class', () => {
    expect(DISPLAY_LABELS.HEME_THIOETHER).toBe('Heme thioether');
  });
});
