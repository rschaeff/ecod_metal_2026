import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getFamilyInfo, getFamilyDomains, getFamilyTaxonomy } from '@/lib/queries';
import FamilyClient from './FamilyClient';

export const dynamic = 'force-dynamic';

interface FamilyPageProps {
  params: Promise<{ fGroupId: string }>;
  searchParams: Promise<{ page?: string; sortBy?: string; sortDir?: string }>;
}

export async function generateMetadata({ params }: FamilyPageProps) {
  const { fGroupId } = await params;
  const info = await getFamilyInfo(fGroupId);
  return {
    title: info ? `Family: ${info.fGroupName}` : 'Family Not Found',
  };
}

export default async function FamilyPage({ params, searchParams }: FamilyPageProps) {
  const { fGroupId } = await params;
  const sp = await searchParams;

  const page = parseInt(sp.page || '1');
  const sortBy = sp.sortBy || 'domain_id';
  const sortDir = (sp.sortDir || 'asc') as 'asc' | 'desc';

  const [familyInfo, domainsResult, taxonomy] = await Promise.all([
    getFamilyInfo(fGroupId),
    getFamilyDomains(fGroupId, page, 50, sortBy, sortDir),
    getFamilyTaxonomy(fGroupId),
  ]);

  if (!familyInfo) notFound();

  const totalPages = Math.ceil(domainsResult.total / 50);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/" className="hover:text-amber-600 dark:hover:text-amber-400">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-gray-100">Family {familyInfo.fGroupId}</span>
      </nav>

      {/* Family Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{familyInfo.fGroupName}</h1>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
          <span>X-group: {familyInfo.xGroupName}</span>
          <span>H-group: {familyInfo.hGroupName}</span>
          <span>T-group: {familyInfo.tGroupName}</span>
        </div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {familyInfo.domainCount.toLocaleString()} F70 representative domains
        </p>
        {taxonomy.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {taxonomy.map((t) => (
              <span key={t.superkingdom} className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {t.superkingdom}: {t.nDomains.toLocaleString()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Client-side components: chart + table + pagination */}
      <FamilyClient
        fGroupId={fGroupId}
        domains={domainsResult.items}
        page={page}
        totalPages={totalPages}
        total={domainsResult.total}
        sortBy={sortBy}
        sortDir={sortDir}
        familyCysTotals={{
          nDisulfide: familyInfo.nDisulfide,
          nMetalBinding: familyInfo.nMetalBinding,
          nUnclassified: familyInfo.nUnclassified,
        }}
      />
    </div>
  );
}
