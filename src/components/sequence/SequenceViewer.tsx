'use client';

import { useMemo, useState } from 'react';
import type { CysteineRecord } from '@/types/cysteine';
import {
  parseRangeDefinition,
  mapPositionToStructure,
  type StructureCys,
} from '@/lib/structurePositions';

interface SequenceViewerProps {
  sequence: string;
  classifications: CysteineRecord[];
  // Optional ECOD range_definition (e.g., "A:5-150"). When supplied, the
  // tooltip surfaces the source-structure (chain, resnum) coordinate so the
  // reader can cross-reference RCSB or AFDB outside the page.
  rangeDefinition?: string | null;
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

export default function SequenceViewer({ sequence, classifications, rangeDefinition }: SequenceViewerProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; record: CysteineRecord } | null>(null);

  // Build a position-to-classification map
  const classMap = new Map<number, CysteineRecord>();
  for (const c of classifications) {
    classMap.set(c.cysPosition, c);
  }

  // Pre-resolve every classified cysteine's structure coordinate so the
  // tooltip lookup is O(1).
  const structureMap = useMemo<Map<number, StructureCys>>(() => {
    const segments = parseRangeDefinition(rangeDefinition);
    const m = new Map<number, StructureCys>();
    if (segments.length === 0) return m;
    for (const c of classifications) {
      const mapped = mapPositionToStructure(c.cysPosition, segments);
      if (mapped) m.set(c.cysPosition, mapped);
    }
    return m;
  }, [classifications, rangeDefinition]);

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
        const cysPos = record.cysPosition;
        lineChars.push(
          <span
            key={j}
            role="button"
            tabIndex={0}
            title="Click to focus this cysteine in the 3D viewer"
            className={`${colors.bg} ${colors.text} font-bold cursor-pointer rounded-sm px-px hover:ring-2 hover:ring-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500`}
            onMouseEnter={(e) => {
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              setTooltip({ x: rect.left, y: rect.bottom + 4, record });
            }}
            onMouseLeave={() => setTooltip(null)}
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent('tricyp:focus-cys', { detail: { cysPosition: cysPos } }),
              );
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.dispatchEvent(
                  new CustomEvent('tricyp:focus-cys', { detail: { cysPosition: cysPos } }),
                );
              }
            }}
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
      <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
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
        <span className="ml-auto italic text-gray-400 dark:text-gray-500">
          Click any cysteine to focus it in the 3D viewer
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
            {(() => {
              const struct = structureMap.get(tooltip.record.cysPosition);
              return struct ? (
                <span className="ml-2 text-xs font-mono text-gray-500 dark:text-gray-400">
                  · {struct.chain}:{struct.resnum}
                </span>
              ) : null;
            })()}
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
