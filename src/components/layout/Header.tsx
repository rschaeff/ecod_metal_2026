'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import ThemeToggle from '../ui/ThemeToggle';

const navLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/family', label: 'Browse Families' },
];

const analysisLinks = [
  { href: '/validation', label: 'Validation' },
  { href: '/validation/cross-domain', label: 'Cross-Domain Disulfides' },
  { href: '/validation/cofactors', label: 'Cofactor Analysis' },
  { href: '/site-types', label: 'Site Types' },
  { href: '/expansion', label: 'Expansion' },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);

  const isAnalysisActive = pathname.startsWith('/validation') || pathname.startsWith('/site-types') || pathname.startsWith('/expansion');

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-amber-600 dark:text-amber-400">CysBrowser</span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
                ECOD Cysteine Classification
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-4 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Analysis dropdown */}
            <div className="relative">
              <button
                onClick={() => setAnalysisOpen(!analysisOpen)}
                onBlur={() => setTimeout(() => setAnalysisOpen(false), 150)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                  isAnalysisActive
                    ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Analysis
                <svg className={`w-4 h-4 transition-transform ${analysisOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {analysisOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden z-50">
                  {analysisLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        pathname.startsWith(link.href)
                          ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                      onClick={() => setAnalysisOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname === link.href
                      ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Analysis</div>
              {analysisLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium pl-6 ${
                    pathname.startsWith(link.href)
                      ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="mt-4 px-3 flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
