import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getXGroupDetail } from '@/lib/queries';
import { summaryCache, CACHE_TTL, cachedQuery } from '@/lib/cache';

export const dynamic = 'force-dynamic';

interface XGroupPageProps {
  params: Promise<{ xGroupId: string }>;
}

export async function generateMetadata({ params }: XGroupPageProps): Promise<Metadata> {
  const { xGroupId } = await params;
  return { title: `X-group ${decodeURIComponent(xGroupId)}` };
}

function fmt(n: number): string {
  return n.toLocaleString();
}

function pct(n: number, total: number): string {
  if (total <= 0) return '—';
  return `${((n / total) * 100).toFixed(1)}%`;
}

export default async function XGroupPage({ params }: XGroupPageProps) {
  const { xGroupId: raw } = await params;
  const xGroupId = decodeURIComponent(raw);

  let detail: Awaited<ReturnType<typeof getXGroupDetail>> = null;
  try {
    detail = await cachedQuery(
      summaryCache,
      `xgroup-detail-${xGroupId}`,
      CACHE_TTL.FAMILY,
      () => getXGroupDetail(xGroupId),
    );
  } catch (e) {
    console.error('X-group detail query failed:', e);
  }
  if (!detail) notFound();

  const empty = detail.nHGroups === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/" className="hover:text-amber-600 dark:hover:text-amber-400">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700 dark:text-gray-300">X-groups</span>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-gray-100 font-mono">{detail.xGroupId}</span>
      </nav>

      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          X-group · {detail.xGroupId}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
          {detail.xGroupName}
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {detail.nHGroups.toLocaleString()} H-groups ·{' '}
          {(detail.nPdbReps + detail.nAfdbReps).toLocaleString()} F70 representative domains
        </p>
      </header>

      {empty ? (
        <section className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-6 text-sm text-amber-800 dark:text-amber-200">
          No classified F70 representatives are currently associated with this X-group. The
          ECOD cluster may exist but lacks domains in the cysteine-classification dataset.
        </section>
      ) : (
        <>
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">PDB reps</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{fmt(detail.nPdbReps)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">AFDB reps</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{fmt(detail.nAfdbReps)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Cys</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100 font-mono">{fmt(detail.totalCys)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs uppercase tracking-wider text-red-600 dark:text-red-400">Disulfide</p>
              <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
                {pct(detail.nDisulfide, detail.totalCys)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                {fmt(detail.nDisulfide)} cys
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs uppercase tracking-wider text-green-600 dark:text-green-400">Metal-binding</p>
              <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400 font-mono">
                {pct(detail.nMetalBinding, detail.totalCys)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                {fmt(detail.nMetalBinding)} cys
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Free thiol</p>
              <p className="mt-1 text-2xl font-bold text-gray-700 dark:text-gray-300 font-mono">
                {pct(detail.nUnclassified, detail.totalCys)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                {fmt(detail.nUnclassified)} cys
              </p>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <header className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  H-groups in this X-group
                </h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Ordered by total F70 representative count, descending.
                </p>
              </div>
              <Link
                href="/h-group"
                className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
              >
                Browse all H-groups →
              </Link>
            </header>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                    <th className="px-4 py-2">H-group</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2 text-right">PDB reps</th>
                    <th className="px-4 py-2 text-right">AFDB reps</th>
                    <th className="px-4 py-2 text-right">Cys</th>
                    <th className="px-4 py-2 text-right">Disulfide</th>
                    <th className="px-4 py-2 text-right">Metal</th>
                    <th className="px-4 py-2 text-right">Free thiol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {detail.hGroups.map((h) => (
                    <tr key={h.hGroupId} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                      <td className="px-4 py-2 font-mono">
                        <Link
                          href={`/h-group/${encodeURIComponent(h.hGroupId)}`}
                          className="text-amber-600 dark:text-amber-400 hover:underline"
                        >
                          {h.hGroupId}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300 max-w-md truncate">
                        {h.hGroupName}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">{fmt(h.nPdbReps)}</td>
                      <td className="px-4 py-2 text-right font-mono">{fmt(h.nAfdbReps)}</td>
                      <td className="px-4 py-2 text-right font-mono">{fmt(h.totalCys)}</td>
                      <td className="px-4 py-2 text-right font-mono text-red-600 dark:text-red-400">
                        {pct(h.nDisulfide, h.totalCys)}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-green-600 dark:text-green-400">
                        {pct(h.nMetalBinding, h.totalCys)}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-gray-500">
                        {pct(h.nUnclassified, h.totalCys)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
