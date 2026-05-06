'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import type { SuperkingdomBreakdown } from '@/lib/queries';
import { FIG_3B, FIG_3B_CAPTION, type KingdomFractionRow } from '@/lib/paperData';
import PanelCard from './PanelCard';

interface Fig3BPanelProps {
  taxonomy: SuperkingdomBreakdown[];
}

const KINGDOMS = ['Eukaryota', 'Bacteria', 'Archaea'] as const;

function liveFractions(taxonomy: SuperkingdomBreakdown[]): KingdomFractionRow[] | null {
  const totalDomains = taxonomy.reduce((s, t) => s + t.nDomains, 0);
  const totalCys = taxonomy.reduce(
    (s, t) => s + t.nDisulfide + t.nMetal + t.nUnclassified,
    0,
  );
  if (totalDomains === 0 || totalCys === 0) return null;

  return KINGDOMS.map((k) => {
    const row = taxonomy.find((t) => t.superkingdom === k);
    if (!row) return { kingdom: k, domainPct: 0, cysteinePct: 0 };
    const cys = row.nDisulfide + row.nMetal + row.nUnclassified;
    return {
      kingdom: k,
      domainPct: +((row.nDomains / totalDomains) * 100).toFixed(1),
      cysteinePct: +((cys / totalCys) * 100).toFixed(1),
    };
  });
}

export default function Fig3BPanel({ taxonomy }: Fig3BPanelProps) {
  const live = liveFractions(taxonomy);
  const rows = live ?? FIG_3B;
  const dataSource = live ? 'live' : 'paper-snapshot';

  const chartData = rows.map((r) => ({
    kingdom: r.kingdom,
    'Domain fraction': r.domainPct,
    'Cysteine fraction': r.cysteinePct,
  }));

  const csvRows: (string | number)[][] = [
    ['kingdom', 'domain_pct', 'cysteine_pct', 'data_source'],
    ...rows.map((r) => [r.kingdom, r.domainPct, r.cysteinePct, dataSource]),
  ];

  return (
    <PanelCard
      figureLabel="Fig 3B"
      title="Domain vs cysteine fraction by kingdom"
      caption={FIG_3B_CAPTION}
      csvFilename="fig3b_kingdom_fractions.csv"
      csvRows={csvRows}
      anchor="fig3b"
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: 0 }} barCategoryGap={32}>
          <XAxis dataKey="kingdom" />
          <YAxis tickFormatter={(v: number) => `${v}%`} domain={[0, 100]} />
          <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
          <Legend />
          <Bar dataKey="Domain fraction" fill="#6366F1">
            <LabelList dataKey="Domain fraction" position="top" formatter={(v: number) => `${v.toFixed(1)}%`} fontSize={11} />
          </Bar>
          <Bar dataKey="Cysteine fraction" fill="#A855F7">
            <LabelList dataKey="Cysteine fraction" position="top" formatter={(v: number) => `${v.toFixed(1)}%`} fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </PanelCard>
  );
}
