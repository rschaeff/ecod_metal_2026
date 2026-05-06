// Bake-time consistency check: every documented endpoint in apiExamples.ts
// should have a matching route.ts file under src/app/api/, and every
// route.ts file under src/app/api/ that exports a GET handler should
// appear in API_ENDPOINTS. Catches drift between docs and implementation.

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { API_ENDPOINTS } from './apiExamples';

const API_ROOT = path.resolve(__dirname, '..', 'app', 'api');

function walkRouteFiles(dir: string, found: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkRouteFiles(full, found);
    else if (entry.isFile() && entry.name === 'route.ts') found.push(full);
  }
  return found;
}

/**
 * Convert a filesystem route path like
 *   /…/src/app/api/domain/[domainId]/route.ts
 * into the documented public path:
 *   /api/domain/{domainId}
 */
function fsPathToPublicPath(fsPath: string): string {
  const rel = path.relative(API_ROOT, fsPath);
  const segments = rel.split(path.sep).slice(0, -1); // drop "route.ts"
  const transformed = segments.map((s) =>
    s.startsWith('[') && s.endsWith(']') ? `{${s.slice(1, -1)}}` : s,
  );
  return `/api/${transformed.join('/')}`;
}

describe('apiExamples consistency with src/app/api', () => {
  const routeFiles = walkRouteFiles(API_ROOT);
  const filesystemPaths = new Set(routeFiles.map(fsPathToPublicPath));
  const documentedPaths = new Set(API_ENDPOINTS.map((ep) => ep.path));

  it('documents every route.ts under src/app/api', () => {
    const missing = [...filesystemPaths].filter((p) => !documentedPaths.has(p));
    expect(missing).toEqual([]);
  });

  it('does not list routes that do not exist on disk', () => {
    const orphans = [...documentedPaths].filter((p) => !filesystemPaths.has(p));
    expect(orphans).toEqual([]);
  });

  it('every documented route file exports a GET handler', () => {
    for (const file of routeFiles) {
      const src = fs.readFileSync(file, 'utf8');
      expect(/export\s+(async\s+)?function\s+GET\b/.test(src)).toBe(true);
    }
  });
});
