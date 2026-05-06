export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
      <div className="h-7 w-56 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
      <div className="h-4 w-72 bg-gray-200 dark:bg-gray-700 rounded mb-6" />

      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-2">
        <div className="grid grid-cols-8 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
        {Array.from({ length: 12 }).map((_, row) => (
          <div key={row} className="grid grid-cols-8 gap-3 pt-2">
            {Array.from({ length: 8 }).map((_, col) => (
              <div key={col} className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
