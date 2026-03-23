'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  compact?: boolean;
  placeholder?: string;
}

export default function SearchBar({ compact = false, placeholder = 'Search domain, PDB, or family ID...' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ type: string; id: string; label: string; description: string }>>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.data);
        setShowDropdown(data.data.length > 0);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    doSearch(val);
  };

  const handleSelect = (result: { type: string; id: string }) => {
    setShowDropdown(false);
    setQuery('');
    if (result.type === 'domain') {
      router.push(`/domain/${result.id}`);
    } else if (result.type === 'family') {
      router.push(`/family/${result.id}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      handleSelect(results[0]);
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
            compact ? 'px-3 py-1.5 text-sm' : 'px-4 py-3 text-base'
          }`}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </form>

      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
          {results.map((r, i) => (
            <button
              key={`${r.type}-${r.id}-${i}`}
              onMouseDown={() => handleSelect(r)}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-gray-100">{r.label}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  {r.type}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{r.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
