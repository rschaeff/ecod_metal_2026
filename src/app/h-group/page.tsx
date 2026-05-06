import type { Metadata } from 'next';
import Link from 'next/link';
import { getHGroupSummary } from '@/lib/queries';
import type { HGroupSummary } from '@/lib/queries';
import { summaryCache, CACHE_TTL, cachedQuery } from '@/lib/cache';
import { FIG_5AB_CAPTION, HGROUP_HIGHLIGHTS } from '@/lib/paperData';
import HGroupConfusionMatrix from './HGroupConfusionMatrix';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'H-group browser',
  description:
    'Browse ECOD H-groups by structurally-known vs ESM2-predicted cysteine ' +
    'fractions. Mirrors paper Fig 5A,B confusion matrices for disulfide and ' +
    'metal-binding tasks.',
};

export default async function HGroupBrowserPage() {
  let summaries: HGroupSummary[] = [];
  let dbError = false;
  try {
    // Expensive query — long TTL until the materialized view lands.
    summaries = await cachedQuery(
      summaryCache,
      'hgroup-summary-all',
      CACHE_TTL.DOMAIN,
      getHGroupSummary,
    );
  } catch (e) {
    console.error('H-group summary query failed:', e);
    dbError = true;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Paper Fig 5A,B
        </p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
          H-group browser
        </h1>
        <p className="mt-3 text-base text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed">
          {FIG_5AB_CAPTION}
        </p>
      </header>

      {dbError && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-amber-800 dark:text-amber-300 text-sm">
          The H-group summary query failed. The page will be empty until the
          database is reachable; once spec step 6 lands the materialized
          <code className="font-mono mx-1">cys_classification.hgroup_summary</code>
          view, this query will read from it directly.
        </div>
      )}

      {/* Highlights row */}
      <section className="mb-8">
        <header className="mb-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Paper-highlighted H-groups
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            The three H-groups featured in Fig 5C–E exemplify the
            low-known / high-predicted cell of the metal-binding confusion
            matrix.
          </p>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.values(HGROUP_HIGHLIGHTS).map((h) => (
            <Link
              key={h.hGroupId}
              href={`/h-group/${encodeURIComponent(h.hGroupId)}`}
              className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600 transition-colors p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  {h.paperFigure}
                </span>
                <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                  H-group {h.hGroupId}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {h.shortDescription}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Two confusion matrices */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
        <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <header className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
              Fig 5A · Disulfide
            </p>
            <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Disulfide confusion matrix
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Click any cell to list the H-groups that fall into it. The
              amber-ringed cell flags the candidate novel quadrant.
            </p>
          </header>
          <HGroupConfusionMatrix summaries={summaries} task="disulfide" />
        </article>

        <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <header className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">
              Fig 5B · Metal-binding
            </p>
            <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Metal-binding confusion matrix
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              The Fig 5C–E highlighted H-groups live in the lower-right cell
              of this matrix.
            </p>
          </header>
          <HGroupConfusionMatrix summaries={summaries} task="metal" />
        </article>
      </section>

      <section className="text-sm text-gray-500 dark:text-gray-400">
        <p>
          Showing {summaries.length.toLocaleString()} H-groups with at least
          one F70 representative. H-groups with no PDB-source representative
          fall outside the matrix axis (no structurally-known signal) and are
          excluded from cell counts; those with no AFDB-source representative
          are similarly excluded.
        </p>
      </section>
    </div>
  );
}
