// Display class for a cysteine: the model's three-state call, except that flagged c-type heme attachment
// cysteines (CX(n)CH in a cytochrome H-group; cysteine_classifications.heme_thioether) are shown as their own
// class. The stored `classification` is unchanged, so site-wide aggregates still match the manuscript.
import type { CysteineRecord } from '@/types/cysteine';

export type DisplayClass = CysteineRecord['classification'] | 'HEME_THIOETHER';

export function displayClass(c: Pick<CysteineRecord, 'classification' | 'hemeThioether'>): DisplayClass {
  return c.hemeThioether ? 'HEME_THIOETHER' : c.classification;
}

export const DISPLAY_LABELS: Record<DisplayClass, string> = {
  DISULFIDE: 'Disulfide',
  METAL_BINDING: 'Metal-binding',
  UNCLASSIFIED: 'Free thiol',
  HEME_THIOETHER: 'Heme thioether',
};

export const MODEL_LABELS: Record<CysteineRecord['classification'], string> = {
  DISULFIDE: 'disulfide',
  METAL_BINDING: 'metal-binding',
  UNCLASSIFIED: 'free thiol',
};

export const HEME_THIOETHER_NOTE =
  'c-type heme attachment cysteine (CXXCH motif in a cytochrome H-group): covalently bonded to the heme, ' +
  'not coordinated to its iron. The three-state model has no class for this, so it is shown separately; ' +
  'the model call is kept for reference.';
