'use client';

import { useState, useMemo } from 'react';
import type { SiteTypeRow } from '@/lib/analysisQueries';

interface SiteTypesClientProps {
  data: SiteTypeRow[];
}

interface Category {
  key: string;
  label: string;
  items: SiteTypeRow[];
}

const HEME_COFACTORS = new Set(['HEM', 'HEC', 'HEA', 'HEB']);

function categorize(row: SiteTypeRow): string {
  if (row.cofactor === null && row.metal === 'ZN') return 'zinc';
  if (row.cofactor === 'SF4') return 'sf4';
  if (row.cofactor === 'FES') return 'fes';
  if (row.cofactor === 'F3S') return 'f3s';
  if (row.cofactor !== null && HEME_COFACTORS.has(row.cofactor)) return 'heme';
  if (row.cofactor === 'CUA' || (row.cofactor === null && row.metal === 'CU')) return 'copper';
  return 'other';
}

const CATEGORY_ORDER: { key: string; label: string }[] = [
  { key: 'zinc', label: 'Zinc (free ion)' },
  { key: 'sf4', label: 'Iron-sulfur [4Fe-4S]' },
  { key: 'fes', label: 'Iron-sulfur [2Fe-2S]' },
  { key: 'f3s', label: 'Iron-sulfur [3Fe-4S]' },
  { key: 'heme', label: 'Heme' },
  { key: 'copper', label: 'Copper' },
  { key: 'other', label: 'Other' },
];

export default function SiteTypesClient({ data }: SiteTypesClientProps) {
  const categories = useMemo(() => {
    const grouped: Record<string, SiteTypeRow[]> = {};
    for (const cat of CATEGORY_ORDER) {
      grouped[cat.key] = [];
    }
    for (const row of data) {
      const key = categorize(row);
      grouped[key].push(row);
    }
    return CATEGORY_ORDER
      .map((cat) => ({
        key: cat.key,
        label: cat.label,
        items: grouped[cat.key],
      }))
      .filter((cat) => cat.items.length > 0);
  }, [data]);

  const [selectedKey, setSelectedKey] = useState<string>(
    categories.length > 0 ? categories[0].key : ''
  );

  const selected = categories.find((c) => c.key === selectedKey) || null;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left panel: accordion */}
      <div className="lg:w-80 shrink-0">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Site Categories
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedKey(cat.key)}
                className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                  selectedKey === cat.key
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-transparent'
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    selectedKey === cat.key
                      ? 'text-amber-700 dark:text-amber-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {cat.label}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedKey === cat.key
                      ? 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {cat.items.length} T-group{cat.items.length !== 1 ? 's' : ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel: detail table */}
      <div className="flex-1 min-w-0">
        {selected ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {selected.label}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {selected.items.length} T-group{selected.items.length !== 1 ? 's' : ''} with dominant
                cysteine-{selected.label.toLowerCase()} coordination
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      T-Group ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Metal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cofactor
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      LINK Records
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {selected.items.map((row) => (
                    <tr
                      key={row.tGroupId}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-amber-600 dark:text-amber-400">
                        {row.tGroupId}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                        {row.tGroupName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {row.metal}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {row.cofactor || '\u2014'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-teal-600 dark:text-teal-400 font-medium">
                        {row.nLinks.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Select a category to view T-groups.
          </div>
        )}
      </div>
    </div>
  );
}
