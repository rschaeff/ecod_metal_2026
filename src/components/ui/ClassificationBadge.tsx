interface ClassificationBadgeProps {
  classification: 'DISULFIDE' | 'METAL_BINDING' | 'UNCLASSIFIED';
  size?: 'sm' | 'md';
}

const styles = {
  DISULFIDE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  METAL_BINDING: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  UNCLASSIFIED: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const labels = {
  DISULFIDE: 'Disulfide',
  METAL_BINDING: 'Metal-binding',
  UNCLASSIFIED: 'Free thiol',
};

export default function ClassificationBadge({ classification, size = 'sm' }: ClassificationBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${styles[classification]}`}>
      {labels[classification]}
    </span>
  );
}
