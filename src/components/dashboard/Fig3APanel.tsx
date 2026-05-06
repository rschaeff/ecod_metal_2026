'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { CLASS_COLORS, CLASS_KEYS } from '@/lib/classColors';
import { FIG_3A, FIG_3A_CAPTION } from '@/lib/paperData';
import PanelCard from './PanelCard';

const data = FIG_3A.map((r) => ({
  source: r.source,
  n: r.nDomains,
  [CLASS_KEYS.freeThiol]: +(r.freeThiolFrac * 100).toFixed(1),
  [CLASS_KEYS.disulfide]: +(r.disulfideFrac * 100).toFixed(1),
  [CLASS_KEYS.metalBinding]: +(r.metalFrac * 100).toFixed(1),
}));

const csvRows: (string | number)[][] = [
  ['source', 'n_domains', 'free_thiol_pct', 'disulfide_pct', 'metal_binding_pct'],
  ...FIG_3A.map((r) => [
    r.source,
    r.nDomains,
    +(r.freeThiolFrac * 100).toFixed(1),
    +(r.disulfideFrac * 100).toFixed(1),
    +(r.metalFrac * 100).toFixed(1),
  ]),
];

export default function Fig3APanel() {
  return (
    <PanelCard
      title="Cysteine fates by classification source"
      caption={FIG_3A_CAPTION}
      csvFilename="fig3a_source_stratification.csv"
      csvRows={csvRows}
      anchor="fig3a"
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 8, right: 24, bottom: 8, left: 24 }}
          barCategoryGap={16}
        >
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
          <YAxis type="category" dataKey="source" width={90} />
          <Tooltip
            formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
            labelFormatter={(label: string) => {
              const row = data.find((d) => d.source === label);
              return row ? `${label} (n=${row.n.toLocaleString()})` : label;
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
