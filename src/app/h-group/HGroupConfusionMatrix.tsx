'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  HGROUP_BIN_LABELS,
  hGroupBin,
  HGROUP_HIGHLIGHTS,
} from '@/lib/paperData';
import type { HGroupSummary } from '@/lib/queries';

type Task = 'disulfide' | 'metal';

interface HGroupConfusionMatrixProps {
  summaries: HGroupSummary[];
  task: Task;
}

interface MatrixCell {
  knownBin: number;
  predictedBin: number;
  hGroups: HGroupSummary[];
}

function bin(s: HGroupSummary, task: Task): { known: number | null; predicted: number | null } {
  if (task === 'disulfide') {
    return { known: hGroupBin(s.pdbDisulfidePct), predicted: hGroupBin(s.afdbDisulfidePct) };
  }
  return { known: hGroupBin(s.pdbMetalPct), predicted: hGroupBin(s.afdbMetalPct) };
}

// Spec calls out 12 disulfide / 3 metal candidate-novel cells. The
// "novel quadrant" is structurally-known < 5% AND ESM2-predicted ≥ 95%.
const NOVEL_KNOWN_BIN = 0;       // <5%
const NOVEL_PREDICTED_BIN = 3;   // ≥95%

function predictedPctOf(s: HGroupSummary, task: Task): number | null {
  return task === 'disulfide' ? s.afdbDisulfidePct : s.afdbMetalPct;
}

function knownPctOf(s: HGroupSummary, task: Task): number | null {
  return task === 'disulfide' ? s.pdbDisulfidePct : s.pdbMetalPct;
}

