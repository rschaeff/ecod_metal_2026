interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  colorClass?: string;
}

export default function StatCard({ title, value, subtitle, colorClass = 'text-amber-600 dark:text-amber-400' }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <p className={`text-3xl font-bold mt-2 ${colorClass}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {subtitle && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
