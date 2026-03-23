import Link from 'next/link';
import { getExpansionStats, getPdbVsAfdbRates } from '@/lib/analysisQueries';
import type { LevelCounts } from '@/lib/analysisQueries';
import ExpansionClient from './ExpansionClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Expansion Analysis',
};

function expansionPct(truth: number, predicted: number): string {
  if (truth === 0) return predicted > 0 ? 'N/A' : '0%';
  const pct = ((predicted - truth) / truth) * 100;
  return `+${pct.toFixed(0)}%`;
}

function expansionColor(truth: number, predicted: number): string {
  if (truth === 0) return 'text-gray-500 dark:text-gray-400';
  const ratio = predicted / truth;
  if (ratio >= 3) return 'text-green-600 dark:text-green-400 font-bold';
  if (ratio >= 2) return 'text-green-600 dark:text-green-400';
  if (ratio >= 1.5) return 'text-green-500 dark:text-green-500';
  return 'text-gray-600 dark:text-gray-400';
}

function ExpansionRow({ label, stats }: { label: string; stats: LevelCounts }) {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{label}</td>
      <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">{stats.truth.toLocaleString()}</td>
      <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">{stats.predicted.toLocaleString()}</td>
      <td className={`px-4 py-3 text-sm text-right ${expansionColor(stats.truth, stats.predicted)}`}>
        {expansionPct(stats.truth, stats.predicted)}
      </td>
    </tr>
  );
}

export default async function ExpansionPage() {
  let expansionStats: Awaited<ReturnType<typeof getExpansionStats>> | null = null;
  let pdbVsAfdbRates: Awaited<ReturnType<typeof getPdbVsAfdbRates>> = [];
  let dbError = false;

  try {
    [expansionStats, pdbVsAfdbRates] = await Promise.all([
      getExpansionStats(),
      getPdbVsAfdbRates(),
    ]);
  } catch (e) {
    console.error('Expansion page DB error:', e);
    dbError = true;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {dbError && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-amber-800 dark:text-amber-300 text-sm">
          Unable to connect to the database. Expansion analysis data may not be available.
        </div>
      )}

      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/" className="hover:text-amber-600 dark:hover:text-amber-400">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-gray-100">Expansion Analysis</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Coverage Expansion Beyond PDB Ground Truth
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-3xl">
          This page shows how computational structure predictions (AlphaFold DB) expand
          cysteine classification coverage beyond what is available from PDB experimental
          structures alone, measured at each level of the ECOD hierarchy.
        </p>
      </div>

      {/* Expansion Summary Tables */}
      {expansionStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Disulfide Expansion */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                Disulfide Bond Expansion
              </h2>
            </div>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Level</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">PDB (Truth)</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">+ Predicted</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expansion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <ExpansionRow label="X-Group" stats={expansionStats.disulfide.x} />
                <ExpansionRow label="T-Group" stats={expansionStats.disulfide.t} />
                <ExpansionRow label="F-Group" stats={expansionStats.disulfide.f} />
              </tbody>
            </table>
          </div>

          {/* Metal Expansion */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-teal-600 dark:text-teal-400">
                Metal-Binding Expansion
              </h2>
            </div>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Level</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">PDB (Truth)</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">+ Predicted</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expansion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <ExpansionRow label="X-Group" stats={expansionStats.metal.x} />
                <ExpansionRow label="T-Group" stats={expansionStats.metal.t} />
                <ExpansionRow label="F-Group" stats={expansionStats.metal.f} />
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Client-side chart and concordance table */}
      <ExpansionClient
        expansionStats={expansionStats}
        pdbVsAfdbRates={pdbVsAfdbRates}
      />
    </div>
  );
}
