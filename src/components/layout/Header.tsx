'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import ThemeToggle from '../ui/ThemeToggle';
import SearchBar from '../ui/SearchBar';

const navLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/benchmark', label: 'Benchmark' },
  { href: '/af-geometric', label: 'AF Geometric' },
  { href: '/h-group', label: 'H-Groups' },
  { href: '/family', label: 'Browse Families' },
  { href: '/downloads', label: 'Downloads' },
  { href: '/about', label: 'About' },
  { href: '/paper', label: 'Paper' },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-amber-600 dark:text-amber-400">TriCyp</span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 hidden xl:inline">
                Three-state cysteine classification
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-2 lg:space-x-3 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2 lg:px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  pathname === link.href
                    ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Compact search — desktop only at xl+ to keep the nav from wrapping. */}
          <div className="hidden xl:block w-64">
            <SearchBar compact placeholder="Search…" />
          </div>

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
            <div className="px-3 mb-4">
              <SearchBar compact placeholder="Search domain, PDB, F/H/X-group…" />
            </div>
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
