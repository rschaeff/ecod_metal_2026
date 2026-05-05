'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import type { SourceTypeBreakdown } from '@/lib/queries';
import { CLASS_COLORS, CLASS_KEYS } from '@/lib/classColors';
import { FIG_S2_CAPTION } from '@/lib/paperData';
import PanelCard from './PanelCard';

interface FigS2PanelProps {
  sources: SourceTypeBreakdown[];
}

const SOURCE_LABELS: Record<string, string> = {
  pdb: 'PDB',
  afdb: 'AFDB',
  prodigal: 'Prodigal',
  uniparc: 'UniParc',
};

export default function FigS2Panel({ sources }: FigS2PanelProps) {
  const data = sources.map((s) => {
    const total = s.nDisulfide + s.nMetal + s.nUnclassified;
    return {
      source: SOURCE_LABELS[s.sourceType] ?? s.sourceType.toUpperCase(),
      n: s.nDomains,
      [CLASS_KEYS.freeThiol]: total > 0 ? +((s.nUnclassified / total) * 100).toFixed(1) : 0,
      [CLASS_KEYS.disulfide]: total > 0 ? +((s.nDisulfide / total) * 100).toFixed(1) : 0,
      [CLASS_KEYS.metalBinding]: total > 0 ? +((s.nMetal / total) * 100).toFixed(1) : 0,
    };
  });

  const csvRows: (string | number)[][] = [
    ['source_type', 'n_domains', 'n_disulfide', 'n_metal_binding', 'n_free_thiol'],
    ...sources.map((s) => [s.sourceType, s.nDomains, s.nDisulfide, s.nMetal, s.nUnclassified]),
  ];

  return (
    <PanelCard
      figureLabel="Fig S2"
      title="Source-type breakdown"
      caption={FIG_S2_CAPTION}
      csvFilename="figS2_source_breakdown.csv"
      csvRows={csvRows}
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 8, right: 24, bottom: 8, left: 24 }}
          barCategoryGap={12}
        >
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
          <YAxis type="category" dataKey="source" width={90} />
          <Tooltip
            formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
            labelFormatter={(label: string) => {
              const row = data.find((d) => d.source === label);
              return row ? `${label} (n=${row.n.toLocaleString()} domains)` : label;
            }}
          />
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
