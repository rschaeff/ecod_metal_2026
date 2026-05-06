import Link from 'next/link';
import { getFamilyList, KINGDOMS, type Kingdom } from '@/lib/queries';
import FamilyListClient from './FamilyListClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Browse Families',
};

interface FamilyIndexProps {
  searchParams: Promise<{
    page?: string;
    sortBy?: string;
    sortDir?: string;
    kingdom?: string;
  }>;
}

function parseKingdom(raw: string | undefined): Kingdom | null {
  if (!raw) return null;
  return (KINGDOMS as readonly string[]).includes(raw) ? (raw as Kingdom) : null;
}

export default async function FamilyIndexPage({ searchParams }: FamilyIndexProps) {
  const sp = await searchParams;
  const page = parseInt(sp.page || '1');
  const sortBy = sp.sortBy || 'n_metal';
  const sortDir = (sp.sortDir || 'desc') as 'asc' | 'desc';
  const kingdom = parseKingdom(sp.kingdom);

  const result = await getFamilyList(page, 50, sortBy, sortDir, kingdom);
  const totalPages = Math.ceil(result.total / 50);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/" className="hover:text-amber-600 dark:hover:text-amber-400">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-gray-100">Browse Families</span>
      </nav>

      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">ECOD Families</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {result.total.toLocaleString()} families
            {kingdom ? ` with ${kingdom} F70 representatives` : ' with classified cysteines'}
          </p>
        </div>
        {kingdom && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-sm font-medium">
              Kingdom: {kingdom}
              <Link
                href={`/family?sortBy=${sortBy}&sortDir=${sortDir}`}
                className="text-xs hover:text-amber-900 dark:hover:text-amber-100"
                aria-label="Clear kingdom filter"
              >
                ✕
              </Link>
            </span>
          </div>
        )}
      </div>

      <FamilyListClient
        families={result.items}
        page={page}
        totalPages={totalPages}
        total={result.total}
        sortBy={sortBy}
        sortDir={sortDir}
        kingdom={kingdom}
      />
    </div>
  );
}
