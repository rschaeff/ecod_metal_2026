export default function CrossDomainLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
        <div className="h-[350px] bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    </div>
  );
}
