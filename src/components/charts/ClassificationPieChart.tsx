'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ClassificationPieChartProps {
  nDisulfide: number;
  nMetalBinding: number;
  nUnclassified: number;
}

const COLORS = ['#DC2626', '#16A34A', '#9CA3AF'];

export default function ClassificationPieChart({ nDisulfide, nMetalBinding, nUnclassified }: ClassificationPieChartProps) {
  const data = [
    { name: 'Disulfide', value: nDisulfide },
    { name: 'Metal-binding', value: nMetalBinding },
    { name: 'Free thiol', value: nUnclassified },
  ];

  const total = nDisulfide + nMetalBinding + nUnclassified;

  const renderLabel = ({ name, value }: { name: string; value: number }) => {
    const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
    return `${name}: ${pct}%`;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={100}
          dataKey="value"
          label={renderLabel}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => {
            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return [`${value.toLocaleString()} (${pct}%)`, name];
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
