// Canonical classification color palette per TriCyp spec:
//   red disulfide, green metal-binding, grey free thiol.
// Use these constants in every chart fill prop and Tailwind utility list.

export const CLASS_COLORS = {
  disulfide: '#DC2626',
  metalBinding: '#16A34A',
  freeThiol: '#9CA3AF',
} as const;

export const CLASS_COLORS_DARK = {
  disulfide: '#F87171',
  metalBinding: '#4ADE80',
  freeThiol: '#6B7280',
} as const;

export const CLASS_LABELS = {
  disulfide: 'Disulfide',
  metalBinding: 'Metal-binding',
  freeThiol: 'Free thiol',
} as const;

// For data series consumed by recharts where the key doubles as the legend label,
// use these strings (sentence case, hyphenated metal-binding).
export const CLASS_KEYS = {
  disulfide: 'Disulfide',
  metalBinding: 'Metal-binding',
  freeThiol: 'Free thiol',
} as const;
