'use client';
import useSWR from 'swr';
import { getDemoFeaturedJobs } from '@/lib/demo-data';

const fetcher = async () => getDemoFeaturedJobs();

export default function FeaturedJobs() {
  const { data, error, isLoading } = useSWR('demo-featured-jobs', fetcher);

  if (isLoading) return <div>Loading featured jobs...</div>;
  if (error) return <div>Failed to load jobs.</div>;
  if (!data) return <div>No jobs available.</div>;

  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold mb-4">Featured Jobs</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.jobs.map((job: Record<string, unknown>) => (
          <div key={job.id} className="p-4 bg-white rounded shadow">
            <h3 className="font-semibold">{job.title}</h3>
            <p>{job.company}</p>
            <p>{job.location}</p>
          </div>
        ))}
      </div>
    </section>
  );
} 