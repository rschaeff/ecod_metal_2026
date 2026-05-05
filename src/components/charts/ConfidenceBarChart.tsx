'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ConfidenceBucket } from '@/lib/queries';

interface ConfidenceBarChartProps {
  data: ConfidenceBucket[];
}

const BUCKETS = ['<0.3', '0.3-0.4', '0.4-0.5', '0.5-0.6', '0.6-0.7', '0.7-0.8', '0.8-0.9', '0.9-1.0'];

export default function ConfidenceBarChart({ data }: ConfidenceBarChartProps) {
  const chartData = BUCKETS.map((bucket) => {
    const dis = data.find((d) => d.bucket === bucket && d.classification === 'DISULFIDE');
    const met = data.find((d) => d.bucket === bucket && d.classification === 'METAL_BINDING');
    const unc = data.find((d) => d.bucket === bucket && d.classification === 'UNCLASSIFIED');
    return {
      bucket,
      Disulfide: dis?.count || 0,
      'Metal-binding': met?.count || 0,
      'Free thiol': unc?.count || 0,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
        <Tooltip formatter={(value: number) => value.toLocaleString()} />
        <Legend />
        <Bar dataKey="Disulfide" stackId="a" fill="#DC2626" />
        <Bar dataKey="Metal-binding" stackId="a" fill="#16A34A" />
        <Bar dataKey="Free thiol" stackId="a" fill="#9CA3AF" />
      </BarChart>
    </ResponsiveContainer>
  );
}
