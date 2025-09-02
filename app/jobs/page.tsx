import { Suspense } from 'react';
import JobsClient from './JobsClient';
import { getJobs } from '@/lib/jobs/serverFetchJobs';

export default async function JobsPage() {
  const initialJobs = await getJobs({ limit: 20 });
  
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
      <JobsClient initialJobs={initialJobs} />
    </Suspense>
  );
}