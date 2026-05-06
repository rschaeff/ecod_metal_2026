// Map domain-local cysteine positions (1-indexed within the F70 rep
// sequence) to author chain + residue number in the source structure.
//
// Domain sequences in ECOD are concatenated from one or more chain segments
// listed in range_definition (e.g. "A:5-150" for a single segment, or
// "A:5-50,A:80-150" for a discontiguous domain). Cys position 1 maps to the
// first residue of the first segment; cys positions accumulate through
// segments in declared order.

import type { CysteineRecord } from '@/types/cysteine';

export interface RangeSegment {
  chain: string;
  start: number;
  end: number;
}

export interface StructureCys {
  chain: string;
  resnum: number;
}

/**
 * Parse "A:5-150" or "A:5-50,A:80-150" into segments. Returns an empty
 * array on any parse failure so callers can no-op gracefully.
 */
export function parseRangeDefinition(range: string | null | undefined): RangeSegment[] {
  if (!range) return [];
  const segments: RangeSegment[] = [];
  for (const rawPart of range.split(',')) {
    const part = rawPart.trim();
    if (!part) continue;
    const m = part.match(/^([A-Za-z0-9]+):(-?\d+)-(-?\d+)$/);
    if (!m) return [];
    const chain = m[1];
    const start = parseInt(m[2], 10);
    const end = parseInt(m[3], 10);
    if (isNaN(start) || isNaN(end) || end < start) return [];
    segments.push({ chain, start, end });
  }
  return segments;
}

/**
 * Translate one 1-indexed domain position to a {chain, resnum} pair in the
 * source structure. Returns null if the position falls outside the declared
 * segments (e.g., signals a corrupt range_definition or an off-by-one bug
 * upstream).
 */
export function mapPositionToStructure(
  position: number,
  segments: RangeSegment[],
): StructureCys | null {
  if (!Number.isFinite(position) || position < 1) return null;
  let offset = 0;
  for (const seg of segments) {
    const segLen = seg.end - seg.start + 1;
    if (position <= offset + segLen) {
      return { chain: seg.chain, resnum: seg.start + (position - offset - 1) };
    }
    offset += segLen;
  }
  return null;
}

/**
 * Map an array of CysteineRecord entries to per-class structure-residue
 * lists. Useful for the StructureViewer cysteine-highlight params.
 */
export function classifyCysteinesByStructure(
  classifications: CysteineRecord[],
  rangeDefinition: string | null | undefined,
): {
  metal: StructureCys[];
  disulfide: StructureCys[];
  freeThiol: StructureCys[];
} {
  const segments = parseRangeDefinition(rangeDefinition);
  const out = { metal: [] as StructureCys[], disulfide: [] as StructureCys[], freeThiol: [] as StructureCys[] };
  if (segments.length === 0) return out;

  for (const c of classifications) {
    const mapped = mapPositionToStructure(c.cysPosition, segments);
    if (!mapped) continue;
    if (c.classification === 'METAL_BINDING') out.metal.push(mapped);
    else if (c.classification === 'DISULFIDE') out.disulfide.push(mapped);
    else if (c.classification === 'UNCLASSIFIED') out.freeThiol.push(mapped);
  }
  return out;
}

/** Format a {chain, resnum}[] list for the viewer's URL params. */
export function encodeCysList(cys: StructureCys[]): string | undefined {
  if (cys.length === 0) return undefined;
  return cys.map((c) => `${c.chain}:${c.resnum}`).join(',');
}
