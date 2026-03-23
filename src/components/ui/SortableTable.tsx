'use client';

import { useState } from 'react';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface SortableTableProps<T> {
  columns: Column<T>[];
  data: T[];
  defaultSortKey?: string;
  defaultSortDir?: 'asc' | 'desc';
  onSort?: (sortBy: string, sortDir: 'asc' | 'desc') => void;
  serverSide?: boolean;
}

export default function SortableTable<T extends Record<string, unknown>>({
  columns,
  data,
  defaultSortKey,
  defaultSortDir = 'asc',
  onSort,
  serverSide = false,
}: SortableTableProps<T>) {
  const [sortKey, setSortKey] = useState(defaultSortKey || '');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSortDir);

  const handleSort = (key: string) => {
    const newDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDir(newDir);
    if (onSort) onSort(key, newDir);
  };

  const sortedData = serverSide
    ? data
    : [...data].sort((a, b) => {
        if (!sortKey) return 0;
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const cmp = typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal));
        return sortDir === 'desc' ? -cmp : cmp;
      });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                  col.sortable !== false ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none' : ''
                }`}
                onClick={() => col.sortable !== false && handleSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable !== false && sortKey === col.key && (
                    <span>{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {sortedData.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                  {col.render ? col.render(row) : String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
