'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartRow {
  xGroupId: string;
  xGroupName: string;
  intra: number;
  crossDomain: number;
}

interface CrossDomainChartProps {
  data: ChartRow[];
}

export default function CrossDomainChart({ data }: CrossDomainChartProps) {
  const chartData = data.map((d) => ({
    name: d.xGroupName.length > 20 ? d.xGroupName.slice(0, 18) + '...' : d.xGroupName,
    Intradomain: d.intra,
    'Cross-Domain': d.crossDomain,
  }));

  if (chartData.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: Math.max(600, chartData.length * 50) }}>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 10 }} />
            <YAxis label={{ value: 'SSBONDs', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Intradomain" stackId="a" fill="#0D9488" />
            <Bar dataKey="Cross-Domain" stackId="a" fill="#F59E0B" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
