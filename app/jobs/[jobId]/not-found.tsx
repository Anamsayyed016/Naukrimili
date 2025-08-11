import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <AlertCircle className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
      <h1 className="mt-4 text-xl font-semibold">Job not found</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        The job you're looking for might have been removed or doesn't exist.
      </p>
      <Button asChild className="mt-6">
        <Link href="/jobs">Browse all jobs</Link>
      </Button>
    </main>
  );
}
