export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-3 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 space-y-3">
            <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 space-y-3">
            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>

        <div className="space-y-6">
          {/* 3D viewer placeholder — matches the sidebar pane */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 h-7" />
            <div className="h-72 bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 space-y-2">
            <div className="h-5 w-44 bg-gray-200 dark:bg-gray-700 rounded" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 space-y-2">
            <div className="h-5 w-36 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
