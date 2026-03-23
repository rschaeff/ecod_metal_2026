'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

const CofactorPieChart = dynamic(
  () => import('./CofactorPieChart'),
  {
    ssr: false,
    loading: () => <div className="h-[300px] bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />,
  }
);

interface CofactorRow {
  cofactor: string;
  totalLinks: number;
  cysLinks: number;
  nDomains: number;
}

interface CofactorClientProps {
  freeIon: number;
  cofactor: number;
  byCofactor: CofactorRow[];
}

type SortKey = 'cofactor' | 'totalLinks' | 'cysLinks' | 'nDomains';

export default function CofactorClient({ freeIon, cofactor, byCofactor }: CofactorClientProps) {
  const [sortBy, setSortBy] = useState<SortKey>('totalLinks');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sorted = useMemo(() => {
    return [...byCofactor].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [byCofactor, sortBy, sortDir]);

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

  return (
    <>
      {/* Pie Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Free Ion vs Cofactor Distribution
        </h2>
        <CofactorPieChart freeIon={freeIon} cofactor={cofactor} />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Cofactor Breakdown ({byCofactor.length.toLocaleString()} cofactors)
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {([
                  ['cofactor', 'Cofactor'],
                  ['totalLinks', 'Total LINK Records'],
                  ['cysLinks', 'Cys-Coordinated'],
                  ['nDomains', 'Domains'],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className={`px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:text-amber-600 dark:hover:text-amber-400 ${
                      key === 'cofactor' ? 'text-left' : 'text-right'
                    }`}
                  >
                    {label}{sortIndicator(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sorted.map((row) => (
                <tr key={row.cofactor} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-2 text-gray-900 dark:text-gray-100 font-medium">
                    {row.cofactor}
                  </td>
                  <td className="px-3 py-2 text-right text-amber-600 dark:text-amber-400 font-medium">
                    {row.totalLinks.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right text-teal-600 dark:text-teal-400 font-medium">
                    {row.cysLinks.toLocaleString()}
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
