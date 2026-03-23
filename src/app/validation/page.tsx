import Link from 'next/link';
import { getDisulfideConcordance, getMetalConcordance } from '@/lib/analysisQueries';
import type { ConcordanceResult } from '@/lib/analysisQueries';
import ValidationClient from './ValidationClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Validation',
};

const emptyResult: ConcordanceResult = {
  summary: { nSsbond: 0, nGeom: 0, nBoth: 0, fn: 0, fp: 0, sensitivity: 0, precision: 0 },
  rows: [],
};

export default async function ValidationPage() {
  let disulfideData = emptyResult;
  let metalFreeData = emptyResult;
  let metalAllData = emptyResult;
  let dbError = false;

  try {
    [disulfideData, metalFreeData, metalAllData] = await Promise.all([
      getDisulfideConcordance(),
      getMetalConcordance(false),
      getMetalConcordance(true),
    ]);
  } catch (e) {
    console.error('Validation DB error:', e);
    dbError = true;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/" className="hover:text-amber-600 dark:hover:text-amber-400">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-gray-100">Validation</span>
      </nav>

      {dbError && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-amber-800 dark:text-amber-300 text-sm">
          Unable to load validation data.
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Prediction Validation</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Concordance between structural ground truth and predicted cysteine classifications by T-group
        </p>
      </div>

      <ValidationClient
        disulfideData={disulfideData}
        metalFreeData={metalFreeData}
        metalAllData={metalAllData}
      />

      <div className="mt-10 flex flex-wrap gap-4 justify-center">
        <Link href="/validation/cross-domain"
          className="inline-block px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium">
          Cross-Domain Disulfides
        </Link>
        <Link href="/validation/cofactors"
          className="inline-block px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium">
          Cofactor Analysis
        </Link>
      </div>
    </div>
  );
}
