import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Cysteine Classification Browser
            </h3>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              ESM2-based classification of cysteine residues across ECOD F70 representative
              domains as disulfide-bonded, metal-binding, or unclassified, with structural
              corroboration from PDB annotations.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Navigation
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/family" className="text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400">
                  Browse Families
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Resources
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="http://prodata.swmed.edu/ecod/" target="_blank" rel="noopener noreferrer"
                   className="text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400">
                  ECOD Database
                </a>
              </li>
              <li>
                <a href="https://www.rcsb.org/" target="_blank" rel="noopener noreferrer"
                   className="text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400">
                  RCSB PDB
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            &copy; {currentYear} Schaeffer &amp; Cong Labs, UT Southwestern Medical Center
          </p>
        </div>
      </div>
    </footer>
  );
}
