'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { CLASS_COLORS, CLASS_KEYS } from '@/lib/classColors';
import { FIG_3D, FIG_3D_CAPTION } from '@/lib/paperData';
import PanelCard from './PanelCard';

const data = FIG_3D.map((r) => ({
  compartment: r.compartment,
  [CLASS_KEYS.disulfide]: +(r.disulfideFrac * 100).toFixed(1),
  [CLASS_KEYS.metalBinding]: +(r.metalFrac * 100).toFixed(1),
  n: r.nDomains,
}));

const csvRows: (string | number)[][] = [
  ['compartment', 'n_domains', 'disulfide_pct', 'metal_pct'],
  ...FIG_3D.map((r) => [
    r.compartment,
    r.nDomains,
    +(r.disulfideFrac * 100).toFixed(2),
    +(r.metalFrac * 100).toFixed(2),
  ]),
];

export default function Fig3DPanel() {
  return (
    <PanelCard
      figureLabel="Fig 3D"
      title="Subcellular localization (eukaryotic)"
      caption={FIG_3D_CAPTION}
      csvFilename="fig3d_subcellular.csv"
      csvRows={csvRows}
    >
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 8, right: 24, bottom: 8, left: 16 }}
          barCategoryGap={6}
        >
          <XAxis type="number" domain={[0, 50]} tickFormatter={(v: number) => `${v}%`} />
          <YAxis type="category" dataKey="compartment" width={140} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
            labelFormatter={(label: string) => {
              const row = data.find((d) => d.compartment === label);
              return row ? `${label} (n=${row.n.toLocaleString()})` : label;
            }}
          />
          <Legend />
          <Bar dataKey={CLASS_KEYS.disulfide} fill={CLASS_COLORS.disulfide}>
            <LabelList dataKey={CLASS_KEYS.disulfide} position="right" formatter={(v: number) => `${v.toFixed(1)}%`} fontSize={10} />
          </Bar>
          <Bar dataKey={CLASS_KEYS.metalBinding} fill={CLASS_COLORS.metalBinding}>
            <LabelList dataKey={CLASS_KEYS.metalBinding} position="right" formatter={(v: number) => `${v.toFixed(1)}%`} fontSize={10} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </PanelCard>
  );
}
