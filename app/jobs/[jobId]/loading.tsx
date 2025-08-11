export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <header className="space-y-2">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2 animate-pulse" />
        <div className="flex items-center gap-3 pt-2">
          <div className="h-10 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-20 animate-pulse" />
        </div>
      </header>
      <article className="space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2 animate-pulse" />
      </article>
    </main>
  );
}
