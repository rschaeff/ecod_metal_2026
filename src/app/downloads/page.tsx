import type { Metadata } from 'next';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  BULK_DATA,
  FIGURE_DATA,
  CODE_ARTEFACTS,
  type DownloadEntry,
} from '@/lib/downloads';
import { PAPER_REF } from '@/lib/paperData';
import { RATE_LIMIT_CONFIG } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const PAGE_TITLE = 'Downloads & API';
const PAGE_DESCRIPTION =
  'Bulk data, figure-data CSVs, predictor source, model weights, and the ' +
  'public read-only REST API for the TriCyp deposition.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  openGraph: { title: `${PAGE_TITLE} | TriCyp`, description: PAGE_DESCRIPTION },
  twitter: { title: `${PAGE_TITLE} | TriCyp`, description: PAGE_DESCRIPTION },
};

interface FileStatus {
  exists: boolean;
  sizeBytes?: number;
  mtime?: Date;
  sha256?: string;
}

async function statEntry(entry: DownloadEntry): Promise<FileStatus> {
  // Map the served path "/data/foo.tsv" → public/data/foo.tsv on disk.
  const diskPath = path.join(process.cwd(), 'public', entry.path.replace(/^\/+/, ''));
  try {
    const st = await fs.stat(diskPath);
    let sha256: string | undefined;
    try {
      const sidecar = await fs.readFile(`${diskPath}.sha256`, 'utf8');
      sha256 = sidecar.trim().split(/\s+/)[0];
    } catch {
      // No sidecar — leave undefined.
    }
    return { exists: true, sizeBytes: st.size, mtime: st.mtime, sha256 };
  } catch {
    return { exists: false };
  }
}

