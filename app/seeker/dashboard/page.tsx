import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function SeekerDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Jobseeker Dashboard</h1>
        <p className="text-gray-600">Welcome! Use the links below to manage your profile and applications.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/profile" className="block p-4 rounded-lg border hover:bg-gray-50">
            Update Profile
          </Link>
          <Link href="/resumes/upload" className="block p-4 rounded-lg border hover:bg-gray-50">
            Upload Resume
          </Link>
          <Link href="/jobs" className="block p-4 rounded-lg border hover:bg-gray-50">
            Browse Jobs
          </Link>
          <Link href="/messages" className="block p-4 rounded-lg border hover:bg-gray-50">
            Messages
          </Link>
        </div>
      </div>
    </div>
  );
}


