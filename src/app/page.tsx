import {
  getDashboardSummary,
  getConfidenceDistribution,
  getSuperkingdomBreakdown,
  getSourceTypeBreakdown,
} from '@/lib/queries';
import type {
  ConfidenceBucket,
  SuperkingdomBreakdown,
  SourceTypeBreakdown,
} from '@/lib/queries';
import { summaryCache, CACHE_TTL, cachedQuery } from '@/lib/cache';
import SearchBar from '@/components/ui/SearchBar';
import Fig3APanel from '@/components/dashboard/Fig3APanel';
import Fig3BPanel from '@/components/dashboard/Fig3BPanel';
import Fig3CPanel from '@/components/dashboard/Fig3CPanel';
import Fig3DPanel from '@/components/dashboard/Fig3DPanel';
import FigS2Panel from '@/components/dashboard/FigS2Panel';
import FigS3Panel from '@/components/dashboard/FigS3Panel';
import { PAPER_REF, PAPER_TOTALS } from '@/lib/paperData';

export const dynamic = 'force-dynamic';

const emptySummary = {
  totalDomains: 0,
  totalCysteines: 0,
  nDisulfide: 0,
  nMetalBinding: 0,
  nUnclassified: 0,
  pdbDomains: 0,
  predictedDomains: 0,
};

function fmt(n: number): string {
  return n.toLocaleString();
}

function pct(n: number, total: number): string {
  if (total <= 0) return '0.0%';
  return `${((n / total) * 100).toFixed(1)}%`;
}

export default async function DashboardPage() {
  let summary = emptySummary;
  let confidence: ConfidenceBucket[] = [];
  let taxonomy: SuperkingdomBreakdown[] = [];
  let sources: SourceTypeBreakdown[] = [];
  let dbError = false;

  try {
    [summary, confidence, taxonomy, sources] = await Promise.all([
      cachedQuery(summaryCache, 'dashboard-summary', CACHE_TTL.SUMMARY, getDashboardSummary),
      cachedQuery(summaryCache, 'confidence-distribution', CACHE_TTL.SUMMARY, getConfidenceDistribution),
      cachedQuery(summaryCache, 'superkingdom-breakdown', CACHE_TTL.SUMMARY, getSuperkingdomBreakdown),
      cachedQuery(summaryCache, 'source-type-breakdown', CACHE_TTL.SUMMARY, getSourceTypeBreakdown),
    ]);
  } catch (e) {
    console.error('Dashboard DB error:', e);
    dbError = true;
  }

  // Stat strip prefers live counts; falls back to paper snapshot when the DB
  // is offline so the page still renders for the reader landing from the PDF.
  const headline = summary.totalDomains > 0
    ? {
        domains: summary.totalDomains,
        cysteines: summary.totalCysteines,
        disulfide: summary.nDisulfide,
        metalBinding: summary.nMetalBinding,
        freeThiol: summary.nUnclassified,
      }
    : PAPER_TOTALS;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {dbError && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-amber-800 dark:text-amber-300 text-sm">
          Database unreachable — showing the manuscript snapshot. Live counts will resume once the database is back online.
        </div>
      )}

      {/* Hero */}
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">TriCyp</h1>
        <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Three-state cysteine classification across ~700,000 ECOD representative domains.
        </p>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Companion deposition site for{' '}
          <em>{PAPER_REF.title}</em> — {PAPER_REF.authors}.{' '}
          {PAPER_REF.bioRxivUrl ? (
            <a
              href={PAPER_REF.bioRxivUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 dark:text-amber-400 hover:underline"
            >
              Read the preprint
            </a>
          ) : (
            <span className="italic text-gray-400">preprint link pending</span>
          )}
          .
        </p>
        <div className="mt-6 max-w-xl mx-auto">
          <SearchBar />
        </div>
      </header>

      {/* Stat strip */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-4 mb-10">
        <dl className="grid grid-cols-2 sm:grid-cols-5 gap-y-3 gap-x-6 text-center">
          <div>
            <dt className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Domains</dt>
            <dd className="text-xl font-semibold text-gray-900 dark:text-gray-100">{fmt(headline.domains)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Cysteines</dt>
            <dd className="text-xl font-semibold text-gray-900 dark:text-gray-100">{fmt(headline.cysteines)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Disulfide</dt>
            <dd className="text-xl font-semibold text-red-600 dark:text-red-400">
              {fmt(headline.disulfide)}
              <span className="ml-1 text-sm font-normal text-gray-500 dark:text-gray-400">({pct(headline.disulfide, headline.cysteines)})</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Metal-binding</dt>
            <dd className="text-xl font-semibold text-green-600 dark:text-green-400">
              {fmt(headline.metalBinding)}
              <span className="ml-1 text-sm font-normal text-gray-500 dark:text-gray-400">({pct(headline.metalBinding, headline.cysteines)})</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Free thiol</dt>
            <dd className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              {fmt(headline.freeThiol)}
              <span className="ml-1 text-sm font-normal text-gray-500 dark:text-gray-400">({pct(headline.freeThiol, headline.cysteines)})</span>
            </dd>
          </div>
        </dl>
      </div>

      {/* Figure 3 panels — paper-figure-correspondence is the central design constraint. */}
      <div className="space-y-6 mb-10">
        <Fig3APanel />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Fig3BPanel taxonomy={taxonomy} />
          <Fig3CPanel taxonomy={taxonomy} />
        </div>
        <Fig3DPanel />
      </div>

      {/* Supplementary panels */}
      <div className="space-y-6 mb-10">
        {confidence.length > 0 && <FigS3Panel data={confidence} />}
        {sources.length > 0 && <FigS2Panel sources={sources} />}
      </div>
    </div>
  );
}
