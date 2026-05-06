'use client';

import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import type { SuperkingdomBreakdown } from '@/lib/queries';
import { CLASS_COLORS, CLASS_KEYS } from '@/lib/classColors';
import { FIG_3C_CAPTION } from '@/lib/paperData';
import PanelCard from './PanelCard';

interface Fig3CPanelProps {
  taxonomy: SuperkingdomBreakdown[];
}

const KINGDOMS = ['Bacteria', 'Archaea', 'Eukaryota'] as const;

export default function Fig3CPanel({ taxonomy }: Fig3CPanelProps) {
  const router = useRouter();
  const drillDown = (kingdom: string) => {
    router.push(`/family?kingdom=${encodeURIComponent(kingdom)}`);
  };

  const rows = KINGDOMS.map((k) => {
    const row = taxonomy.find((t) => t.superkingdom === k);
    if (!row) {
      return { kingdom: k, dis: 0, met: 0, neg: 0, total: 0 };
    }
    const total = row.nDisulfide + row.nMetal + row.nUnclassified;
    return {
      kingdom: k,
      dis: row.nDisulfide,
      met: row.nMetal,
      neg: row.nUnclassified,
      total,
    };
  });

  const chartData = rows.map((r) => ({
    kingdom: r.kingdom,
    [CLASS_KEYS.freeThiol]: r.total > 0 ? +((r.neg / r.total) * 100).toFixed(1) : 0,
    [CLASS_KEYS.disulfide]: r.total > 0 ? +((r.dis / r.total) * 100).toFixed(1) : 0,
    [CLASS_KEYS.metalBinding]: r.total > 0 ? +((r.met / r.total) * 100).toFixed(1) : 0,
  }));

  const csvRows: (string | number)[][] = [
    ['kingdom', 'n_disulfide', 'n_metal_binding', 'n_free_thiol', 'total_cys', 'disulfide_pct', 'metal_pct', 'free_thiol_pct'],
    ...rows.map((r) => [
      r.kingdom,
      r.dis,
      r.met,
      r.neg,
      r.total,
      r.total > 0 ? +((r.dis / r.total) * 100).toFixed(2) : 0,
      r.total > 0 ? +((r.met / r.total) * 100).toFixed(2) : 0,
      r.total > 0 ? +((r.neg / r.total) * 100).toFixed(2) : 0,
    ]),
  ];

  return (
    <PanelCard
      title="Per-kingdom classification rates"
      caption={FIG_3C_CAPTION}
      csvFilename="fig3c_kingdom_rates.csv"
      csvRows={csvRows}
      anchor="fig3c"
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 8, right: 24, bottom: 8, left: 24 }}
          barCategoryGap={16}
          onClick={(e) => {
            const kingdom = (e?.activePayload?.[0]?.payload as { kingdom?: string } | undefined)?.kingdom;
            if (kingdom) drillDown(kingdom);
          }}
          style={{ cursor: 'pointer' }}
        >
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
          <YAxis type="category" dataKey="kingdom" width={90} />
          <Tooltip formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]} />
          <Legend />
          <Bar dataKey={CLASS_KEYS.freeThiol} stackId="a" fill={CLASS_COLORS.freeThiol}>
            <LabelList dataKey={CLASS_KEYS.freeThiol} position="center" formatter={(v: number) => (v >= 8 ? `${v.toFixed(1)}%` : '')} fill="#fff" fontSize={11} />
          </Bar>
          <Bar dataKey={CLASS_KEYS.disulfide} stackId="a" fill={CLASS_COLORS.disulfide}>
            <LabelList dataKey={CLASS_KEYS.disulfide} position="center" formatter={(v: number) => (v >= 8 ? `${v.toFixed(1)}%` : '')} fill="#fff" fontSize={11} />
          </Bar>
          <Bar dataKey={CLASS_KEYS.metalBinding} stackId="a" fill={CLASS_COLORS.metalBinding}>
            <LabelList dataKey={CLASS_KEYS.metalBinding} position="center" formatter={(v: number) => (v >= 5 ? `${v.toFixed(1)}%` : '')} fill="#fff" fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </PanelCard>
  );
}
