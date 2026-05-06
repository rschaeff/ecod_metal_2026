import Link from 'next/link';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { DATA_VERSION } from '@/lib/paperData';

async function getDataRefreshedAt(): Promise<string | null> {
  try {
    const txt = await fs.readFile(
      path.join(process.cwd(), 'public', 'data', '.generated-at'),
      'utf8',
    );
    const d = new Date(txt.trim());
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

export default async function Footer() {
  const currentYear = new Date().getFullYear();
  const refreshedAt = await getDataRefreshedAt();

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              TriCyp
            </h3>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Three-state cysteine classification across ECOD F70 representative domains —
              disulfide-bonded, metal-binding, or free thiol — combining ESM2 predictions
              with PDB structural evidence.
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
              <li>
                <Link href="/h-group" className="text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400">
                  H-Groups
                </Link>
              </li>
              <li>
                <Link href="/benchmark" className="text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400">
                  Benchmark
                </Link>
              </li>
              <li>
                <Link href="/af-geometric" className="text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400">
                  AF Geometric
                </Link>
              </li>
              <li>
                <Link href="/downloads" className="text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400">
                  Downloads &amp; API
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400">
                  About / Methods
                </Link>
              </li>
              <li>
                <Link href="/paper" className="text-sm text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400">
                  Paper
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

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-500 dark:text-gray-400">
          <p className="text-center sm:text-left">
            &copy; {currentYear} Schaeffer &amp; Cong Labs, UT Southwestern Medical Center
          </p>
          <p className="text-center sm:text-right font-mono text-xs">
            <Link href="/about" className="hover:text-amber-600 dark:hover:text-amber-400" title="See About / Methods for the data version policy">
              data · {DATA_VERSION}
            </Link>
            {refreshedAt && (
              <>
                <span className="mx-1.5 text-gray-300 dark:text-gray-600">·</span>
                <span>refreshed {refreshedAt}</span>
              </>
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
