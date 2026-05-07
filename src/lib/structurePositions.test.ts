import { describe, expect, it } from 'vitest';
import {
  parseRangeDefinition,
  mapPositionToStructure,
  classifyCysteinesByStructure,
  encodeCysList,
} from './structurePositions';
import type { CysteineRecord } from '@/types/cysteine';

describe('parseRangeDefinition', () => {
  it('parses a single segment', () => {
    expect(parseRangeDefinition('A:5-150')).toEqual([
      { chain: 'A', start: 5, end: 150 },
    ]);
  });

  it('parses two comma-separated segments', () => {
    expect(parseRangeDefinition('A:5-50,A:80-150')).toEqual([
      { chain: 'A', start: 5, end: 50 },
      { chain: 'A', start: 80, end: 150 },
    ]);
  });

  it('parses segments across different chains', () => {
    expect(parseRangeDefinition('A:5-50,B:1-30')).toEqual([
      { chain: 'A', start: 5, end: 50 },
      { chain: 'B', start: 1, end: 30 },
    ]);
  });

  it('returns empty array for null or undefined', () => {
    expect(parseRangeDefinition(null)).toEqual([]);
    expect(parseRangeDefinition(undefined)).toEqual([]);
    expect(parseRangeDefinition('')).toEqual([]);
  });

  it('returns empty array on malformed input', () => {
    expect(parseRangeDefinition('A:abc-150')).toEqual([]);
    expect(parseRangeDefinition('A150')).toEqual([]);
    expect(parseRangeDefinition('garbage')).toEqual([]);
  });

  it('returns empty array when end precedes start', () => {
    expect(parseRangeDefinition('A:150-5')).toEqual([]);
  });

  it('tolerates surrounding whitespace in segments', () => {
    expect(parseRangeDefinition('A:5-50, A:80-150')).toEqual([
      { chain: 'A', start: 5, end: 50 },
      { chain: 'A', start: 80, end: 150 },
    ]);
  });

  it('accepts chainless form used by AFDB-source ECOD domains', () => {
    expect(parseRangeDefinition('6-55')).toEqual([
      { chain: 'A', start: 6, end: 55 },
    ]);
    expect(parseRangeDefinition('1-70,169-344')).toEqual([
      { chain: 'A', start: 1, end: 70 },
      { chain: 'A', start: 169, end: 344 },
    ]);
  });
});

describe('mapPositionToStructure', () => {
  const segments = [
    { chain: 'A', start: 5, end: 50 },   // domain positions 1..46
    { chain: 'A', start: 80, end: 150 }, // domain positions 47..117
  ];

  it('maps position 1 to first residue of first segment', () => {
    expect(mapPositionToStructure(1, segments)).toEqual({ chain: 'A', resnum: 5 });
  });

  it('maps last position of first segment', () => {
    expect(mapPositionToStructure(46, segments)).toEqual({ chain: 'A', resnum: 50 });
  });

  it('maps first position of second segment', () => {
    expect(mapPositionToStructure(47, segments)).toEqual({ chain: 'A', resnum: 80 });
  });

  it('maps last position of second segment', () => {
    expect(mapPositionToStructure(117, segments)).toEqual({ chain: 'A', resnum: 150 });
  });

  it('returns null when position exceeds total length', () => {
    expect(mapPositionToStructure(118, segments)).toBeNull();
    expect(mapPositionToStructure(1000, segments)).toBeNull();
  });

  it('returns null for non-positive position', () => {
    expect(mapPositionToStructure(0, segments)).toBeNull();
    expect(mapPositionToStructure(-5, segments)).toBeNull();
  });

  it('returns null for NaN position', () => {
    expect(mapPositionToStructure(NaN, segments)).toBeNull();
  });

  it('preserves chain across multi-chain segments', () => {
    const multiChain = [
      { chain: 'A', start: 1, end: 10 },  // 1..10
      { chain: 'B', start: 1, end: 10 },  // 11..20
    ];
    expect(mapPositionToStructure(1, multiChain)).toEqual({ chain: 'A', resnum: 1 });
    expect(mapPositionToStructure(11, multiChain)).toEqual({ chain: 'B', resnum: 1 });
    expect(mapPositionToStructure(20, multiChain)).toEqual({ chain: 'B', resnum: 10 });
  });
});

describe('classifyCysteinesByStructure', () => {
  const mkRecord = (
    cysPosition: number,
    classification: CysteineRecord['classification'],
  ): CysteineRecord => ({
    id: cysPosition,
    domainId: 0,
    cysPosition,
    classification,
    confidence: 1,
    evidence: '',
  });

  it('groups records by class with structure positions', () => {
    const records = [
      mkRecord(1, 'METAL_BINDING'),
      mkRecord(10, 'DISULFIDE'),
      mkRecord(20, 'UNCLASSIFIED'),
    ];
    const result = classifyCysteinesByStructure(records, 'A:100-200');
    expect(result.metal).toEqual([{ chain: 'A', resnum: 100 }]);
    expect(result.disulfide).toEqual([{ chain: 'A', resnum: 109 }]);
    expect(result.freeThiol).toEqual([{ chain: 'A', resnum: 119 }]);
  });

  it('returns empty groups when range is missing', () => {
    const records = [mkRecord(1, 'METAL_BINDING')];
    expect(classifyCysteinesByStructure(records, null)).toEqual({
      metal: [],
      disulfide: [],
      freeThiol: [],
    });
  });

  it('skips positions that fall outside declared segments', () => {
    const records = [
      mkRecord(1, 'METAL_BINDING'),
      mkRecord(999, 'METAL_BINDING'),
    ];
    const result = classifyCysteinesByStructure(records, 'A:100-110');
    expect(result.metal).toEqual([{ chain: 'A', resnum: 100 }]);
  });
});

describe('encodeCysList', () => {
  it('formats chain:resnum entries comma-separated', () => {
    expect(
      encodeCysList([
        { chain: 'A', resnum: 5 },
        { chain: 'B', resnum: 12 },
      ]),
    ).toBe('A:5,B:12');
  });

  it('returns undefined for empty list', () => {
    expect(encodeCysList([])).toBeUndefined();
  });
});
