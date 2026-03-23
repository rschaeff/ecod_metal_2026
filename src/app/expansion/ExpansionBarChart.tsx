'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface LevelCounts {
  truth: number;
  predicted: number;
}

interface ExpansionStats {
  disulfide: { x: LevelCounts; t: LevelCounts; f: LevelCounts };
  metal: { x: LevelCounts; t: LevelCounts; f: LevelCounts };
}

interface Props {
  expansionStats: ExpansionStats;
}

export default function ExpansionBarChart({ expansionStats }: Props) {
  const data = [
    {
      level: 'X-Group',
      'Disulfide (Truth)': expansionStats.disulfide.x.truth,
      'Disulfide (+ Predicted)': expansionStats.disulfide.x.predicted,
      'Metal (Truth)': expansionStats.metal.x.truth,
      'Metal (+ Predicted)': expansionStats.metal.x.predicted,
    },
    {
      level: 'T-Group',
      'Disulfide (Truth)': expansionStats.disulfide.t.truth,
      'Disulfide (+ Predicted)': expansionStats.disulfide.t.predicted,
      'Metal (Truth)': expansionStats.metal.t.truth,
      'Metal (+ Predicted)': expansionStats.metal.t.predicted,
    },
    {
      level: 'F-Group',
      'Disulfide (Truth)': expansionStats.disulfide.f.truth,
      'Disulfide (+ Predicted)': expansionStats.disulfide.f.predicted,
      'Metal (Truth)': expansionStats.metal.f.truth,
      'Metal (+ Predicted)': expansionStats.metal.f.predicted,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} barGap={2} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis
          dataKey="level"
          tick={{ fill: '#9CA3AF', fontSize: 13 }}
        />
        <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '0.5rem',
            color: '#F3F4F6',
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Disulfide (Truth)" fill="#D97706" radius={[2, 2, 0, 0]} />
        <Bar dataKey="Disulfide (+ Predicted)" fill="#F59E0B" radius={[2, 2, 0, 0]} />
        <Bar dataKey="Metal (Truth)" fill="#0D9488" radius={[2, 2, 0, 0]} />
        <Bar dataKey="Metal (+ Predicted)" fill="#2DD4BF" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
