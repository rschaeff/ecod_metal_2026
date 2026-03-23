export default function ExpansionLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Breadcrumb */}
      <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6" />

      {/* Title */}
      <div className="mb-8">
        <div className="h-7 w-96 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-4 w-[28rem] bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* Expansion tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-56" />
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-56" />
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-[420px] mb-10" />

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-96" />
    </div>
  );
}
