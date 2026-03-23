export default function FamilyLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    </div>
  );
}
