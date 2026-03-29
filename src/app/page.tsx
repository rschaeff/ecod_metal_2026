import { getDashboardSummary, getXGroupBreakdown, getMethodStats, getConfidenceDistribution, getSuperkingdomBreakdown } from '@/lib/queries';
import type { MethodStat, ConfidenceBucket, SuperkingdomBreakdown } from '@/lib/queries';
import StatCard from '@/components/ui/StatCard';
import SearchBar from '@/components/ui/SearchBar';
import DashboardCharts from './DashboardCharts';
import ConfidenceChart from './ConfidenceChart';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const emptySummary = {
  totalDomains: 0, totalCysteines: 0, nDisulfide: 0,
  nMetalBinding: 0, nUnclassified: 0, pdbDomains: 0, predictedDomains: 0,
};

export default async function DashboardPage() {
  let summary = emptySummary;
  let xGroups: Awaited<ReturnType<typeof getXGroupBreakdown>> = [];
  let methods: MethodStat[] = [];
  let confidence: ConfidenceBucket[] = [];
  let taxonomy: SuperkingdomBreakdown[] = [];
  let dbError = false;

  try {
    [summary, xGroups, methods, confidence, taxonomy] = await Promise.all([
      getDashboardSummary(),
      getXGroupBreakdown(),
      getMethodStats(),
      getConfidenceDistribution(),
      getSuperkingdomBreakdown(),
    ]);
  } catch (e) {
    console.error('Dashboard DB error:', e);
    dbError = true;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {dbError && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-amber-800 dark:text-amber-300 text-sm">
          Unable to connect to the database. Classification data may not be loaded yet.
        </div>
      )}
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          Cysteine Classification Browser
        </h1>
        <p className="mt-3 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          ESM2-based cysteine classification (disulfide, metal-binding, unclassified) across{' '}
          {summary.totalDomains.toLocaleString()} ECOD F70 representative domains
        </p>
        <div className="mt-6 max-w-xl mx-auto">
          <SearchBar />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          title="Total Domains"
          value={summary.totalDomains}
          subtitle={`${summary.pdbDomains.toLocaleString()} PDB / ${summary.predictedDomains.toLocaleString()} Predicted`}
        />
        <StatCard
          title="Total Cysteines"
          value={summary.totalCysteines}
        />
        <StatCard
          title="Disulfide"
          value={summary.nDisulfide}
          subtitle={summary.totalCysteines > 0 ? `${((summary.nDisulfide / summary.totalCysteines) * 100).toFixed(1)}%` : undefined}
          colorClass="text-amber-500"
        />
        <StatCard
          title="Metal-Binding"
          value={summary.nMetalBinding}
          subtitle={summary.totalCysteines > 0 ? `${((summary.nMetalBinding / summary.totalCysteines) * 100).toFixed(1)}%` : undefined}
          colorClass="text-teal-600 dark:text-teal-400"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Classification Distribution
          </h2>
          <DashboardCharts
            nDisulfide={summary.nDisulfide}
            nMetalBinding={summary.nMetalBinding}
            nUnclassified={summary.nUnclassified}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Top X-Groups by Metal-Binding Fraction
          </h2>
          <div className="overflow-y-auto max-h-80">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">X-Group</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Metal</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {xGroups.map((xg) => (
                  <tr key={xg.xGroupId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                      {xg.xGroupName}
                    </td>
                    <td className="px-3 py-2 text-right text-teal-600 dark:text-teal-400 font-medium">
                      {xg.nMetal.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">
                      {xg.total.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">
                      {(xg.metalFraction * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confidence Distribution */}
      {confidence.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            ESM2 Classification Confidence
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Distribution of max-class probability across all classified cysteines
          </p>
          <ConfidenceChart data={confidence} />
        </div>
      )}

      {/* Classification by Superkingdom */}
      {taxonomy.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Classification by Superkingdom
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Superkingdom</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Domains</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Disulfide</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Metal</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Unclassified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {taxonomy.map((t) => (
                  <tr key={t.superkingdom} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">{t.superkingdom}</td>
                    <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{t.nDomains.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right text-amber-600 dark:text-amber-400">{t.nDisulfide.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right text-teal-600 dark:text-teal-400">{t.nMetal.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right text-gray-500 dark:text-gray-400">{t.nUnclassified.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Methods & Annotations */}
      {methods.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Methods &amp; Annotations
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Method</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Records</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Domains</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {methods.map((m) => (
                  <tr key={m.method} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${m.records === 0 ? 'opacity-40' : ''}`}>
                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">{m.method}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        m.type === 'annotation'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                          : 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300'
                      }`}>
                        {m.type === 'annotation' ? 'PDB Annotation' : 'Prediction'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{m.description}</td>
                    <td className="px-4 py-2 text-right text-gray-900 dark:text-gray-100 font-medium">
                      {m.records > 0 ? m.records.toLocaleString() : '\u2014'}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">
                      {m.domains > 0 ? m.domains.toLocaleString() : '\u2014'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Source Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Data Sources
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <span className="text-xl font-bold text-amber-600 dark:text-amber-400">P</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">PDB Domains</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.pdbDomains.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <span className="text-xl font-bold text-teal-600 dark:text-teal-400">A</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Predicted Domains</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.predictedDomains.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Findings */}
      <div className="mt-10 mb-10">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Key Findings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/validation" className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:border-amber-300 dark:hover:border-amber-600 transition-colors group">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 group-hover:text-amber-700 dark:group-hover:text-amber-300">95%</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Sensitivity for disulfide detection vs PDB ground truth</p>
          </Link>
          <Link href="/expansion" className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:border-teal-300 dark:hover:border-teal-600 transition-colors group">
            <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 group-hover:text-teal-700 dark:group-hover:text-teal-300">4x</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Predictions expand metal-binding to 4x more families</p>
          </Link>
          <Link href="/validation/cross-domain" className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:border-amber-300 dark:hover:border-amber-600 transition-colors group">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 group-hover:text-amber-700 dark:group-hover:text-amber-300">22%</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Of PDB disulfides are cross-domain</p>
          </Link>
          <Link href="/validation/cofactors" className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:border-teal-300 dark:hover:border-teal-600 transition-colors group">
            <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 group-hover:text-teal-700 dark:group-hover:text-teal-300">Fe-S</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Clusters account for 15% of apparent false positives</p>
          </Link>
        </div>
      </div>

      {/* Quick Links */}
      <div className="text-center">
        <Link
          href="/family"
          className="inline-block px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
        >
          Browse All Families
        </Link>
      </div>
    </div>
  );
}
