'use client';

import dynamic from 'next/dynamic';

const ClassificationPieChart = dynamic(
  () => import('@/components/charts/ClassificationPieChart'),
  { ssr: false, loading: () => <div className="h-[300px] bg-gray-100 dark:bg-gray-700 rounded animate-pulse" /> }
);

interface DashboardChartsProps {
  nDisulfide: number;
  nMetalBinding: number;
  nUnclassified: number;
}

export default function DashboardCharts({ nDisulfide, nMetalBinding, nUnclassified }: DashboardChartsProps) {
  return (
    <ClassificationPieChart
      nDisulfide={nDisulfide}
      nMetalBinding={nMetalBinding}
      nUnclassified={nUnclassified}
    />
  );
}
