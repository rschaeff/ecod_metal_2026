'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

const ExpansionBarChart = dynamic(
  () => import('./ExpansionBarChart'),
  { ssr: false, loading: () => <div className="h-[350px] bg-gray-100 dark:bg-gray-700 rounded animate-pulse" /> }
);

interface LevelCounts {
  truth: number;
  predicted: number;
}

interface ExpansionStats {
  disulfide: { x: LevelCounts; t: LevelCounts; f: LevelCounts };
  metal: { x: LevelCounts; t: LevelCounts; f: LevelCounts };
}

interface PdbVsAfdbRow {
  tGroupId: string;
  tGroupName: string;
  pdbDomains: number;
  pdbPredicted: number;
  pdbPct: number;
  predictedDomains: number;
  predictedPredicted: number;
  predictedPct: number;
}

interface ExpansionClientProps {
  expansionStats: ExpansionStats | null;
  pdbVsAfdbRates: PdbVsAfdbRow[];
}

type SortKey = keyof PdbVsAfdbRow;

const columns: { key: SortKey; label: string; align: 'left' | 'right' }[] = [
  { key: 'tGroupId', label: 'T-Group', align: 'left' },
  { key: 'tGroupName', label: 'Name', align: 'left' },
  { key: 'pdbDomains', label: 'PDB Domains', align: 'right' },
  { key: 'pdbPct', label: 'PDB % Predicted', align: 'right' },
  { key: 'predictedDomains', label: 'Predicted Domains', align: 'right' },
  { key: 'predictedPct', label: 'Predicted % Predicted', align: 'right' },
];

export default function ExpansionClient({ expansionStats, pdbVsAfdbRates }: ExpansionClientProps) {
  const [sortBy, setSortBy] = useState<SortKey>('pdbDomains');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  const sortIcon = (col: SortKey) => {
    if (sortBy !== col) return '';
    return sortDir === 'asc' ? ' \u25B2' : ' \u25BC';
  };

  const sortedRows = useMemo(() => {
    const rows = [...pdbVsAfdbRates];
    rows.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
    return rows;
  }, [pdbVsAfdbRates, sortBy, sortDir]);

  return (
    <>
      {/* Grouped Bar Chart */}
      {expansionStats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Hierarchy Coverage: PDB Truth vs. Including Predictions
          </h2>
          <ExpansionBarChart expansionStats={expansionStats} />
        </div>
      )}

      {/* PDB vs Predicted Concordance Table */}
      {pdbVsAfdbRates.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              PDB vs. Predicted Structure Concordance
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Validates that cysteine classification predictions generalize across structure sources.
              Click column headers to sort.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none ${
                        col.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}{sortIcon(col.key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedRows.map((row) => (
                  <tr key={row.tGroupId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-amber-600 dark:text-amber-400">
                      {row.tGroupId}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                      {row.tGroupName}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                      {row.pdbDomains.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                      {(row.pdbPct * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                      {row.predictedDomains.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                      {(row.predictedPct * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
