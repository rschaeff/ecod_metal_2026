'use client';

import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import type { SuperkingdomBreakdown } from '@/lib/queries';
import { FIG_3B, FIG_3B_CAPTION, type KingdomFractionRow } from '@/lib/paperData';
import PanelCard from './PanelCard';

interface Fig3BPanelProps {
  taxonomy: SuperkingdomBreakdown[];
}

const KINGDOMS = ['Eukaryota', 'Bacteria', 'Archaea'] as const;

// Restrict the denominator to the three cellular superkingdoms so live
// percentages match the paper convention (Viruses are excluded from Fig 3B).
function liveFractions(taxonomy: SuperkingdomBreakdown[]): KingdomFractionRow[] | null {
  const cellular = taxonomy.filter((t) => (KINGDOMS as readonly string[]).includes(t.superkingdom));
  const totalDomains = cellular.reduce((s, t) => s + t.nDomains, 0);
  const totalCys = cellular.reduce(
    (s, t) => s + t.nDisulfide + t.nMetal + t.nUnclassified,
    0,
  );
  if (totalDomains === 0 || totalCys === 0) return null;

  return KINGDOMS.map((k) => {
    const row = cellular.find((t) => t.superkingdom === k);
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
  const router = useRouter();
  const drillDown = (kingdom: string) => {
    router.push(`/family?kingdom=${encodeURIComponent(kingdom)}`);
  };

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
      dataSource={dataSource}
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 24, bottom: 8, left: 0 }}
          barCategoryGap={32}
          onClick={(e) => {
            const kingdom = (e?.activePayload?.[0]?.payload as { kingdom?: string } | undefined)?.kingdom;
            if (kingdom) drillDown(kingdom);
          }}
          style={{ cursor: 'pointer' }}
        >
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
