'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

const CrossDomainChart = dynamic(
  () => import('./CrossDomainChart'),
  {
    ssr: false,
    loading: () => <div className="h-[350px] bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />,
  }
);

interface XGroupRow {
  xGroupId: string;
  xGroupName: string;
  intra: number;
  crossDomain: number;
  nDomains: number;
  crossPct: number;
}

interface CrossDomainClientProps {
  rows: XGroupRow[];
}

type SortKey = 'xGroupId' | 'xGroupName' | 'intra' | 'crossDomain' | 'crossPct' | 'nDomains';

export default function CrossDomainClient({ rows }: CrossDomainClientProps) {
  const [sortBy, setSortBy] = useState<SortKey>('crossDomain');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [rows, sortBy, sortDir]);

  const top15 = useMemo(() => {
    return [...rows]
      .sort((a, b) => b.crossDomain - a.crossDomain)
      .slice(0, 15);
  }, [rows]);

  function handleSort(key: SortKey) {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  }

  function sortIndicator(key: SortKey) {
    if (sortBy !== key) return null;
    return sortDir === 'asc' ? ' \u25B2' : ' \u25BC';
  }

  function crossPctColor(pct: number): string {
    if (pct >= 50) return 'text-amber-700 dark:text-amber-300 font-semibold';
    if (pct >= 25) return 'text-amber-600 dark:text-amber-400';
    if (pct >= 10) return 'text-amber-500 dark:text-amber-500';
    return 'text-gray-600 dark:text-gray-400';
  }

  return (
    <>
      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Top 15 X-Groups by Cross-Domain Disulfides
        </h2>
        <CrossDomainChart data={top15} />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          All X-Groups ({rows.length.toLocaleString()})
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {([
                  ['xGroupId', 'X-Group ID'],
                  ['xGroupName', 'Name'],
                  ['intra', 'Intra'],
                  ['crossDomain', 'Cross'],
                  ['crossPct', '% Cross'],
                  ['nDomains', 'Domains'],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className={`px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:text-amber-600 dark:hover:text-amber-400 ${
                      key === 'xGroupId' || key === 'xGroupName' ? 'text-left' : 'text-right'
                    }`}
                  >
                    {label}{sortIndicator(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sorted.map((row) => (
                <tr key={row.xGroupId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-2 text-gray-900 dark:text-gray-100 font-mono text-xs">
                    {row.xGroupId}
                  </td>
                  <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                    {row.xGroupName}
                  </td>
                  <td className="px-3 py-2 text-right text-teal-600 dark:text-teal-400 font-medium">
                    {row.intra.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right text-amber-600 dark:text-amber-400 font-medium">
                    {row.crossDomain.toLocaleString()}
                  </td>
                  <td className={`px-3 py-2 text-right ${crossPctColor(row.crossPct)}`}>
                    {row.crossPct.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">
                    {row.nDomains.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
