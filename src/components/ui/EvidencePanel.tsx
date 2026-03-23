'use client';

import { useState } from 'react';

interface EvidencePanelProps {
  title: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function EvidencePanel({ title, count, children, defaultOpen = false }: EvidencePanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-gray-100">{title}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
            {count}
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="p-4 bg-white dark:bg-gray-900">
          {children}
        </div>
      )}
    </div>
  );
}
