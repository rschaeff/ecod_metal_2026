'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { FamilyDomain } from '@/types/cysteine';

interface FamilyStackedBarProps {
  domains: FamilyDomain[];
}

export default function FamilyStackedBar({ domains }: FamilyStackedBarProps) {
  const data = domains.slice(0, 50).map((d) => ({
    name: d.domainId,
    Disulfide: d.nDisulfide,
    'Metal-binding': d.nMetalBinding,
    'Free thiol': d.nUnclassified,
  }));

  if (data.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: Math.max(600, data.length * 30) }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
            <YAxis label={{ value: 'Cysteines', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Disulfide" stackId="a" fill="#DC2626" />
            <Bar dataKey="Metal-binding" stackId="a" fill="#16A34A" />
            <Bar dataKey="Free thiol" stackId="a" fill="#9CA3AF" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
