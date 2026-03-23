export default function ValidationLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-4">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              </div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
