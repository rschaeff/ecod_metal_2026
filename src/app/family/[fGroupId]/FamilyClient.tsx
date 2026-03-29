'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { FamilyDomain } from '@/types/cysteine';

const FamilyStackedBar = dynamic(
  () => import('@/components/charts/FamilyStackedBar'),
  { ssr: false, loading: () => <div className="h-[300px] bg-gray-100 dark:bg-gray-700 rounded animate-pulse" /> }
);

const ClassificationPieChart = dynamic(
  () => import('@/components/charts/ClassificationPieChart'),
  { ssr: false, loading: () => <div className="h-[300px] bg-gray-100 dark:bg-gray-700 rounded animate-pulse" /> }
);

const SMALL_FAMILY_THRESHOLD = 50;

interface FamilyClientProps {
  fGroupId: string;
  domains: FamilyDomain[];
  page: number;
  totalPages: number;
  total: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  familyCysTotals: {
    nDisulfide: number;
    nMetalBinding: number;
    nUnclassified: number;
  };
}

type CysFilter = 'all' | 'has_disulfide' | 'has_metal' | 'has_both' | 'has_cys';

const filterOptions: { value: CysFilter; label: string }[] = [
  { value: 'all', label: 'All domains' },
  { value: 'has_cys', label: 'Has cysteines' },
  { value: 'has_disulfide', label: 'Has disulfide' },
  { value: 'has_metal', label: 'Has metal-binding' },
  { value: 'has_both', label: 'Has both' },
];

export default function FamilyClient({ fGroupId, domains, page, totalPages, total, sortBy, sortDir, familyCysTotals }: FamilyClientProps) {
  const router = useRouter();
  const isSmallFamily = total <= SMALL_FAMILY_THRESHOLD;
  const [filter, setFilter] = useState<CysFilter>('all');

  const filteredDomains = useMemo(() => {
    if (filter === 'all') return domains;
    return domains.filter((d) => {
      switch (filter) {
        case 'has_cys': return d.totalCys > 0;
        case 'has_disulfide': return d.nDisulfide > 0;
        case 'has_metal': return d.nMetalBinding > 0;
        case 'has_both': return d.nDisulfide > 0 && d.nMetalBinding > 0;
        default: return true;
      }
    });
  }, [domains, filter]);

  const handleSort = (newSortBy: string) => {
    const newDir = sortBy === newSortBy && sortDir === 'asc' ? 'desc' : 'asc';
    router.push(`/family/${fGroupId}?page=1&sortBy=${newSortBy}&sortDir=${newDir}`);
  };

  const handlePage = (newPage: number) => {
    router.push(`/family/${fGroupId}?page=${newPage}&sortBy=${sortBy}&sortDir=${sortDir}`);
  };

  const sortIcon = (col: string) => {
    if (sortBy !== col) return '';
    return sortDir === 'asc' ? ' \u25B2' : ' \u25BC';
  };

  return (
    <>
      {/* Chart */}
      {domains.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          {isSmallFamily ? (
            <>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Cysteine Composition per Domain
              </h2>
              <FamilyStackedBar domains={domains} />
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Family Classification Distribution
              </h2>
              <ClassificationPieChart
                nDisulfide={familyCysTotals.nDisulfide}
                nMetalBinding={familyCysTotals.nMetalBinding}
                nUnclassified={familyCysTotals.nUnclassified}
              />
            </>
          )}
        </div>
      )}

      {/* Domain Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filter === 'all'
              ? `Showing ${((page - 1) * 50) + 1}\u2013${Math.min(page * 50, total)} of ${total.toLocaleString()} domains`
              : `${filteredDomains.length} of ${domains.length} domains on this page`}
          </p>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as CysFilter)}
            className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 focus:ring-2 focus:ring-amber-500"
          >
            {filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {[
                  { key: 'domain_id', label: 'Domain ID' },
                  { key: 'source_type', label: 'Source' },
                  { key: 'total_cys', label: 'Total Cys' },
                  { key: 'n_disulfide', label: 'Disulfide' },
                  { key: 'n_metal_binding', label: 'Metal' },
                  { key: 'n_unclassified', label: 'Unclassified' },
                ].map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}{sortIcon(col.key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDomains.map((d) => (
                <tr key={d.domainId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 text-sm">
                    <Link
                      href={`/domain/${d.domainId}`}
                      className="text-amber-600 dark:text-amber-400 hover:underline font-medium"
                    >
                      {d.domainId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 uppercase">{d.sourceType}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">{d.totalCys}</td>
                  <td className="px-4 py-3 text-sm text-amber-600 dark:text-amber-400">{d.nDisulfide}</td>
                  <td className="px-4 py-3 text-sm text-teal-600 dark:text-teal-400">{d.nMetalBinding}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{d.nUnclassified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <button
              onClick={() => handlePage(page - 1)}
              disabled={page <= 1}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => handlePage(page + 1)}
              disabled={page >= totalPages}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}
