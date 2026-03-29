'use client';

import dynamic from 'next/dynamic';
import type { ConfidenceBucket } from '@/lib/queries';

const ConfidenceBarChart = dynamic(
  () => import('@/components/charts/ConfidenceBarChart'),
  { ssr: false, loading: () => <div className="h-[300px] bg-gray-100 dark:bg-gray-700 rounded animate-pulse" /> }
);

export default function ConfidenceChart({ data }: { data: ConfidenceBucket[] }) {
  return <ConfidenceBarChart data={data} />;
}
