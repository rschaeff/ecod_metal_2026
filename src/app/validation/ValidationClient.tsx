'use client';

import { useState, useMemo } from 'react';
import type { ConcordanceResult, ConcordanceRow } from '@/lib/analysisQueries';

interface ValidationClientProps {
  disulfideData: ConcordanceResult;
  metalFreeData: ConcordanceResult;
  metalAllData: ConcordanceResult;
}

type SortKey = keyof ConcordanceRow;
type SortDir = 'asc' | 'desc';

const columns: { key: SortKey; label: string; align: string }[] = [
  { key: 'tGroupId', label: 'T-Group', align: 'text-left' },
  { key: 'tGroupName', label: 'Name', align: 'text-left' },
  { key: 'nSsbond', label: '# Truth', align: 'text-right' },
  { key: 'nGeom', label: '# Predicted', align: 'text-right' },
  { key: 'nBoth', label: '# Both', align: 'text-right' },
  { key: 'sensitivity', label: 'Sensitivity', align: 'text-right' },
  { key: 'precision', label: 'Precision', align: 'text-right' },
];

function metricColor(value: number): string {
  if (value >= 0.9) return 'text-green-600 dark:text-green-400';
  if (value >= 0.7) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function metricBg(value: number): string {
  if (value >= 0.9) return 'bg-green-50 dark:bg-green-900/20';
  if (value >= 0.7) return 'bg-amber-50 dark:bg-amber-900/20';
  return 'bg-red-50 dark:bg-red-900/20';
}

function SmallStat({ title, value, colorClass }: { title: string; value: string | number; colorClass?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
      <p className={`mt-1 text-2xl font-bold ${colorClass ?? 'text-gray-900 dark:text-gray-100'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

function SortableTable({ rows, panelKey }: { rows: ConcordanceRow[]; panelKey: string }) {
  const [sortKey, setSortKey] = useState<SortKey>('sensitivity');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sortIcon = (col: SortKey) => sortKey !== col ? '' : sortDir === 'asc' ? ' \u25B2' : ' \u25BC';

  return (
    <div className="overflow-x-auto max-h-96 overflow-y-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
          <tr>
            {columns.map((col) => (
              <th
                key={`${panelKey}-${col.key}`}
                className={`px-3 py-2 ${col.align} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none whitespace-nowrap`}
                onClick={() => handleSort(col.key)}
              >
                {col.label}{sortIcon(col.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {sorted.map((row) => (
            <tr key={`${panelKey}-${row.tGroupId}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-3 py-2 text-gray-900 dark:text-gray-100 font-mono text-xs">{row.tGroupId}</td>
              <td className="px-3 py-2 text-gray-900 dark:text-gray-100 max-w-[200px] truncate" title={row.tGroupName}>{row.tGroupName}</td>
              <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">{row.nSsbond}</td>
              <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">{row.nGeom}</td>
              <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">{row.nBoth}</td>
              <td className={`px-3 py-2 text-right font-medium ${metricColor(row.sensitivity)}`}>
                {(row.sensitivity * 100).toFixed(1)}%
              </td>
              <td className={`px-3 py-2 text-right font-medium ${metricColor(row.precision)}`}>
                {(row.precision * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">No data available</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function ValidationClient({ disulfideData, metalFreeData, metalAllData }: ValidationClientProps) {
  const [includeCofactors, setIncludeCofactors] = useState(false);
  const metalData = includeCofactors ? metalAllData : metalFreeData;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Disulfide Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-amber-600 dark:text-amber-400">Disulfide Detection</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <SmallStat title="Ground Truth" value={disulfideData.summary.nSsbond} />
            <SmallStat title="Predicted" value={disulfideData.summary.nGeom} />
            <SmallStat title="Agreement" value={disulfideData.summary.nBoth} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-lg p-4 text-center ${metricBg(disulfideData.summary.sensitivity)}`}>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sensitivity</p>
              <p className={`text-3xl font-bold ${metricColor(disulfideData.summary.sensitivity)}`}>
                {(disulfideData.summary.sensitivity * 100).toFixed(1)}%
              </p>
            </div>
            <div className={`rounded-lg p-4 text-center ${metricBg(disulfideData.summary.precision)}`}>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Precision</p>
              <p className={`text-3xl font-bold ${metricColor(disulfideData.summary.precision)}`}>
                {(disulfideData.summary.precision * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Concordance by T-Group</h3>
            <SortableTable rows={disulfideData.rows} panelKey="disulfide" />
          </div>
        </div>
      </div>

      {/* Metal Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-teal-600 dark:text-teal-400">Metal-Binding Detection</h2>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 dark:text-gray-400 select-none cursor-pointer">
              {includeCofactors ? 'Free ions + cofactors' : 'Free ions only'}
            </label>
            <button
              role="switch"
              aria-checked={includeCofactors}
              onClick={() => setIncludeCofactors(!includeCofactors)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                includeCofactors ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                includeCofactors ? 'translate-x-4' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <SmallStat title="Ground Truth" value={metalData.summary.nSsbond} />
            <SmallStat title="Predicted" value={metalData.summary.nGeom} />
            <SmallStat title="Agreement" value={metalData.summary.nBoth} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-lg p-4 text-center ${metricBg(metalData.summary.sensitivity)}`}>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sensitivity</p>
              <p className={`text-3xl font-bold ${metricColor(metalData.summary.sensitivity)}`}>
                {(metalData.summary.sensitivity * 100).toFixed(1)}%
              </p>
            </div>
            <div className={`rounded-lg p-4 text-center ${metricBg(metalData.summary.precision)}`}>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Precision</p>
              <p className={`text-3xl font-bold ${metricColor(metalData.summary.precision)}`}>
                {(metalData.summary.precision * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Concordance by T-Group</h3>
            <SortableTable rows={metalData.rows} panelKey="metal" />
          </div>
        </div>
      </div>
    </div>
  );
}
