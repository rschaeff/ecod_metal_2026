export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-3 w-56 bg-gray-200 dark:bg-gray-700 rounded mb-6" />

      <header className="mb-8 space-y-3">
        <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-8 w-72 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
      </header>

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        ))}
      </section>

      <section className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 h-12" />
        <div className="p-6 space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </section>
    </div>
  );
}
