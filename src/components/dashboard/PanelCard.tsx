'use client';

import { useState, type ReactNode } from 'react';

interface PanelCardProps {
  figureLabel: string;        // e.g., "Fig 3A"
  title: string;              // short panel title
  caption: string;            // paper-aligned caption
  csvFilename: string;        // download filename, e.g., "fig3a.csv"
  csvRows: (string | number)[][];  // first row is header
  children: ReactNode;        // the chart itself
  anchor?: string;            // optional id for /paper and /about jump links
  // 'live' = numbers came from a current DB query;
  // 'paper-snapshot' = panel is rendering paper-frozen constants because
  // the live query returned no data. Omit when the panel has no live path.
  dataSource?: 'live' | 'paper-snapshot';
}

function rowsToCsv(rows: (string | number)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(','),
    )
    .join('\n');
}

export default function PanelCard({
  figureLabel,
  title,
  caption,
  csvFilename,
  csvRows,
  children,
  anchor,
  dataSource,
}: PanelCardProps) {
  const [showData, setShowData] = useState(false);

  const downloadCsv = () => {
    const csv = rowsToCsv(csvRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = csvFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section
      id={anchor}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 scroll-mt-20"
    >
      <header className="flex items-baseline justify-between gap-4 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <span>{figureLabel}</span>
            {dataSource === 'live' && (
              <span
                title="Numbers computed from a live database query"
                className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 text-[10px] font-medium normal-case tracking-normal"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden />
                Live
              </span>
            )}
            {dataSource === 'paper-snapshot' && (
              <span
                title="DB query returned no rows; panel is rendering paper-frozen constants"
                className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 text-[10px] font-medium normal-case tracking-normal"
              >
                Paper snapshot
              </span>
            )}
          </p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <button
            type="button"
            onClick={() => setShowData((v) => !v)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline-offset-2 hover:underline"
          >
            {showData ? 'Hide data' : 'Show data'}
          </button>
          <span aria-hidden className="text-gray-300 dark:text-gray-600">|</span>
          <button
            type="button"
            onClick={downloadCsv}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline-offset-2 hover:underline"
          >
            Download CSV
          </button>
        </div>
      </header>

      {children}

      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {caption}
      </p>

      {showData && (
        <div className="mt-4 overflow-x-auto border-t border-gray-200 dark:border-gray-700 pt-4">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 uppercase">
                {csvRows[0]?.map((h, i) => (
                  <th key={i} className="px-3 py-1.5 font-medium">
                    {String(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {csvRows.slice(1).map((row, ri) => (
                <tr key={ri} className="text-gray-700 dark:text-gray-300">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-1.5 font-mono">
                      {String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
