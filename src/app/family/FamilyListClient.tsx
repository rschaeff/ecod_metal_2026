'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { FamilyListItem } from '@/lib/queries';

interface FamilyListClientProps {
  families: FamilyListItem[];
  page: number;
  totalPages: number;
  total: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

const columns = [
  { key: 'f_group_id', label: 'F-Group' },
  { key: 'f_group_name', label: 'Name' },
  { key: 'x_group_name', label: 'X-Group' },
  { key: 'domain_count', label: 'Domains' },
  { key: 'total_cys', label: 'Total Cys' },
  { key: 'n_disulfide', label: 'Disulfide' },
  { key: 'n_metal', label: 'Metal' },
  { key: 'n_unclassified', label: 'Unclassified' },
];

export default function FamilyListClient({ families, page, totalPages, total, sortBy, sortDir }: FamilyListClientProps) {
  const router = useRouter();

  const handleSort = (key: string) => {
    const newDir = sortBy === key && sortDir === 'desc' ? 'asc' : 'desc';
    router.push(`/family?page=1&sortBy=${key}&sortDir=${newDir}`);
  };

  const handlePage = (newPage: number) => {
    router.push(`/family?page=${newPage}&sortBy=${sortBy}&sortDir=${sortDir}`);
  };

  const sortIcon = (col: string) => {
    if (sortBy !== col) return '';
    return sortDir === 'asc' ? ' \u25B2' : ' \u25BC';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {((page - 1) * 50) + 1}&ndash;{Math.min(page * 50, total)} of {total.toLocaleString()} families
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((col) => (
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
            {families.map((f) => (
              <tr key={f.fGroupId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-4 py-3 text-sm">
                  <Link
                    href={`/family/${f.fGroupId}`}
                    className="text-amber-600 dark:text-amber-400 hover:underline font-medium"
                  >
                    {f.fGroupId}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                  {f.fGroupName}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                  {f.xGroupName}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{f.domainCount}</td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">{f.totalCys}</td>
                <td className="px-4 py-3 text-sm text-amber-600 dark:text-amber-400">{f.nDisulfide}</td>
                <td className="px-4 py-3 text-sm text-teal-600 dark:text-teal-400">{f.nMetal}</td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{f.nUnclassified}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
  );
}
