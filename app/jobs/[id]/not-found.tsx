import React from 'react';
import Link from 'next/link';

export default function JobNotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-20 text-center space-y-6">
      <h1 className="text-2xl font-semibold">Job Not Found</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">The job you are looking for may have expired or been removed.</p>
      <Link href="/jobs" className="text-blue-600 hover:underline">Back to jobs</Link>
    </main>
  );
}
