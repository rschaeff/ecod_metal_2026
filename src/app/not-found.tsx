import Link from 'next/link';
import SearchBar from '@/components/ui/SearchBar';

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          404 · Not Found
        </p>
        <h1 className="mt-2 text-4xl font-bold text-gray-900 dark:text-gray-100">
          That page isn&apos;t in TriCyp.
        </h1>
        <p className="mt-4 text-base text-gray-600 dark:text-gray-400">
          The link may be stale, or you may be looking for a domain, family,
          or H-group that hasn&apos;t been classified yet. Try the search
          below — it accepts ECOD domain IDs (e.g.{' '}
          <code className="font-mono">e3h35A1</code>), PDB IDs, UniProt
          accessions, or F/H/X-group dotted notation.
        </p>
      </div>

      <div className="mt-8">
        <SearchBar />
      </div>

      <nav className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Link
          href="/"
          className="block px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-center hover:border-amber-400 dark:hover:border-amber-600 transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/family"
          className="block px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-center hover:border-amber-400 dark:hover:border-amber-600 transition-colors"
        >
          Browse Families
        </Link>
        <Link
          href="/h-group"
          className="block px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-center hover:border-amber-400 dark:hover:border-amber-600 transition-colors"
        >
          H-Groups
        </Link>
        <Link
          href="/paper"
          className="block px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-center hover:border-amber-400 dark:hover:border-amber-600 transition-colors"
        >
          Paper
        </Link>
      </nav>
    </div>
  );
}
