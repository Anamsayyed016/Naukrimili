
// Static export support for dynamic route /jobs/[jobId]
// If you add real jobs, replace the placeholder list generation below.
export async function generateStaticParams() {
  // TODO: fetch real jobIds e.g.: const jobs = await fetch(process.env.JOBS_FEED_URL!).then(r=>r.json())
  const jobIds = ['example-job-id'];
  return jobIds.map(jobId => ({ jobId }));
}

// Disable dynamic params fallback for static export
export const dynamicParams = false; // only build the IDs returned above
export const revalidate = false; // no ISR needed for placeholder page

interface JobDetailPageProps { params: { jobId: string } }

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const { jobId } = params;
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Job Details</h1>
      <p className="text-gray-600 mb-2">Static export placeholder for job: <span className="font-mono">{jobId}</span></p>
      <p className="text-gray-500 text-sm">Replace the placeholder implementation in <code>app/jobs/[jobId]/page.tsx</code> and update generateStaticParams() to output real job IDs for production.</p>
    </div>
  );
}
