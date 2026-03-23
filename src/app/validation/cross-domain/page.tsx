import Link from 'next/link';
import { getCrossDomainDisulfides } from '@/lib/analysisQueries';
import StatCard from '@/components/ui/StatCard';
import CrossDomainClient from './CrossDomainClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Cross-Domain Disulfides',
};

export default async function CrossDomainPage() {
  let summary = { totalSsbonds: 0, intra: 0, cross: 0 };
  let rows: Awaited<ReturnType<typeof getCrossDomainDisulfides>>['rows'] = [];
  let dbError = false;

  try {
    const result = await getCrossDomainDisulfides();
    summary = result.summary;
    rows = result.rows;
  } catch (e) {
    console.error('Cross-domain disulfides DB error:', e);
    dbError = true;
  }

  const intraPct = summary.totalSsbonds > 0
    ? ((summary.intra / summary.totalSsbonds) * 100).toFixed(1)
    : '0.0';
  const crossPct = summary.totalSsbonds > 0
    ? ((summary.cross / summary.totalSsbonds) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {dbError && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-amber-800 dark:text-amber-300 text-sm">
          Unable to connect to the database. Cross-domain disulfide data may not be loaded yet.
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/" className="hover:text-amber-600 dark:hover:text-amber-400">Dashboard</Link>
        <span className="mx-2">/</span>
        <span>Validation</span>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-gray-100">Cross-Domain Disulfides</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cross-Domain Disulfides</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          SSBOND records classified as intradomain vs cross-domain across ECOD X-groups
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <StatCard
          title="Total SSBONDs"
          value={summary.totalSsbonds}
        />
        <StatCard
          title="Intradomain"
          value={summary.intra}
          subtitle={`${intraPct}% of total`}
          colorClass="text-teal-600 dark:text-teal-400"
        />
        <StatCard
          title="Cross-Domain"
          value={summary.cross}
          subtitle={`${crossPct}% of total`}
          colorClass="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Client component: chart + table */}
      <CrossDomainClient rows={rows} />
    </div>
  );
}
