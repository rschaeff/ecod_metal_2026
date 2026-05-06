// The H-group summary query scans every classified F70 representative and
// aggregates per H-group; expect a slow first hit per cache cycle until the
// materialized view (TRICYP_SPEC §"Database changes") lands. Skeleton
// placeholder keeps the page responsive on cold cache.

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8 animate-pulse space-y-3">
        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-8 w-72 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-full max-w-3xl bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
      </header>

      <section className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"
          />
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10 animate-pulse">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 space-y-4"
          >
            <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="grid grid-cols-4 gap-1">
              {Array.from({ length: 16 }).map((_, j) => (
                <div
                  key={j}
                  className="h-20 bg-gray-200 dark:bg-gray-700 rounded"
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
        Loading H-group summaries — first cold-cache hit can take a few seconds.
      </p>
    </div>
  );
}
