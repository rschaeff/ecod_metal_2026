import Link from 'next/link';
import { getFamilyList } from '@/lib/queries';
import FamilyListClient from './FamilyListClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Browse Families',
};

interface FamilyIndexProps {
  searchParams: Promise<{ page?: string; sortBy?: string; sortDir?: string }>;
}

export default async function FamilyIndexPage({ searchParams }: FamilyIndexProps) {
  const sp = await searchParams;
  const page = parseInt(sp.page || '1');
  const sortBy = sp.sortBy || 'n_metal';
  const sortDir = (sp.sortDir || 'desc') as 'asc' | 'desc';

  const result = await getFamilyList(page, 50, sortBy, sortDir);
  const totalPages = Math.ceil(result.total / 50);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/" className="hover:text-amber-600 dark:hover:text-amber-400">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-gray-100">Browse Families</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">ECOD Families</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {result.total.toLocaleString()} families with classified cysteines
        </p>
      </div>

      <FamilyListClient
        families={result.items}
        page={page}
        totalPages={totalPages}
        total={result.total}
        sortBy={sortBy}
        sortDir={sortDir}
      />
    </div>
  );
}
