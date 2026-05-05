'use client';

import { useState } from 'react';
import type { CysteineRecord } from '@/types/cysteine';

interface SequenceViewerProps {
  sequence: string;
  classifications: CysteineRecord[];
}

const COLORS: Record<string, { bg: string; text: string }> = {
  DISULFIDE: { bg: 'bg-red-200 dark:bg-red-800', text: 'text-red-900 dark:text-red-100' },
  METAL_BINDING: { bg: 'bg-green-200 dark:bg-green-800', text: 'text-green-900 dark:text-green-100' },
  UNCLASSIFIED: { bg: 'bg-gray-200 dark:bg-gray-600', text: 'text-gray-700 dark:text-gray-200' },
};

const CLASS_LABELS: Record<string, string> = {
  DISULFIDE: 'Disulfide',
  METAL_BINDING: 'Metal-binding',
  UNCLASSIFIED: 'Free thiol',
};

export default function SequenceViewer({ sequence, classifications }: SequenceViewerProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; record: CysteineRecord } | null>(null);

  // Build a position-to-classification map
  const classMap = new Map<number, CysteineRecord>();
  for (const c of classifications) {
    classMap.set(c.cysPosition, c);
  }

  const CHARS_PER_LINE = 60;
  const lines: React.ReactNode[][] = [];

  for (let i = 0; i < sequence.length; i += CHARS_PER_LINE) {
    const lineChars: React.ReactNode[] = [];
    const end = Math.min(i + CHARS_PER_LINE, sequence.length);

    for (let j = i; j < end; j++) {
      const char = sequence[j];
      const pos = j + 1; // 1-indexed
      const record = classMap.get(pos);

      if (char === 'C' && record) {
        const colors = COLORS[record.classification];
        lineChars.push(
          <span
            key={j}
            className={`${colors.bg} ${colors.text} font-bold cursor-pointer rounded-sm px-px`}
            onMouseEnter={(e) => {
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              setTooltip({ x: rect.left, y: rect.bottom + 4, record });
            }}
            onMouseLeave={() => setTooltip(null)}
          >
            {char}
          </span>
        );
      } else {
        lineChars.push(
          <span key={j} className="text-gray-600 dark:text-gray-400">{char}</span>
        );
      }

      // Add space every 10 chars
      if ((j - i + 1) % 10 === 0 && j < end - 1) {
        lineChars.push(<span key={`sp-${j}`}> </span>);
      }
    }

    lines.push(lineChars);
  }

  return (
    <div className="relative">
      <pre className="font-mono text-sm leading-6 overflow-x-auto p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {lines.map((line, i) => (
          <div key={i} className="flex">
            <span className="text-gray-400 dark:text-gray-500 w-12 text-right mr-4 select-none shrink-0">
              {(i * CHARS_PER_LINE + 1).toString().padStart(4)}
            </span>
            <span className="break-all">{line}</span>
          </div>
        ))}
      </pre>

      {/* Legend */}
      <div className="flex gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-red-200 dark:bg-red-800 inline-block" />
          Disulfide
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-800 inline-block" />
          Metal-binding
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-600 inline-block" />
          Free thiol
        </span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 text-sm max-w-xs"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="font-medium text-gray-900 dark:text-gray-100">
            Cys {tooltip.record.cysPosition}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Classification: <span className="font-medium">{CLASS_LABELS[tooltip.record.classification] ?? tooltip.record.classification}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Confidence: {tooltip.record.confidence.toFixed(2)}
          </p>
          {tooltip.record.evidence && (
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              Evidence: {tooltip.record.evidence}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
