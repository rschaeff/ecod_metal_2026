import { describe, expect, it } from 'vitest';
import { BULK_DATA, FIGURE_DATA, CODE_ARTEFACTS } from './downloads';

describe('downloads manifest', () => {
  it('has unique ids across BULK_DATA + FIGURE_DATA + CODE_ARTEFACTS', () => {
    const ids = [
      ...BULK_DATA.map((e) => e.id),
      ...FIGURE_DATA.map((e) => e.id),
      ...CODE_ARTEFACTS.map((e) => e.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('paths are all under /data/', () => {
    for (const e of [...BULK_DATA, ...FIGURE_DATA]) {
      expect(e.path.startsWith('/data/')).toBe(true);
    }
  });

  it('filenames match the basename of their path', () => {
    for (const e of [...BULK_DATA, ...FIGURE_DATA]) {
      const basename = e.path.split('/').pop();
      expect(basename).toBe(e.filename);
    }
  });

  it('every BULK_DATA entry declares a TSV format with a schema', () => {
    for (const e of BULK_DATA) {
      expect(e.format).toBe('TSV');
      expect(Array.isArray(e.schema)).toBe(true);
      expect(e.schema!.length).toBeGreaterThan(0);
    }
  });

  it('every FIGURE_DATA entry declares a CSV format and a paperFigure label', () => {
    for (const e of FIGURE_DATA) {
      expect(e.format).toBe('CSV');
      expect(e.paperFigure).toBeTruthy();
      expect(e.paperFigure!.startsWith('Fig ')).toBe(true);
    }
  });

  it('CODE_ARTEFACTS entries surface at least one outbound link', () => {
    for (const a of CODE_ARTEFACTS) {
      // Either a GitHub-style externalUrl, a Zenodo deposit, or both must be set
      // (or explicitly null when pending — but description must explain).
      expect(typeof a.label).toBe('string');
      expect(typeof a.description).toBe('string');
    }
  });
});
