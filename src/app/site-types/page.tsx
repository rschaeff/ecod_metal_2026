import Link from 'next/link';
import { getSiteTypeMapping } from '@/lib/analysisQueries';
import SiteTypesClient from './SiteTypesClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Site Types',
};

export default async function SiteTypesPage() {
  let data: Awaited<ReturnType<typeof getSiteTypeMapping>> = [];
  let dbError = false;

  try {
    data = await getSiteTypeMapping();
  } catch (e) {
    console.error('Site Types DB error:', e);
    dbError = true;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/" className="hover:text-amber-600 dark:hover:text-amber-400">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-gray-100">Site Types</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Metal Coordination Site Types
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          T-groups categorized by their dominant cysteine-metal coordination type.
          Each T-group is assigned to the site category representing its most frequent
          metal/cofactor combination among cysteine-coordinating LINK records.
        </p>
      </div>

      {dbError && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-amber-800 dark:text-amber-300 text-sm">
          Unable to connect to the database. Site type data may not be loaded yet.
        </div>
      )}

      {!dbError && data.length > 0 && (
        <SiteTypesClient data={data} />
      )}

      {!dbError && data.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No site type data available.
        </div>
      )}
    </div>
  );
}
