
// Fix for static export: add generateStaticParams
export async function generateStaticParams() {
  // Example: return at least one param for static export
  return [{ id: 'example-job-id' }];
}

export default function JobDetailPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Job Details</h1>
      <p className="text-gray-600">This page is under development.</p>
    </div>
  );
}