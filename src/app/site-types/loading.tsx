export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse">
        {/* Breadcrumb */}
        <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-6" />

        {/* Title */}
        <div className="mb-6">
          <div className="h-7 w-80 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>

        {/* Two-panel layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left panel skeleton */}
          <div className="lg:w-80 shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          </div>

          {/* Right panel skeleton */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
