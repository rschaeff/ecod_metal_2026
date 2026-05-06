'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // The Next.js runtime already logs the error server-side; this client
    // log gives a paper trail in the browser console for users who report
    // an issue with the page.
    console.error('TriCyp page error:', error);
  }, [error]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
          Something went wrong
        </p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
          This page hit an unexpected error.
        </h1>
        <p className="mt-4 text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          The page failed to render. Most often this is a transient database
          connection issue — try again in a moment, or jump to one of the
          surfaces below. If the error persists, the page digest is shown so
          you can quote it when reporting the issue.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-xs text-gray-500 dark:text-gray-400">
            digest: <span className="select-all">{error.digest}</span>
          </p>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-block px-5 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Back to dashboard
        </Link>
      </div>

      <nav className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
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
          href="/downloads"
          className="block px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-center hover:border-amber-400 dark:hover:border-amber-600 transition-colors"
        >
          Downloads
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