export default function HGroupConfusionMatrix({ summaries, task }: HGroupConfusionMatrixProps) {
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);

  const matrix = useMemo<MatrixCell[][]>(() => {
    const cells: MatrixCell[][] = Array.from({ length: 4 }, (_, r) =>
      Array.from({ length: 4 }, (_, c) => ({
        knownBin: r,
        predictedBin: c,
        hGroups: [],
      })),
    );
    for (const s of summaries) {
      const { known, predicted } = bin(s, task);
      if (known === null || predicted === null) continue;
      cells[known][predicted].hGroups.push(s);
    }
    return cells;
  }, [summaries, task]);

  const maxCount = useMemo(() => {
    let m = 0;
    for (const row of matrix) for (const cell of row) m = Math.max(m, cell.hGroups.length);
    return m;
  }, [matrix]);

  const cellBg = (count: number, isNovel: boolean) => {
    if (count === 0) return 'bg-gray-50 dark:bg-gray-800';
    const intensity = maxCount > 0 ? count / maxCount : 0;
    // Use task-themed gradient: red for disulfide, green for metal
    const palette = task === 'disulfide'
      ? ['bg-red-50', 'bg-red-100', 'bg-red-200', 'bg-red-300', 'bg-red-400']
      : ['bg-green-50', 'bg-green-100', 'bg-green-200', 'bg-green-300', 'bg-green-400'];
    const idx = Math.min(palette.length - 1, Math.floor(intensity * palette.length));
    const ring = isNovel ? ' ring-2 ring-amber-500 dark:ring-amber-400' : '';
    return palette[idx] + ring;
  };

  const selectedCell = selected ? matrix[selected.row][selected.col] : null;
  const sortedSelected = useMemo(() => {
    if (!selectedCell) return [];
    return [...selectedCell.hGroups].sort((a, b) => {
      const pa = predictedPctOf(a, task) ?? 0;
      const pb = predictedPctOf(b, task) ?? 0;
      return pb - pa;
    });
  }, [selectedCell, task]);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="p-2"></th>
              <th
                colSpan={4}
                className="p-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center"
              >
                ESM2-predicted (AFDB-source)
              </th>
            </tr>
            <tr>
              <th className="p-2"></th>
              {HGROUP_BIN_LABELS.map((label, i) => (
                <th
                  key={i}
                  className="p-2 text-xs font-mono font-medium text-gray-600 dark:text-gray-400 text-center"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, rIdx) => (
              <tr key={rIdx}>
                {rIdx === 0 && (
                  <th
                    rowSpan={4}
                    className="p-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  >
                    Structurally known (PDB-source)
                  </th>
                )}
                {row.map((cell, cIdx) => {
                  const isNovel = rIdx === NOVEL_KNOWN_BIN && cIdx === NOVEL_PREDICTED_BIN;
                  const isSelected = selected?.row === rIdx && selected?.col === cIdx;
                  const cellLabel = `${HGROUP_BIN_LABELS[rIdx]} known / ${HGROUP_BIN_LABELS[cIdx]} predicted`;
                  return (
                    <td key={cIdx} className="p-1">
                      <button
                        type="button"
                        onClick={() =>
                          setSelected(isSelected ? null : { row: rIdx, col: cIdx })
                        }
                        disabled={cell.hGroups.length === 0}
                        aria-label={`${cellLabel}: ${cell.hGroups.length} H-groups`}
                        className={`w-20 h-20 flex flex-col items-center justify-center text-sm font-mono rounded transition-all ${cellBg(cell.hGroups.length, isNovel)} ${cell.hGroups.length === 0 ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:brightness-95 dark:hover:brightness-110'} ${isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}
                      >
                        <span className="text-base font-semibold text-gray-900">
                          {cell.hGroups.length}
                        </span>
                        {isNovel && cell.hGroups.length > 0 && (
                          <span className="text-[10px] text-amber-700 font-medium uppercase tracking-wider mt-0.5">
                            novel
                          </span>
                        )}
                      </button>
                      {rIdx === 3 && (
                        <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1 font-mono">
                          {/* axis label rendered in thead */}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td></td>
              {HGROUP_BIN_LABELS.map((label, i) => (
                <td
                  key={i}
                  className="text-xs text-center text-gray-500 dark:text-gray-400 font-mono pt-1"
                >
                  {label}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {selectedCell && (
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            <span className="font-medium">{sortedSelected.length}</span> H-group
            {sortedSelected.length === 1 ? '' : 's'} with{' '}
            <span className="font-mono">{HGROUP_BIN_LABELS[selected!.row]}</span>{' '}
            structurally-known and{' '}
            <span className="font-mono">{HGROUP_BIN_LABELS[selected!.col]}</span>{' '}
            ESM2-predicted {task === 'disulfide' ? 'disulfide' : 'metal-binding'} rate
            {selected!.row === NOVEL_KNOWN_BIN && selected!.col === NOVEL_PREDICTED_BIN && (
              <span className="ml-2 inline-block px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-medium">
                candidate novel cell
              </span>
            )}
            . Sorted by ESM2-predicted fraction, descending.
          </p>
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                  <th className="px-3 py-2">H-group</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2 text-right">PDB reps</th>
                  <th className="px-3 py-2 text-right">AFDB reps</th>
                  <th className="px-3 py-2 text-right">Known %</th>
                  <th className="px-3 py-2 text-right">Predicted %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedSelected.map((s) => {
                  const known = knownPctOf(s, task);
                  const predicted = predictedPctOf(s, task);
                  const isHighlight = HGROUP_HIGHLIGHTS[s.hGroupId] !== undefined;
                  return (
                    <tr
                      key={s.hGroupId}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${isHighlight ? 'bg-amber-50/60 dark:bg-amber-900/10' : ''}`}
                    >
                      <td className="px-3 py-2 font-mono">
                        <Link
                          href={`/h-group/${encodeURIComponent(s.hGroupId)}`}
                          className="text-amber-600 dark:text-amber-400 hover:underline"
                        >
                          {s.hGroupId}
                        </Link>
                        {isHighlight && (
                          <span className="ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                            {HGROUP_HIGHLIGHTS[s.hGroupId].paperFigure}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 max-w-md truncate">
                        {s.hGroupName}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-gray-700 dark:text-gray-300">
                        {s.nPdbReps}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-gray-700 dark:text-gray-300">
                        {s.nAfdbReps}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-gray-700 dark:text-gray-300">
                        {known === null ? '—' : `${known.toFixed(1)}%`}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-gray-900 dark:text-gray-100 font-semibold">
                        {predicted === null ? '—' : `${predicted.toFixed(1)}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
