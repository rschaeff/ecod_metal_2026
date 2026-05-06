import Link from 'next/link';
import type { SuperkingdomBreakdown } from '@/lib/queries';

interface KingdomMixBarProps {
  taxonomy: SuperkingdomBreakdown[];
  // When true, each segment links to /family?kingdom=X. Use false for
  // contexts (e.g., the family browser itself) where the link would loop.
  linkToBrowser?: boolean;
}

// Stable colour mapping for the four canonical superkingdoms. Distinct from
// the classification palette (red / green / grey) so the kingdom bar reads
// orthogonally on pages that already show classification fractions.
const KINGDOM_COLOR: Record<string, string> = {
  Eukaryota: '#4F46E5',  // indigo-600
  Bacteria:  '#0EA5E9',  // sky-500
  Archaea:   '#F59E0B',  // amber-500
  Viruses:   '#A855F7',  // purple-500
};

const KINGDOM_ORDER = ['Eukaryota', 'Bacteria', 'Archaea', 'Viruses'];

export default function KingdomMixBar({ taxonomy, linkToBrowser = true }: KingdomMixBarProps) {
  const total = taxonomy.reduce((s, t) => s + t.nDomains, 0);
  if (total === 0) return null;

  const ordered = [...taxonomy].sort(
    (a, b) => KINGDOM_ORDER.indexOf(a.superkingdom) - KINGDOM_ORDER.indexOf(b.superkingdom),
  );

  return (
    <div>
      <div className="flex h-3 w-full rounded overflow-hidden border border-gray-200 dark:border-gray-700">
        {ordered.map((t) => {
          const pct = (t.nDomains / total) * 100;
          if (pct === 0) return null;
          const color = KINGDOM_COLOR[t.superkingdom] ?? '#9CA3AF';
          const segment = (
            <div
              key={t.superkingdom}
              style={{ width: `${pct}%`, backgroundColor: color }}
              title={`${t.superkingdom}: ${t.nDomains.toLocaleString()} (${pct.toFixed(1)}%)`}
            />
          );
          if (linkToBrowser) {
            return (
              <Link
                key={t.superkingdom}
                href={`/family?kingdom=${encodeURIComponent(t.superkingdom)}`}
                aria-label={`Filter family browser to ${t.superkingdom}`}
                className="hover:brightness-110 transition-[filter]"
                style={{ width: `${pct}%`, backgroundColor: color }}
                title={`${t.superkingdom}: ${t.nDomains.toLocaleString()} (${pct.toFixed(1)}%)`}
              />
            );
          }
          return segment;
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
        {ordered.map((t) => {
          const pct = (t.nDomains / total) * 100;
          const color = KINGDOM_COLOR[t.superkingdom] ?? '#9CA3AF';
          return (
            <span key={t.superkingdom} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              {t.superkingdom}{' '}
              <span className="font-mono text-gray-500 dark:text-gray-400">
                {t.nDomains.toLocaleString()} ({pct.toFixed(1)}%)
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
