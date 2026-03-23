import Link from 'next/link';

export default function DomainNotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Domain Not Found</h1>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
        The requested domain could not be found in the database.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