async function getGeneratedAt(): Promise<Date | null> {
  try {
    const txt = await fs.readFile(
      path.join(process.cwd(), 'public', 'data', '.generated-at'),
      'utf8',
    );
    const d = new Date(txt.trim());
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function DownloadRow({ entry, status }: { entry: DownloadEntry; status: FileStatus }) {
  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {entry.paperFigure && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                {entry.paperFigure}
              </span>
            )}
            <code className="font-mono text-sm text-gray-900 dark:text-gray-100 break-all">
              {entry.filename}
            </code>
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {entry.format}
            </span>
            {!status.exists && (
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                pending
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {entry.description}
          </p>
          {entry.schema && (
            <p className="mt-2 text-xs font-mono text-gray-500 dark:text-gray-400 break-words">
              {entry.schema.join(', ')}
            </p>
          )}
          {entry.notes && (
            <p className="mt-2 text-xs italic text-gray-500 dark:text-gray-400">
              {entry.notes}
            </p>
          )}
          {status.exists && (
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500 dark:text-gray-400 font-mono">
              {status.sizeBytes !== undefined && <span>{formatBytes(status.sizeBytes)}</span>}
              {status.mtime && <span>updated {formatDate(status.mtime)}</span>}
              {status.sha256 && (
                <span title={status.sha256}>
                  sha256: {status.sha256.slice(0, 16)}…
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {status.exists ? (
            <>
              <a
                href={entry.path}
                download
                className="inline-block px-4 py-2 rounded bg-amber-600 text-white text-sm font-medium hover:bg-amber-700"
              >
                Download
              </a>
              {status.sha256 && (
                <a
                  href={`${entry.path}.sha256`}
                  download
                  className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
                >
                  ↓ .sha256
                </a>
              )}
            </>
          ) : entry.zenodoUrl ? (
            <a
              href={entry.zenodoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Open Zenodo →
            </a>
          ) : (
            <span className="inline-block px-4 py-2 rounded border border-dashed border-gray-300 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
              Not yet deposited
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

const API_ROUTES = [
  {
    method: 'GET',
    path: '/api/domain/{domainId}',
    description: 'Per-cysteine predictions and structural evidence for one domain.',
    example: '/api/domain/e3h35A1',
  },
  {
    method: 'GET',
    path: '/api/family/{fGroupId}',
    description: 'Aggregate stats and paginated domain list for one F-group.',
    example: '/api/family/131.1.1.0?page=1&limit=50&sortBy=n_metal_binding&sortDir=desc',
  },
  {
    method: 'GET',
    path: '/api/hgroup/{hGroupId}',
    description: 'Per-H-group aggregate plus full F70 representative list.',
    example: '/api/hgroup/3380.1',
  },
  {
    method: 'GET',
    path: '/api/search?q=…',
    description: 'Search domain ID, PDB ID, F-group, or UniProt accession. Same matcher as the header search bar.',
    example: '/api/search?q=e3h35A1',
  },
  {
    method: 'GET',
    path: '/api/summary',
    description: 'Top-level dashboard counts (domains, cysteines, classification breakdown).',
    example: '/api/summary',
  },
];

export default async function DownloadsPage() {
  const [bulkStatuses, figureStatuses, generatedAt] = await Promise.all([
    Promise.all(BULK_DATA.map(statEntry)),
    Promise.all(FIGURE_DATA.map(statEntry)),
    getGeneratedAt(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Downloads &amp; API
        </h1>
        <p className="mt-3 text-base text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed">
          Canonical landing for the manuscript's <em>Software and data
          availability</em> pointer. Bulk TSVs are rebuilt nightly from the
          live database; figure-data CSVs mirror the manuscript's{' '}
          <code className="font-mono">paper/figure_data/</code> exports;
          predictor source and model weights are deposited on Zenodo.
        </p>
        {generatedAt && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
            Bulk data last refreshed {generatedAt.toISOString()}
          </p>
        )}
      </header>

      {/* Bulk data */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Bulk data
        </h2>
        <div className="space-y-4">
          {BULK_DATA.map((entry, i) => (
            <DownloadRow key={entry.id} entry={entry} status={bulkStatuses[i]} />
          ))}
        </div>
      </section>

      {/* Figure data */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Figure data
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-3xl">
          One CSV per main and supplementary figure. Several panels also
          expose a client-side &quot;Download CSV&quot; button right next to
          the chart on the corresponding page; those exports use the same
          column conventions as the canonical files here.
        </p>
        <div className="space-y-3">
          {FIGURE_DATA.map((entry, i) => (
            <DownloadRow key={entry.id} entry={entry} status={figureStatuses[i]} />
          ))}
        </div>
      </section>

      {/* Code + weights */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Predictor source &amp; model weights
        </h2>
        <div className="space-y-4">
          {CODE_ARTEFACTS.map((art) => (
            <article
              key={art.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {art.label}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {art.description}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {art.externalUrl ? (
                    <a
                      href={art.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 rounded bg-amber-600 text-white text-sm font-medium hover:bg-amber-700"
                    >
                      GitHub →
                    </a>
                  ) : null}
                  {art.zenodoUrl ? (
                    <a
                      href={art.zenodoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
                    >
                      Open Zenodo →
                    </a>
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                      Zenodo DOI pending
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* REST API */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          REST API
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-3xl">
          Read-only JSON endpoints. Every response uses the same envelope —{' '}
          <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">
            {`{ success: boolean, data?: …, error?: { code, message } }`}
          </code>
          {' '}— so callers can branch on a single field. No authentication
          required.
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-3xl">
          <strong>Rate limit:</strong>{' '}
          <span className="font-mono">
            {RATE_LIMIT_CONFIG.limit} requests / {Math.round(RATE_LIMIT_CONFIG.windowMs / 1000)} s per IP
          </span>
          . Responses include{' '}
          <code className="font-mono">X-RateLimit-Limit</code>,{' '}
          <code className="font-mono">X-RateLimit-Remaining</code>, and{' '}
          <code className="font-mono">X-RateLimit-Reset</code> headers.
          Exceeding the limit returns <code className="font-mono">429</code>{' '}
          with a <code className="font-mono">Retry-After</code> header.
        </p>
        <div className="space-y-3">
          {API_ROUTES.map((r) => (
            <article
              key={r.path}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                  {r.method}
                </span>
                <code className="font-mono text-sm text-gray-900 dark:text-gray-100">
                  {r.path}
                </code>
              </div>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                {r.description}
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-mono break-all">
                example: <a href={r.example} className="text-amber-600 dark:text-amber-400 hover:underline">{r.example}</a>
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Citation */}
      <section className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          How to cite
        </h2>
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Please cite the manuscript when reusing TriCyp data:{' '}
          <em>{PAPER_REF.title}</em>. {PAPER_REF.authors}.{' '}
          {PAPER_REF.bioRxivUrl ? (
            <a
              href={PAPER_REF.bioRxivUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 dark:text-amber-400 hover:underline"
            >
              {PAPER_REF.bioRxivUrl}
            </a>
          ) : (
            <span className="italic text-gray-500 dark:text-gray-400">
              preprint DOI pending
            </span>
          )}
          .
        </p>
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Data is released under <strong>CC-BY 4.0</strong>; the predictor
          source carries its existing license. The Zenodo deposition holds the
          versioned snapshot pinned to the paper-publication commit.
        </p>
      </section>
    </div>
  );
}
