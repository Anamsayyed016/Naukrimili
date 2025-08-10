import React from 'react';

export default function LoadingJob() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 animate-pulse space-y-4">
      <div className="h-6 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-10 w-32 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="space-y-2 pt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
    </div>
  );
}
