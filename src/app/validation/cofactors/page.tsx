import Link from 'next/link';
import { getCofactorBreakdown } from '@/lib/analysisQueries';
import StatCard from '@/components/ui/StatCard';
import CofactorClient from './CofactorClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Cofactor Analysis',
};

export default async function CofactorPage() {
  let freeIon = 0;
  let cofactor = 0;
  let byCofactor: Awaited<ReturnType<typeof getCofactorBreakdown>>['byCofactor'] = [];
  let dbError = false;

  try {
    const result = await getCofactorBreakdown();
    freeIon = result.freeIon;
    cofactor = result.cofactor;
    byCofactor = result.byCofactor;
  } catch (e) {
    console.error('Cofactor analysis DB error:', e);
    dbError = true;
  }

  const total = freeIon + cofactor;
  const freeIonPct = total > 0 ? ((freeIon / total) * 100).toFixed(1) : '0.0';
  const cofactorPct = total > 0 ? ((cofactor / total) * 100).toFixed(1) : '0.0';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {dbError && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-amber-800 dark:text-amber-300 text-sm">
          Unable to connect to the database. Cofactor analysis data may not be loaded yet.
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/" className="hover:text-amber-600 dark:hover:text-amber-400">Dashboard</Link>
        <span className="mx-2">/</span>
        <span>Validation</span>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-gray-100">Cofactor Analysis</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cofactor Analysis</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Breakdown of LINK records into free ion vs cofactor-coordinated metal sites
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <StatCard
          title="Total LINK Records"
          value={total}
        />
        <StatCard
          title="Free Ion"
          value={freeIon}
          subtitle={`${freeIonPct}% of total`}
          colorClass="text-teal-600 dark:text-teal-400"
        />
        <StatCard
          title="Cofactor-Bound"
          value={cofactor}
          subtitle={`${cofactorPct}% of total`}
          colorClass="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Client component: charts + table */}
      <CofactorClient freeIon={freeIon} cofactor={cofactor} byCofactor={byCofactor} />
    </div>
  );
}
