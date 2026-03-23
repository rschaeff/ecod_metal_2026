'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0D9488', '#F59E0B'];

interface CofactorPieChartProps {
  freeIon: number;
  cofactor: number;
}

export default function CofactorPieChart({ freeIon, cofactor }: CofactorPieChartProps) {
  const data = [
    { name: 'Free Ion', value: freeIon },
    { name: 'Cofactor-Bound', value: cofactor },
  ];

  const total = freeIon + cofactor;

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
