'use client';

import dynamic from 'next/dynamic';
import type { ConfidenceBucket } from '@/lib/queries';
import { FIG_S3_CAPTION } from '@/lib/paperData';
import PanelCard from './PanelCard';

const ConfidenceBarChart = dynamic(
  () => import('@/components/charts/ConfidenceBarChart'),
  { ssr: false, loading: () => <div className="h-[300px] bg-gray-100 dark:bg-gray-700 rounded animate-pulse" /> },
);

interface FigS3PanelProps {
  data: ConfidenceBucket[];
}

const CLASS_LABEL: Record<string, string> = {
  DISULFIDE: 'disulfide',
  METAL_BINDING: 'metal_binding',
  UNCLASSIFIED: 'free_thiol',
};

export default function FigS3Panel({ data }: FigS3PanelProps) {
  const csvRows: (string | number)[][] = [
    ['confidence_bucket', 'classification', 'count'],
    ...data.map((d) => [d.bucket, CLASS_LABEL[d.classification] ?? d.classification, d.count]),
  ];

  return (
    <PanelCard
      title="ESM2 classification confidence"
      caption={FIG_S3_CAPTION}
      csvFilename="figS3_confidence_distribution.csv"
      csvRows={csvRows}
      anchor="figS3"
    >
      <ConfidenceBarChart data={data} />
    </PanelCard>
  );
}
