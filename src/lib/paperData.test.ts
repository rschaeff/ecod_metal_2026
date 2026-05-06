import { describe, expect, it } from 'vitest';
import {
  hGroupBin,
  buildBibTeX,
  buildRIS,
  FIGURE_TO_SURFACE,
  HGROUP_HIGHLIGHTS,
  HGROUP_BIN_LABELS,
  PAPER_REF,
  DATA_VERSION,
} from './paperData';

describe('hGroupBin', () => {
  it('returns null for null / NaN input', () => {
    expect(hGroupBin(null)).toBeNull();
    expect(hGroupBin(NaN)).toBeNull();
  });

  it('bins boundary values into the correct bucket', () => {
    // Bin breakpoints: <5, 5–50, 50–95, ≥95
    expect(hGroupBin(0)).toBe(0);
    expect(hGroupBin(4.99)).toBe(0);
    expect(hGroupBin(5)).toBe(1);
    expect(hGroupBin(49.99)).toBe(1);
    expect(hGroupBin(50)).toBe(2);
    expect(hGroupBin(94.99)).toBe(2);
    expect(hGroupBin(95)).toBe(3);
    expect(hGroupBin(100)).toBe(3);
  });

  it('matches HGROUP_BIN_LABELS arity', () => {
    expect(HGROUP_BIN_LABELS).toHaveLength(4);
  });
});

describe('FIGURE_TO_SURFACE', () => {
  it('lists each main + supplementary figure exactly once', () => {
    const tags = FIGURE_TO_SURFACE.map((f) => f.figure);
    expect(new Set(tags).size).toBe(tags.length);
  });

  it('uses internal hrefs (start with /)', () => {
    for (const f of FIGURE_TO_SURFACE) {
      expect(f.href.startsWith('/')).toBe(true);
    }
  });

  it('points the highlighted Fig 5C/D/E rows at the matching detail page', () => {
    const fig5 = FIGURE_TO_SURFACE.filter((f) => f.figure.startsWith('Fig 5C') || f.figure.startsWith('Fig 5D') || f.figure.startsWith('Fig 5E'));
    expect(fig5).toHaveLength(3);
    for (const row of fig5) {
      const id = row.href.replace(/^\/h-group\//, '');
      expect(HGROUP_HIGHLIGHTS[decodeURIComponent(id)]).toBeDefined();
    }
  });
});

describe('buildBibTeX', () => {
  it('always emits the title, year, and journal lines', () => {
    const bib = buildBibTeX();
    expect(bib).toContain(PAPER_REF.title);
    expect(bib).toContain(`year = {${PAPER_REF.year}}`);
    expect(bib).toContain('journal = {bioRxiv}');
  });

  it('includes a TriCyp note pointer for citation back-references', () => {
    expect(buildBibTeX()).toContain('tricyp.swmed.edu');
  });

  it('omits doi line when no DOI is set', () => {
    if (PAPER_REF.doi === null) {
      expect(buildBibTeX().toLowerCase()).not.toContain('doi = {');
    }
  });
});

describe('buildRIS', () => {
  it('emits a complete RIS record bracketed by TY/ER', () => {
    const ris = buildRIS();
    expect(ris).toMatch(/^TY\s+-\s+JOUR/);
    expect(ris.trim()).toMatch(/ER\s+-\s*$/);
    expect(ris).toContain(PAPER_REF.title);
  });

  it('adds DOI/UR lines only when those fields are set', () => {
    const ris = buildRIS();
    if (PAPER_REF.doi === null) expect(ris).not.toMatch(/^DO\s+-/m);
    else expect(ris).toMatch(/^DO\s+-\s+/m);
  });
});

describe('versioning', () => {
  it('publishes DATA_VERSION as a non-empty string', () => {
    expect(typeof DATA_VERSION).toBe('string');
    expect(DATA_VERSION.length).toBeGreaterThan(0);
  });
});
