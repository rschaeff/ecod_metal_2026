'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { CLASS_COLORS, CLASS_KEYS } from '@/lib/classColors';
import type { SubcellularDistributionRow } from '@/lib/queries';
import { FIG_3D, FIG_3D_CAPTION, type SubcellularRow } from '@/lib/paperData';
import PanelCard from './PanelCard';

interface Fig3DPanelProps {
  // Empty array (no rows from DB) means the live source isn't ready yet —
  // fall back to the paper-frozen FIG_3D constants. Anything non-empty is
  // shown as live.
  subcellular: SubcellularDistributionRow[];
}

// Compartment ordering and visible label (which is shorter than the raw
// `compartment` text in some places, e.g. 'Endoplasmic reticulum' →
// 'Endoplasmic ret.' to fit the y-axis tick).
const COMPARTMENT_ORDER: { key: string; label: string }[] = [
  { key: 'Extracellular',     label: 'Extracellular' },
  { key: 'Plasma membrane',   label: 'Plasma membrane' },
  { key: 'Endoplasmic ret.',  label: 'Endoplasmic ret.' },
  { key: 'Golgi',             label: 'Golgi' },
  { key: 'Lysosome',          label: 'Lysosome' },
  { key: 'Cytoplasm',         label: 'Cytoplasm' },
  { key: 'Nucleus',           label: 'Nucleus' },
  { key: 'Mitochondrion',     label: 'Mitochondrion' },
];

function liveRows(rows: SubcellularDistributionRow[]): SubcellularRow[] | null {
  if (rows.length === 0) return null;
  const byCompartment = new Map(rows.map((r) => [r.compartment, r]));
  return COMPARTMENT_ORDER.map(({ key }) => {
    const r = byCompartment.get(key);
    if (!r || r.totalCys === 0) {
      return { compartment: key, disulfideFrac: 0, metalFrac: 0, nDomains: 0 };
    }
    return {
      compartment: key,
      disulfideFrac: r.nDisulfide / r.totalCys,
      metalFrac: r.nMetal / r.totalCys,
      nDomains: r.nDomains,
    };
  });
}

export default function Fig3DPanel({ subcellular }: Fig3DPanelProps) {
  const live = liveRows(subcellular);
  const rows = live ?? FIG_3D;
  const dataSource = live ? 'live' : 'paper-snapshot';

  const data = rows.map((r) => ({
    compartment: r.compartment,
    [CLASS_KEYS.disulfide]: +(r.disulfideFrac * 100).toFixed(1),
    [CLASS_KEYS.metalBinding]: +(r.metalFrac * 100).toFixed(1),
    n: r.nDomains,
  }));

  const csvRows: (string | number)[][] = [
    ['compartment', 'n_domains', 'disulfide_pct', 'metal_pct', 'data_source'],
    ...rows.map((r) => [
      r.compartment,
      r.nDomains,
      +(r.disulfideFrac * 100).toFixed(2),
      +(r.metalFrac * 100).toFixed(2),
      dataSource,
    ]),
  ];

  return (
    <PanelCard
      title="Subcellular localization (eukaryotic)"
      caption={FIG_3D_CAPTION}
      csvFilename="fig3d_subcellular.csv"
      csvRows={csvRows}
      anchor="fig3d"
    >
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 8, right: 24, bottom: 8, left: 16 }}
          barCategoryGap={6}
        >
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
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
